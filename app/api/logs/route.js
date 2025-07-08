import {connectDB} from "/app/lib/mongodb";
import LogStock from "/app/models/LogStock"; 

export async function GET() {
    await connectDB();
    const logs = await LogStock.find().sort({ date: -1 });
    return Response.json(logs);
  }