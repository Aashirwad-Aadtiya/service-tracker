import Godown from "/app/models/Godown";
import { connectDB } from "/app/lib/mongodb";
import Service from "/app/models/Service";
import LogStock from "/app/models/LogStock";

export async function GET() {
  await connectDB();
  const services = await Service.find().sort({ _id: -1 });
  return Response.json(services);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();

  // ✅ Create the service with full updated fields
  const newService = await Service.create({
    customer: body.customer,
    phone: body.phone,
    address: body.address,
    task: body.task,
    employee: body.employee,
    assistant: body.assistant,
    parts: body.parts,
    income: body.income,
    credit: body.credit,
    cashReceived: body.cashReceived,
    expense: body.expense,
    date: new Date(body.date),
    notes: body.notes,
  });

  // ✅ Deduct parts from Godown and log stock usage
  for (let p of body.parts) {
    const invItem = await Godown.findOne({ item: p.item });

    if (invItem) {
      await Godown.findOneAndUpdate(
        { item: p.item },
        { $inc: { quantity: -p.qty } },
        { new: true }
      );

      await LogStock.create({
        item: p.item,
        quantity: -p.qty,
        unit: invItem.unit,
        type: "service",
        reference: `${body.customer} - ${body.task}`,
        date: new Date(body.date),
      });
    }
  }

  return Response.json(newService);
}

export async function DELETE(req, { params }) {
  await connectDB();
  const { id } = params;

  try {
    const deletedService = await Service.findByIdAndDelete(id);

    // Optionally also delete related stock logs if needed
    // await LogStock.deleteMany({ reference: /something related to deletedService/ });

    if (!deletedService) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Deletion failed" }), {
      status: 500,
    });
  }
}