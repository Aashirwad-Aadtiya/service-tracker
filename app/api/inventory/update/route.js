import { connectDB } from "/app/lib/mongodb";
import Godown from "@/app/models/Godown";
import LogStock from "/app/models/LogStock"; 

export async function POST(req) {
    await connectDB();
    const { item, quantity, unit } = await req.json();
  
    const updatedItem = await Godown.findOneAndUpdate(
      { item, unit },
      { $inc: { quantity: parseInt(quantity) } },
      { new: true }
    );
  
    if (updatedItem) {
      await LogStock.create({
        item,
        quantity: parseInt(quantity),
        unit,
        type: "manual",
        reference: "Manual stock update",
      });
    }
  
    return Response.json(updatedItem);
  }