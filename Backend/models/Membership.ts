import mongoose, { Schema } from "mongoose";

const membershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    status: { type: String, enum: ["active", "invited", "banned"], default: "active" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

membershipSchema.index({ userId: 1, groupId: 1 });
membershipSchema.index({ userId: 1 });
membershipSchema.index({ groupId: 1 });

export const Membership = mongoose.model("Membership", membershipSchema);
