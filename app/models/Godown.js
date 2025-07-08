import mongoose from "mongoose";

const GodownSchema = new mongoose.Schema({
  item: String,
  quantity: Number,
  unit: String,
});

export default mongoose.models.Godown || mongoose.model("Godown", GodownSchema);
