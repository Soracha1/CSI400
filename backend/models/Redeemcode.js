import mongoose from "mongoose";

const redeemSchema = new mongoose.Schema({
  code: { type: String, required: true },
  plan: { type: String, required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  expireAt: { type: Date }, // optional
});

export default mongoose.model("RedeemCode", redeemSchema);
