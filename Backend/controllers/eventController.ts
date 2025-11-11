import { Request, Response } from "express";
import mongoose from "mongoose";
import { Event } from "../models/Event";
import { Group } from "../models/Group";
import { Membership } from "../models/Membership";

/**
 * POST /api/groups/:slug/events
 * Dodaje nowy event do grupy
 * Body: { title, description, durationHours, location }
 */
export const postEvent = async (req: Request, res: Response) => {
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

    const { title, description, durationHours, location } = req.body;

    // Walidacja
    if (!title || !description || !location) {
      return res.status(400).json({ message: "Title, description, and location are required" });
    }

    if (typeof durationHours !== "number" || durationHours < 0 || !Number.isFinite(durationHours)) {
      return res.status(400).json({ message: "Invalid duration" });
    }

    // Utwórz event
    const event = await Event.create({
      title,
      description,
      durationHours,
      location,
      groupId: group._id,
      createdBy: currentUserId,
    });

    return res.status(201).json(event);
  } catch (err) {
    console.error("Error creating event:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/groups/:slug/events
 * Pobiera wszystkie eventy dla grupy
 */
export const getEvents = async (req: Request, res: Response) => {
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

    const events = await Event.find({ groupId: group._id })
      .sort({ _id: -1 }) // newest first
      .populate("createdBy", "name email")
      .lean();

    return res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/groups/:slug/events/:eventId
 * Aktualizuje event
 * Body: { title?, description?, durationHours?, location? }
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { slug, eventId } = req.params;
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

    const event = await Event.findOne({
      _id: eventId,
      groupId: group._id,
    });

    if (!event) return res.status(404).json({ message: "Event not found" });

    // Sprawdź czy użytkownik jest twórcą eventu lub adminem grupy
    const membership = await Membership.findOne({
      groupId: group._id,
      userId: currentUserId,
      status: "active",
    });

    const isCreator = event.createdBy.toString() === currentUserId.toString();
    const isAdmin = membership?.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: "You can only edit your own events or be an admin" });
    }

    // Aktualizuj pola
    const { title, description, durationHours, location } = req.body;

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;

    if (durationHours !== undefined) {
      if (
        typeof durationHours !== "number" ||
        durationHours < 0 ||
        !Number.isFinite(durationHours)
      ) {
        return res.status(400).json({ message: "Invalid duration" });
      }
      event.durationHours = durationHours;
    }

    await event.save();

    const updatedEvent = await Event.findById(event._id).populate("createdBy", "name email").lean();

    return res.json(updatedEvent);
  } catch (err) {
    console.error("Error updating event:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/groups/:slug/events/:eventId
 * Usuwa event
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { slug, eventId } = req.params;
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

    const event = await Event.findOne({
      _id: eventId,
      groupId: group._id,
    });

    if (!event) return res.status(404).json({ message: "Event not found" });

    // Sprawdź czy użytkownik jest twórcą eventu lub adminem grupy
    const membership = await Membership.findOne({
      groupId: group._id,
      userId: currentUserId,
      status: "active",
    });

    const isCreator = event.createdBy.toString() === currentUserId.toString();
    const isAdmin = membership?.role === "admin";

    if (!isCreator && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You can only delete your own events or be an admin" });
    }

    await Event.deleteOne({ _id: eventId });

    return res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Error deleting event:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
