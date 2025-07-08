import mongoose from "mongoose";

const creditSchema = new mongoose.Schema({
  customer: { type: String, required: true },
  credit: { type: Number, required: true },
  date: { type: Date, required: true },
  cashReceived: { type: String, default: "-" },
  notes: { type: String, default: "" },
},{ timestamps: true });


export default mongoose.models.Credit || mongoose.model("Credit", creditSchema);
