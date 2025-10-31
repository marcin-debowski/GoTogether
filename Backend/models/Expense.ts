import { Schema, model, Types } from "mongoose";

const expenseSchema = new Schema(
  {
    groupId: { type: Types.ObjectId, ref: "Group", index: true, required: true },
    payerId: { type: Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    amountCents: { type: Number, required: true, min: 0 },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ groupId: 1, date: -1 });
expenseSchema.index({ groupId: 1, payerId: 1, date: -1 });

export const Expense = model("Expense", expenseSchema);
