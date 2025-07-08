import mongoose from "mongoose";

const LogStockSchema = new mongoose.Schema({
  item: String,
  quantity: Number,
  unit: String,
  type: String, // e.g., 'service' or 'manual'
  reference: String, // optional: service task or customer name
  date: { type: Date, default: Date.now },
});

export default mongoose.models.LogStock || mongoose.model("LogStock", LogStockSchema);
