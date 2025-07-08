import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
  customer: String,
  address: String,
  phone: String, // optional
  task: String,
  employee: String,
  assistant: String, // optional
  parts: [
    {
      item: String,
      qty: Number,
    },
  ],
  income: Number,
  credit: Number, // optional
  cashReceived: String,
  expense: Number,
  date: Date,
  notes: String,
});

export default mongoose.models.Service ||
  mongoose.model("Service", ServiceSchema);
