import { Router } from "express";
import { protect } from "../middleware/protect";
import { postEvent, getEvents, updateEvent, deleteEvent } from "../controllers/eventController";

const router = Router();

// POST /api/groups/:slug/events
router.post("/:slug/events", protect, postEvent);

// GET /api/groups/:slug/events
router.get("/:slug/events", protect, getEvents);

// PUT /api/groups/:slug/events/:eventId
router.put("/:slug/events/:eventId", protect, updateEvent);

// DELETE /api/groups/:slug/events/:eventId
router.delete("/:slug/events/:eventId", protect, deleteEvent);

export default router;
