import { Schema } from "mongoose";
import { model, Types } from "mongoose";

const eventScheduleSchema = new Schema(
  {
    groupId: { type: Types.ObjectId, ref: "Group", index: true, required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
  },
  { timestamps: true }
);

eventScheduleSchema.index({ groupId: 1, userId: 1, startDateTime: 1 });
eventScheduleSchema.index({ eventId: 1 });

export const EventSchedule = model("EventSchedule", eventScheduleSchema);
