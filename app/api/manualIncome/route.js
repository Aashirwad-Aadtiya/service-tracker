// pages/api/manual-income/index.js
import {connectDB} from "/app/lib/mongodb";
import ManualIncome from '/app/models/manualIncome';

export async function GET() {
  await connectDB();
  const data = await ManualIncome.find().sort({ date: -1 });
  return Response.json(data);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();

  const { technician, amount, description, date } = body;

  // ✅ Create the manual income entry with full updated fields
  const newIncome = await ManualIncome.create({
    technician,
    amount,
    description,
    date: new Date(date),
  });

  return Response.json(newIncome);
}