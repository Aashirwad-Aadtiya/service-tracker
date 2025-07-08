import { connectDB } from "@/app/lib/mongodb";
import Credit from "@/app/models/Credits";
import Service from "@/app/models/service";
import { Types } from "mongoose";

export async function POST(req) {
  // return Response.json({ status: "working" });
  await connectDB();

  try {
    const { id, amountPaid, method = "N/A", notes = "" } = await req.json();
   
    // Validate amountPaid
    if (!amountPaid || isNaN(amountPaid) || amountPaid <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
      });
    }

    const isMongoId = Types.ObjectId.isValid(id);

    // Try to find in Credits collection
    const manualCredit = isMongoId ? await Credit.findById(id) : null;

    if (manualCredit) {
      const remaining = manualCredit.credit - amountPaid;

      if (remaining <= 0) {
        await Credit.findByIdAndDelete(id);
        return Response.json({ success: true, deleted: true });
      } else {
        manualCredit.credit = remaining;
        manualCredit.notes =
          manualCredit.notes +
          ` | Part payment of ₹${amountPaid} on ${new Date().toLocaleDateString("en-GB")} ${notes && `- ${notes}`}`;
        await manualCredit.save();
        return Response.json({ success: true, updated: true, credit: manualCredit });
      }
    }

    // Else, try to find in Service logs
    const serviceCredit = await Service.findOne({ _id: id });
    if (!serviceCredit || serviceCredit.credit <= 0) {
      return new Response(JSON.stringify({ error: "Credit not found" }), { status: 404 });
    }

    const remaining = serviceCredit.credit - amountPaid;

    serviceCredit.credit = Math.max(0, remaining);

    const settlementNote = ` | Settled ₹${amountPaid} on ${new Date().toLocaleDateString("en-GB")}| ${notes && `- ${notes}`}`;

    serviceCredit.notes = (serviceCredit.notes || "") + settlementNote;

    await serviceCredit.save();

    return Response.json({ success: true, updated: true, credit: serviceCredit });
  } catch (err) {
    console.error("Settlement error:", err);
    return new Response(JSON.stringify({ error: "Server Error", details: err.message }), {
      status: 500,
    });
  }
}
