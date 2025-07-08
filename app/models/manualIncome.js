// models/ManualIncome.js
import mongoose from 'mongoose';

const manualIncomeSchema = new mongoose.Schema({
  technician: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now }
});

export default mongoose.models.ManualIncome || mongoose.model('ManualIncome', manualIncomeSchema);
