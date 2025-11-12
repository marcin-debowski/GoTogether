import { Router } from "express";
import { protect } from "../middleware/protect";
import {
  getEventsSchedule,
  createEventSchedule,
  updateEventSchedule,
  deleteEventSchedule,
} from "../controllers/eventScheduleController";

const router = Router();

// GET /api/groups/:slug/schedule - Get scheduled events (optionally for specific user)
// Query params: ?userId=xxx (optional)
router.get("/:slug/schedule", protect, getEventsSchedule);

// POST /api/groups/:slug/schedule - Create new scheduled event
router.post("/:slug/schedule", protect, createEventSchedule);

// PUT /api/groups/:slug/schedule/:scheduleId - Update scheduled event
router.put("/:slug/schedule/:scheduleId", protect, updateEventSchedule);

// DELETE /api/groups/:slug/schedule/:scheduleId - Delete scheduled event
router.delete("/:slug/schedule/:scheduleId", protect, deleteEventSchedule);

export default router;
