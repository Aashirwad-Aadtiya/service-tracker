import { connectDB } from "/app/lib/mongodb";
import Godown from "@/app/models/Godown";
import LogStock from "/app/models/LogStock"; 

export async function GET() {
    await connectDB();
    const items = await Godown.find().sort({ item: 1 });
    return Response.json(items);
  }
  
  export async function POST(req) {
    await connectDB();
    const body = await req.json();
  
    const createdItem = await Godown.create({
      item: body.item,
      quantity: body.quantity,
      unit: body.unit,
    });
  
    await LogStock.create({
      item: body.item,
      quantity: body.quantity,
      unit: body.unit,
      type: "manual",
      reference: "Initial Stock Entry",
    });
  
    return Response.json(createdItem);
  }