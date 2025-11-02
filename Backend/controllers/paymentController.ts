import { Request, Response } from "express";
import mongoose from "mongoose";
import { Expense } from "../models/Expense";
import { Split } from "../models/Split";
import { Group } from "../models/Group";
import { Membership } from "../models/Membership";

/**
 * POST /api/groups/:slug/expenses
 * Dodaje nowy wydatek z podziałem między uczestników.
 * Body: { payerId, description, category, date, amountCents, splits: [{userId, amountCents}] }
 * Walidacja: suma splitów === amountCents, uczestnicy są członkami grupy
 */
export const addPayment = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const group = await Group.findOne({ slug }).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    // @ts-ignore
    const currentUserId = req.user?._id;
    const isMember = await Membership.exists({
      groupId: group._id,
      userId: currentUserId,
      status: "active",
    });
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    const { payerId, description, category, date, amountCents, currency, splits } = req.body;

    // Walidacja podstawowa
    if (
      !payerId ||
      !date ||
      !Number.isInteger(amountCents) ||
      amountCents <= 0 ||
      !Array.isArray(splits) ||
      splits.length === 0
    ) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // Sprawdź czy suma splitów === amountCents
    const totalSplits = splits.reduce((sum, s) => sum + (s.amountCents || 0), 0);
    if (totalSplits !== amountCents) {
      return res
        .status(400)
        .json({ message: "Suma podziałów musi być równa całkowitej kwocie wydatku" });
    }

    // Sprawdź czy wszyscy uczestnicy splitów są aktywnymi członkami grupy
    const splitUserIds = splits.map((s: any) => new mongoose.Types.ObjectId(s.userId));
    const activeMembersCount = await Membership.countDocuments({
      groupId: group._id,
      userId: { $in: splitUserIds },
      status: "active",
    });
    if (activeMembersCount < splitUserIds.length) {
      return res.status(400).json({ message: "Wszyscy uczestnicy muszą być członkami grupy" });
    }

    // Sprawdź czy payer jest członkiem
    const payerIsMember = await Membership.exists({
      groupId: group._id,
      userId: payerId,
      status: "active",
    });
    if (!payerIsMember) {
      return res.status(400).json({ message: "Płacący musi być członkiem grupy" });
    }

    // Rozpocznij transakcję (wymaga replica set w Mongo)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Utwórz wydatek
      const [expense] = await Expense.create(
        [
          {
            groupId: group._id,
            payerId,
            description: description || "",
            category: category || "",
            date: new Date(date),
            amountCents,
            createdBy: currentUserId,
          },
        ],
        { session }
      );

      // Utwórz Split dokumenty
      const splitDocs = splits.map((s: any) => ({
        expenseId: expense._id,
        groupId: group._id,
        userId: s.userId,
        amountCents: s.amountCents,
      }));

      await Split.insertMany(splitDocs, { session });

      await session.commitTransaction();

      return res.status(201).json({
        message: "Wydatek dodany pomyślnie",
        expense: {
          _id: expense._id,
          groupId: expense.groupId,
          payerId: expense.payerId,
          description: expense.description,
          category: expense.category,
          date: expense.date,
          amountCents: expense.amountCents,
        },
      });
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  } catch (err: any) {
    console.error("Błąd dodawania wydatku:", err);
    return res.status(500).json({ message: "Błąd serwera" });
  }
};

/**
 * GET /api/groups/:slug/balances
 * Wylicza salda uczestników grupy (kto komu jest winny)
 * Zwraca: { balances: [{ userId, name, email, paidCents, owedCents, netCents }] }
 * netCents > 0 → user powinien dostać pieniądze
 * netCents < 0 → user jest winny pieniądze
 * suma wszystkich netCents powinna być 0
 */
export const getBalances = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const group = await Group.findOne({ slug }).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    // @ts-ignore
    const currentUserId = req.user?._id;
    const isMember = await Membership.exists({
      groupId: group._id,
      userId: currentUserId,
      status: "active",
    });
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    const groupId = group._id;

    // 1) Suma zapłaconych kwot per payer (z Expense)
    const paidAgg = await Expense.aggregate([
      { $match: { groupId } },
      { $group: { _id: "$payerId", paid: { $sum: "$amountCents" } } },
    ]);

    // 2) Suma należnych kwot per user (z Split)
    const owedAgg = await Split.aggregate([
      { $match: { groupId } },
      { $group: { _id: "$userId", owed: { $sum: "$amountCents" } } },
    ]);

    // Mapuj wyniki
    const mapPaid = new Map((paidAgg || []).map((r: any) => [String(r._id), r.paid]));
    const mapOwed = new Map((owedAgg || []).map((r: any) => [String(r._id), r.owed]));

    // Pobierz aktywnych członków grupy z ich danymi
    const members = await Membership.find({ groupId, status: "active" })
      .populate({ path: "userId", select: "name email" })
      .lean();

    const balances = members.map((m: any) => {
      const id = String(m.userId._id);
      const paid = mapPaid.get(id) || 0;
      const owed = mapOwed.get(id) || 0;
      const netCents = paid - owed; // >0 user dostaje pieniądze; <0 user jest winny
      return {
        userId: m.userId._id,
        name: m.userId.name,
        email: m.userId.email,
        paidCents: paid,
        owedCents: owed,
        netCents,
      };
    });

    // Opcjonalna walidacja: suma wszystkich netCents powinna być 0
    const totalNet = balances.reduce((s, b) => s + b.netCents, 0);
    if (totalNet !== 0) {
      console.warn(`[getBalances] Total net balance != 0: ${totalNet} (group: ${slug})`);
    }

    return res.status(200).json({ balances });
  } catch (err: any) {
    console.error("Błąd wyliczania sald:", err);
    return res.status(500).json({ message: "Błąd serwera" });
  }
};
