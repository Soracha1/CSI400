import mongoose from "mongoose";

const redeemSchema = new mongoose.Schema({
  code: { type: String, required: true },
  plan: { type: String, required: true }, // SOCOZY, SUPERCOZY, COZIEST
  used: { type: Boolean, default: false },
});

export default mongoose.model("RedeemCode", redeemSchema);
