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
 * Behavior:
 *  - Generuje unikalny slug na podstawie 'name' (slugify + sufiksy -2, -3, ... w razie kolizji)
 *  - ownerId ustawiany z req.user
 *  - Tworzy Membership dla zakładającego: role "admin", status "active"
 * Output:
 *  - 201 { _id, name, slug, place?, startDate?, endDate?, ... }
 *  - 400 gdy brak nazwy lub niepoprawne daty
 *  - 401 gdy brak autoryzacji
 *  - 409 gdy kolizja sluga (unikalne)
 *  - 500 w przypadku błędu serwera
 * Auth: wymagane (req.user)
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
  if (startDate && endDate && (startDate > endDate || startDate === endDate)) {
    return res
      .status(400)
      .json({ message: "Data zakończenia nie moze być przed datą rozpoczęcia" });
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

/**
 * GET /api/groups
 * Behavior:
 *  - Zwraca lekką listę grup użytkownika (bez populate)
 *  - 2 kroki: Membership (tylko ID) -> Group (tylko wybrane pola)
 * Output:
 *  - 200 { groups: Array<{ _id, name, slug, membersCount? }> }
 *  - 401 gdy brak autoryzacji
 */
export const listGroups = async (req: Request, res: Response) => {
  // @ts-ignore
  const currentUser = req.user;
  if (!currentUser?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // 1) weź tylko ID grup z Membership (covered index: { userId, status, groupId })
    const mems = await Membership.find(
      { userId: currentUser._id, status: "active" },
      { groupId: 1, _id: 0 }
    ).lean();

    const groupIds = mems.map((m) => m.groupId);
    if (groupIds.length === 0) {
      return res.status(200).json({ groups: [] });
    }

    // 2) pobierz lekkie dane grup
    const groups = await Group.find(
      { _id: { $in: groupIds } },
      { name: 1, slug: 1, membersCount: 1, place: 1, startDate: 1, endDate: 1 }
    )
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ groups });
  } catch (error) {
    console.error("Error listing groups:", error);
    return res.status(500).json({ error: "Failed to list groups" });
  }
};

/**
 * GET /api/groups/:slug
 * Params:
 *  - slug: string
 * Behavior:
 *  - Zwraca pełne dane grupy po slug
 *  - (opcjonalnie) sprawdza, że użytkownik jest członkiem
 * Output:
 *  - 200 { group }
 *  - 403 jeśli nie jest członkiem (jeśli włączona weryfikacja)
 *  - 404 gdy nie znaleziono
 */
export const getGroup = async (req: Request, res: Response) => {
  // @ts-ignore
  const currentUser = req.user;
  const { slug } = req.params;

  try {
    const group = await Group.findOne({ slug }).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Weryfikacja członkostwa (włącz, jeśli dostęp ma być tylko dla członków)
    const isMember = await Membership.exists({
      userId: currentUser?._id,
      groupId: group._id,
      status: "active",
    });
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json({ group });
  } catch (error) {
    console.error("Error getting group:", error);
    return res.status(500).json({ error: "Failed to get group" });
  }
};

/**
 * POST /api/groups/:slug/members
 * Params:
 *  - slug: string (slug grupy)
 * Input (JSON body):
 *  - { email: string } – email użytkownika, którego chcesz dodać
 * Behavior:
 *  - Tylko użytkownik z Membership.role = "admin" i status = "active" w tej grupie może dodawać
 *  - Upsert do Membership: { userId, groupId, role: "member", status: "active", joinedAt }
 * Output:
 *  - 200 { message: "Member added to group" | "User is already a member" }
 *  - 400 gdy brakuje slug lub email
 *  - 401 gdy brak autoryzacji
 *  - 403 gdy brak uprawnień admina w grupie
 *  - 404 gdy nie znaleziono grupy lub użytkownika
 *  - 500 w przypadku błędu serwera
 * Auth: wymagane (admin grupy)
 */
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

    // Jeśli faktycznie dodaliśmy nowego członka, zwiększ licznik grupy
    if (inserted) {
      await Group.updateOne({ _id: group._id }, { $inc: { membersCount: 1 } });
    }

    return res.status(200).json({
      message: inserted ? "Member added to group" : "User is already a member",
    });
  } catch (error) {
    console.error("Error adding member to group:", error);
    return res.status(500).json({ error: "Failed to add member to group" });
  }
};

