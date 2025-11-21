import { Router } from "express";
import { protect } from "../middleware/protect";
import {
  getEventsSchedule,
  createEventSchedule,
  updateEventSchedule,
  deleteEventSchedule,
} from "../controllers/eventScheduleController";

const router = Router();

// GET /api/schedules/:slug - Get scheduled events (optionally for specific user)
// Query params: ?userId=xxx (optional)
router.get("/:slug", protect, getEventsSchedule);

// POST /api/schedules/:slug - Create new scheduled event
router.post("/:slug", protect, createEventSchedule);

// PUT /api/schedules/:slug/:scheduleId - Update scheduled event
router.put("/:slug/:scheduleId", protect, updateEventSchedule);

// DELETE /api/schedules/:slug/:scheduleId - Delete scheduled event
router.delete("/:slug/:scheduleId", protect, deleteEventSchedule);

export default router;
