import { connectDB } from "@/app/lib/mongodb";
import Spent from "@/app/models/spent";

export async function GET() {
  await connectDB();
  const spent = await Spent.find().sort({ date: -1 });
  return Response.json(spent);
};

export async function POST(req) {
    await connectDB();
    const body = await req.json();
    const saved = await Spent.create(body);
    return Response.json(saved);
};