export const membersList = async (req: Request, res: Response) => {
  // @ts-ignore
  const currentUser = req.user;
  const { slug } = req.params;
  const { limit: rawLimit, after: rawAfter, search: rawSearch } = req.query as any;

  if (!currentUser?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Parse pagination
  let limit = Number.parseInt(String(rawLimit ?? "20"), 10);
  if (Number.isNaN(limit) || limit <= 0) limit = 20;
  limit = Math.min(limit, 100); // cap

  let afterId: mongoose.Types.ObjectId | undefined;
  if (rawAfter) {
    try {
      afterId = new mongoose.Types.ObjectId(String(rawAfter));
    } catch (e) {
      return res.status(400).json({ message: "Invalid 'after' cursor" });
    }
  }

  const search = typeof rawSearch === "string" && rawSearch.trim() ? rawSearch.trim() : undefined;
  const searchRegex = search
    ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    : undefined;

  try {
    const group = await Group.findOne({ slug }).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Weryfikacja członkostwa
    const isMember = await Membership.exists({
      userId: currentUser._id,
      groupId: group._id,
      status: "active",
    });
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Aggregation: page on Membership._id for stable cursor, join Users, optional search
    const match: any = { groupId: group._id, status: "active" };
    if (afterId) match._id = { $gt: afterId };

    const pipeline: any[] = [
      { $match: match },
      { $sort: { _id: 1 } },
      { $limit: limit + 1 }, // fetch one extra to compute nextCursor
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ];

    if (searchRegex) {
      pipeline.push({
        $match: {
          $or: [
            { "user.name": { $regex: searchRegex } },
            { "user.email": { $regex: searchRegex } },
          ],
        },
      });
    }

    pipeline.push({
      $project: {
        membershipId: "$_id",
        role: 1,
        joinedAt: 1,
        user: { _id: 1, name: 1, email: 1 },
        _id: 0,
      },
    });

    const rows = await Membership.aggregate(pipeline);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? String(page[page.length - 1].membershipId) : null;

    const members = page.map((r: any) => ({
      _id: r.user._id,
      name: r.user.name,
      email: r.user.email,
      role: r.role,
      joinedAt: r.joinedAt,
      isOwner: r.user._id.toString() === group.ownerId.toString(),
    }));

    // totalCount: korzystamy z licznika w dokumencie grupy (aktualizowany przy add/remove)
    const totalCount = (group as any).membersCount ?? undefined;

    return res.status(200).json({ members, nextCursor, totalCount });
  } catch (error) {
    console.error("Error getting members list:", error);
    return res.status(500).json({ error: "Failed to get members list" });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  // @ts-ignore
  const currentUser = req.user;
  const { slug, memberId } = req.params;

  if (!currentUser?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const [group, userToRemove] = await Promise.all([
      Group.findOne({ slug }),
      User.findById(memberId),
    ]);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!userToRemove) return res.status(404).json({ message: "User not found" });

    // tylko ADMIN w Membership może usuwać członków
    const adminMembership = await Membership.findOne({
      userId: currentUser._id,
      groupId: group._id,
      role: "admin",
      status: "active",
    });
    if (!adminMembership) {
      return res.status(403).json({ message: "Only group admin can remove members" });
    }

    // Usuń członkostwo
    const result = await Membership.deleteOne({
      userId: userToRemove._id,
      groupId: group._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Membership not found" });
    }

    // Zmniejsz licznik członków o 1 (nie pozwoli to spaść poniżej zera, jeśli licznik był 0 to będzie -1,
    // zakładamy jednak poprawność danych — alternatywnie można dodać dodatkową walidację)
    await Group.updateOne({ _id: group._id }, { $inc: { membersCount: -1 } });

    return res.status(200).json({ message: "Member removed from group" });
  } catch (error) {
    console.error("Error removing member from group:", error);
    return res.status(500).json({ error: "Failed to remove member from group" });
  }
};
