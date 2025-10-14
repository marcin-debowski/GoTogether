import mongoose, { Schema } from "mongoose";

const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    membersCount: { type: Number, default: 1 },
    slug: { type: String, unique: true, required: true, index: true },
    latestMessageAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    place: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Group = mongoose.model("Group", groupSchema);
