import { connectDB } from "@/app/lib/mongodb";
import ManualIncome from "/app/models/ManualIncome";

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const id = (await params).id;
    
        // Find the income entry first
        const income = await ManualIncome.findById(id);
    
        if (!income) {
        return new Response("Income entry not found", { status: 404 });
        }
    
        await ManualIncome.findByIdAndDelete(id);
    
        return new Response("Income entry deleted successfully", { status: 200 });
    } catch (err) {
        console.error("Error in DELETE /api/manualIncome/[id]:", err);
        return new Response("Server error", { status: 500 });
    }
    }