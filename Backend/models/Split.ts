import { group } from "console";
import { Schema, model, Types } from "mongoose";

const splitSchema = new Schema(
  {
    expenseId: { type: Types.ObjectId, ref: "Expense", required: true, index: true },
    groupId: { type: Types.ObjectId, ref: "Group", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    amountCents: { type: Number, required: true },
  },
  { timestamps: true }
);
splitSchema.index({ expenseId: 1, userId: 1 }, { unique: true });
splitSchema.index({ groupId: 1, userId: 1 });
export const Split = model("Split", splitSchema);
