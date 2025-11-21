import { Schema, model, Types } from "mongoose";

const eventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    durationHours: { type: Number, required: true, min: 0 },
    location: { type: String, required: true },
    groupId: { type: Types.ObjectId, ref: "Group", index: true, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Event = model("Event", eventSchema);
