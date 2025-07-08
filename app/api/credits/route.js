import { connectDB } from "@/app/lib/mongodb";
import Credits from "@/app/models/Credits";

export async function GET() {
  await connectDB();
  const credits = await Credits.find().sort({ date: -1 });
  return Response.json(credits);
}

export async function POST(req) {
    await connectDB();  
    const body = await req.json();
    const saved = await Credits.create(body);
    return Response.json(saved);
};
