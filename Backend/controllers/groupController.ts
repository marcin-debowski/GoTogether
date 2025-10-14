import { Request, Response } from "express";
import mongoose from "mongoose";
import { Group } from "../models/Group";
import { Membership } from "../models/Membership";
import User from "../models/User";
import { slugify } from "../utils/slug";

interface GroupRequestBody {
  name: string;
  place?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

function parseDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v as any);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * POST /api/groups
 * Input (JSON body): { name: string, place?: string, startDate?: string|Date, endDate?: string|Date }
 * Output: 201 { group } | 400/401/409/500
 * Wymaga autoryzacji (req.user)
 */
export const createGroup = async (req: Request, res: Response) => {
  // @ts-ignore
  const currentUser = req.user;
  if (!currentUser?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const {
    name: rawName,
    place: rawPlace,
    startDate: rawStart,
    endDate: rawEnd,
  } = (req.body || {}) as GroupRequestBody;

  const name = String(rawName ?? "").trim();
  const place = rawPlace ? String(rawPlace).trim() : undefined;
  const startDate = parseDate(rawStart);
  const endDate = parseDate(rawEnd);

  if (!name) {
    return res.status(400).json({ message: "Nazwa grupy jest wymagana" });
  }
  if (startDate && endDate && startDate > endDate) {
    return res.status(400).json({ message: "Data zakończenia musi być po dacie rozpoczęcia" });
  }

  const session = await mongoose.startSession();
  let createdGroup: any;

  // helper: generuje unikalny slug z nazwą i sufiksami -2, -3, ...
  async function generateUniqueSlug(name: string) {
    const base = slugify(name);
    let candidate = base || "grupa";
    let i = 2;
    // używamy sesji jeśli transakcja
    // @ts-ignore
    while (await Group.exists({ slug: candidate }).session(session)) {
      candidate = `${base}-${i++}`;
    }
    return candidate;
  }

  try {
    await session.withTransaction(async () => {
      const slug = await generateUniqueSlug(name);

      const [group] = await Group.create(
        [
          {
            name,
            slug,
            ownerId: currentUser._id,
            place,
            startDate,
            endDate,
            // membersCount: 1,
          } as any,
        ],
        { session }
      );
      await Membership.create(
        [
          {
            userId: currentUser._id,
            groupId: group._id,
            role: "admin",
            status: "active",
            joinedAt: new Date(),
          } as any,
        ],
        { session }
      );

      createdGroup = group;
    });

    return res.status(201).json(createdGroup);
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return res.status(409).json({ message: "Slug already exists" });
    }
    console.error("Error creating group:", error);
    return res.status(500).json({ error: "Failed to create group" });
  } finally {
    session.endSession();
  }
};

export const getGroup = async (req: Request, res: Response) => {};

export const addMemberToGroup = async (req: Request, res: Response) => {
  // @ts-ignore
  const currentUser = req.user;
  const slug = req.params.slug;
  const { email } = req.body;

  if (!currentUser?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!slug || !email) {
    return res.status(400).json({ message: "Group group name and User Email are required" });
  }

  try {
    const [group, user] = await Promise.all([Group.findOne({ slug }), User.findOne({ email })]);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!user) return res.status(404).json({ message: "User not found" });

    // tylko ADMIN w Membership może dodawać członków
    const adminMembership = await Membership.findOne({
      userId: currentUser._id,
      groupId: group._id,
      role: "admin",
      status: "active",
    });
    if (!adminMembership) {
      return res.status(403).json({ message: "Only group admin can add members" });
    }

    const result = await Membership.updateOne(
      { userId: user._id, groupId: group._id },
      {
        $setOnInsert: {
          userId: user._id,
          groupId: group._id,
          role: "member",
          status: "active",
          joinedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const inserted =
      // Mongoose w zależności od wersji zwraca upsertedCount lub upsertedId
      // @ts-ignore
      result.upsertedCount === 1 || !!(result as any).upsertedId;

    return res.status(200).json({
      message: inserted ? "Member added to group" : "User is already a member",
    });
  } catch (error) {
    console.error("Error adding member to group:", error);
    return res.status(500).json({ error: "Failed to add member to group" });
  }
};

export const removeMember = async (req: Request, res: Response) => {};
