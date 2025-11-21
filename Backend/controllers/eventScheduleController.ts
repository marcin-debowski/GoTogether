import { Request, Response } from "express";
import { Group } from "../models/Group";
import { Membership } from "../models/Membership";
import { EventSchedule } from "../models/EventSchedule";
import { Event } from "../models/Event";

// Helper function to check membership
async function checkMembership(groupId: any, userId: any) {
  return await Membership.exists({
    groupId,
    userId,
    status: "active",
  });
}

export const getEventsSchedule = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { userId: requestedUserId, date } = req.query; // Optional: specific user's calendar and date

    const group = await Group.findOne({ slug }).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    // @ts-ignore
    const currentUserId = req.user?._id;
    const isMember = await checkMembership(group._id, currentUserId);
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    // Determine which user's events to fetch
    let targetUserId = currentUserId; // Default: current user

    if (requestedUserId) {
      // Verify requested user is also a member of this group
      const isTargetMember = await checkMembership(group._id, requestedUserId);
      if (!isTargetMember) {
        return res.status(403).json({ message: "Requested user is not a member of this group" });
      }
      targetUserId = requestedUserId;
    }

    // Build query
    let query: any = {
      groupId: group._id,
      userId: targetUserId,
    };

    // Filter by date (specific day)
    if (date) {
      const dayStart = new Date(date as string);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      query.startDateTime = { $gte: dayStart, $lt: dayEnd };
    }

    // Get events for target user
    const eventSchedules = await EventSchedule.find(query)
      .sort({ startDateTime: 1 })
      .populate("eventId", "title description location durationHours")
      .populate("userId", "name email")
      .lean();

    return res.json(eventSchedules);
  } catch (err) {
    console.error("Error fetching event schedules:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createEventSchedule = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { eventId, startDateTime } = req.body;

    if (!eventId || !startDateTime) {
      return res.status(400).json({ message: "eventId and startDateTime are required" });
    }

    const group = await Group.findOne({ slug }).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    // @ts-ignore
    const currentUserId = req.user?._id;
    const isMember = await checkMembership(group._id, currentUserId);
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    // Validate event exists and belongs to this group
    const event = await Event.findOne({ _id: eventId, groupId: group._id }).lean();
    if (!event) {
      return res.status(404).json({ message: "Event not found in this group" });
    }

    // Calculate endDateTime from event duration
    const start = new Date(startDateTime);
    const end = new Date(start);
    const hours = Math.floor(event.durationHours);
    const minutes = Math.round((event.durationHours - hours) * 60);
    end.setHours(end.getHours() + hours);
    end.setMinutes(end.getMinutes() + minutes);

    // Check if dates are within trip dates
    if (group.startDate && group.endDate) {
      if (start < new Date(group.startDate) || end > new Date(group.endDate)) {
        return res.status(400).json({
          message: "Event must be scheduled within trip dates",
          tripStart: group.startDate,
          tripEnd: group.endDate,
        });
      }
    }

    // Check for time conflicts for this user
    const conflicts = await EventSchedule.find({
      groupId: group._id,
      userId: currentUserId,
      $or: [
        { startDateTime: { $lte: start }, endDateTime: { $gt: start } },
        { startDateTime: { $lt: end }, endDateTime: { $gte: end } },
        { startDateTime: { $gte: start }, endDateTime: { $lte: end } },
      ],
    }).populate("eventId", "title");

    if (conflicts.length > 0) {
      return res.status(400).json({
        message: "Time conflict with existing events",
        conflicts: conflicts.map((c) => ({
          // @ts-ignore
          title: c.eventId?.title,
          start: c.startDateTime,
          end: c.endDateTime,
        })),
      });
    }

    // Create schedule
    const newSchedule = await EventSchedule.create({
      groupId: group._id,
      eventId,
      userId: currentUserId,
      startDateTime: start,
      endDateTime: end,
    });

    // Populate before returning
    await newSchedule.populate([
      { path: "eventId", select: "title description location durationHours" },
      { path: "userId", select: "name email" },
    ]);

    return res.status(201).json(newSchedule);
  } catch (err) {
    console.error("Error creating event schedule:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateEventSchedule = async (req: Request, res: Response) => {
  try {
    const { slug, scheduleId } = req.params;
    const { eventId, startDateTime } = req.body;

    const group = await Group.findOne({ slug }).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    // @ts-ignore
    const currentUserId = req.user?._id;
    const isMember = await checkMembership(group._id, currentUserId);
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    // Find existing schedule
    const existingSchedule = await EventSchedule.findOne({
      _id: scheduleId,
      groupId: group._id,
    }).lean();

    if (!existingSchedule) {
      return res.status(404).json({ message: "Event schedule not found" });
    }

    // Only creator can edit their own schedule
    if (existingSchedule.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "You can only edit your own scheduled events" });
    }

    const updateData: any = {};
    let newEvent = null;

    // 1. If eventId is being changed, validate new event
    if (eventId && eventId !== existingSchedule.eventId.toString()) {
      newEvent = await Event.findOne({ _id: eventId, groupId: group._id }).lean();
      if (!newEvent) {
        return res.status(404).json({ message: "Event not found in this group" });
      }
      updateData.eventId = eventId;
    }

    // 2. Calculate new start and end times
    if (startDateTime || newEvent) {
      // Determine start time: new if provided, otherwise keep existing
      const start = startDateTime ? new Date(startDateTime) : existingSchedule.startDateTime;

      // Determine duration: from new event if changed, otherwise fetch existing
      const eventForDuration = newEvent || (await Event.findById(existingSchedule.eventId).lean());

      // Calculate end time
      const end = new Date(start);
      const hours = Math.floor(eventForDuration?.durationHours || 1);
      const minutes = Math.round(((eventForDuration?.durationHours || 1) - hours) * 60);
      end.setHours(end.getHours() + hours);
      end.setMinutes(end.getMinutes() + minutes);

      // Update fields
      if (startDateTime) {
        updateData.startDateTime = start;
      }
      updateData.endDateTime = end;
    }

    // 3. Check if dates are within trip dates
    if (updateData.startDateTime || updateData.endDateTime) {
      const start = updateData.startDateTime || existingSchedule.startDateTime;
      const end = updateData.endDateTime || existingSchedule.endDateTime;

      if (group.startDate && group.endDate) {
        if (start < new Date(group.startDate) || end > new Date(group.endDate)) {
          return res.status(400).json({
            message: "Event must be scheduled within trip dates",
            tripStart: group.startDate,
            tripEnd: group.endDate,
          });
        }
      }
    }

    // 4. Check for time conflicts (if time was changed)
    if (updateData.startDateTime || updateData.endDateTime) {
      const start = updateData.startDateTime || existingSchedule.startDateTime;
      const end = updateData.endDateTime || existingSchedule.endDateTime;

      const conflicts = await EventSchedule.find({
        groupId: group._id,
        userId: currentUserId,
        _id: { $ne: scheduleId }, // Exclude current schedule being edited
        $or: [
          { startDateTime: { $lte: start }, endDateTime: { $gt: start } },
          { startDateTime: { $lt: end }, endDateTime: { $gte: end } },
          { startDateTime: { $gte: start }, endDateTime: { $lte: end } },
        ],
      }).populate("eventId", "title");

      if (conflicts.length > 0) {
        return res.status(400).json({
          message: "Time conflict with existing events",
          conflicts: conflicts.map((c) => ({
            // @ts-ignore
            title: c.eventId?.title,
            start: c.startDateTime,
            end: c.endDateTime,
          })),
        });
      }
    }

    const updatedSchedule = await EventSchedule.findByIdAndUpdate(scheduleId, updateData, {
      new: true,
    })
      .populate("eventId", "title description location durationHours")
      .populate("userId", "name email")
      .lean();

    return res.json(updatedSchedule);
  } catch (err) {
    console.error("Error updating event schedule:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteEventSchedule = async (req: Request, res: Response) => {
  try {
    const { slug, scheduleId } = req.params;
    const group = await Group.findOne({ slug }).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    // @ts-ignore
    const currentUserId = req.user?._id;
    const isMember = await checkMembership(group._id, currentUserId);
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    // Check ownership before deleting
    const schedule = await EventSchedule.findOne({
      _id: scheduleId,
      groupId: group._id,
    }).lean();

    if (!schedule) {
      return res.status(404).json({ message: "Event schedule not found" });
    }

    // Only creator can delete their own schedule
    if (schedule.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "You can only delete your own scheduled events" });
    }

    await EventSchedule.findByIdAndDelete(scheduleId);

    return res.json({ message: "Event schedule deleted successfully" });
  } catch (err) {
    console.error("Error deleting event schedule:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
