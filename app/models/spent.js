import mongoose from "mongoose";
const spentSchema = new mongoose.Schema({
    paid_by: { type: String, required: true },
    details: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
});
export default mongoose.models.Spent || mongoose.model("Spent", spentSchema);