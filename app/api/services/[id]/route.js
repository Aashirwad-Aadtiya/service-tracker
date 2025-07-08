import { connectDB } from "@/app/lib/mongodb";
import Service from "@/app/models/service";
import Godown from "@/app/models/Godown";
import LogStock from "@/app/models/LogStock";

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const id = (await params).id;


    // Find the service first
    const service = await Service.findById(id);

    if (!service) {
      return new Response("Service not found", { status: 404 });
    }

    // Restore stock quantities for used parts
    if (service.parts && service.parts.length > 0) {
      for (let p of service.parts) {
        const godownItem = await Godown.findOne({ item: p.item });
        if (godownItem) {
          await Godown.findOneAndUpdate(
            { item: p.item },
            { $inc: { quantity: p.qty } }
          );

          await LogStock.deleteMany({
            item: p.item,
            quantity: -p.qty,
            type: "service",
            reference: new RegExp(service.customer, "i"),
            date: {
              $gte: new Date(service.date).setHours(0, 0, 0, 0),
              $lte: new Date(service.date).setHours(23, 59, 59, 999),
            },
          });
        }
      }
    }

    await Service.findByIdAndDelete(id);

    return new Response("Service deleted successfully", { status: 200 });
  } catch (err) {
    console.error("Error in DELETE /api/services/[id]:", err);
    return new Response("Server error", { status: 500 });
  }
}
