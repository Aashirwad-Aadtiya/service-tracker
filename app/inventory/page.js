"use client";

import { useState, useEffect } from "react";
import { FilePlus, PackageSearch, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TravelButton from "@/components/ui/travelButton";

export default function InventoryPage() {
  const [inventory, setInventory] = useState([
    { id: 1, item: "Compressor", quantity: 10, unit: "pcs" },
    { id: 2, item: "RO Filter", quantity: 4, unit: "pcs" },
    { id: 3, item: "Gas Cylinder", quantity: 2, unit: "cylinders" },
    { id: 4, item: "Capacitor", quantity: 14, unit: "pcs" },
    { id: 5, item: "Pipe", quantity: 25, unit: "m" },
  ]);

  const [stocks, setstocks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const route = useRouter();

  const [form, setForm] = useState({ item: "", quantity: "", unit: "" });
  const [newItem, setNewItem] = useState({ item: "", quantity: "", unit: "" });

  useEffect(() => {
    fetch("/api/logs")
      .then((res) => res.json())
      .then((data) => setstocks(data))
      .catch((err) => console.error("Failed to load stock logs:", err));
  }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setInventory(data);
    };

    fetchInventory();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });

    const added = await res.json();
    setInventory([added, ...inventory]); // Add to state
    setNewItem({ item: "", quantity: "", unit: "" }); // Clear form
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/inventory/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const updated = await res.json();

    // Update local inventory state
    const updatedInventory = inventory.map((inv) =>
      inv.item === updated.item && inv.unit === updated.unit ? updated : inv
    );
    setInventory(updatedInventory);

    setForm({ item: "", quantity: "", unit: "" });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-[#1e1b2e] text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <div className="md:flex gap-3 hidden">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow"
          >
            {showAddForm ? "Cancel" : "Add New Item"}
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow"
          >
            <PackageSearch className="w-4 h-4 mr-2" />{" "}
            {showForm ? "Cancel" : "Update Stock"}
          </button>

          <TravelButton/>
        </div>
        <div className="md:hidden">
          <TravelButton/>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleStockUpdate}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 bg-[#322c49] p-4 rounded-xl"
        >
          <select
            required
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
          >
            <option value="">Select Item</option>
            {inventory.map((inv) => (
              <option key={inv.id || inv.item} value={inv.item}>
                {inv.item}
              </option>
            ))}
          </select>

          <select
            required
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
          >
            <option value="">Select Unit</option>
            {[...new Set(inventory.map((inv) => inv.unit))].map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
            className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
          />

          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            Update
          </button>
        </form>
      )}
      {showAddForm && (
        <form
          onSubmit={handleAddItem}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 bg-[#322c49] p-4 rounded-xl"
        >
          <input
            placeholder="Item name"
            value={newItem.item}
            onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
            required
            className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) =>
              setNewItem({ ...newItem, quantity: parseInt(e.target.value) })
            }
            required
            className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
          />
          <select
            value={newItem.unit}
            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
            required
            className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
          >
            <option value="">Select Unit</option>
            <option value="pcs">pcs</option>
            <option value="m">meters</option>
            <option value="cylinders">cylinders</option>
          </select>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow"
          >
            Add Item
          </button>
        </form>
      )}

      <div className="bg-[#322c49] p-4 rounded-xl shadow overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-purple-800">
              <th className="py-2">Item</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr
                key={item.id || item.item}
                className="border-b border-purple-900 hover:bg-purple-950/30"
              >
                <td className="py-2">{item.item}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.quantity < 5
                        ? "bg-red-600 text-white"
                        : item.quantity < 10
                        ? "bg-yellow-500 text-white"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {item.quantity < 5
                      ? "Low"
                      : item.quantity < 10
                      ? "Medium"
                      : "Healthy"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stocks.length > 0 && (
        <div className="bg-[#322c49] p-4 rounded-xl max-h-[45vh] md:max-h-max shadow overflow-x-auto">
          <h2 className="text-lg font-semibold mb-3">Stock Update Log</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-purple-800">
                <th className="py-2">Item</th>
                <th>Quantity Added</th>
                <th>Unit</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((log, idx) => (
                <tr
                  key={idx}
                  className="border-b border-purple-900 hover:bg-purple-950/30"
                >
                  <td className="py-2">{log.item}</td>
                  <td className="flex items-center gap-1">
                    {log.type === "service" ? (
                      <>
                        <span className="text-red-400">🛠️ {log.quantity}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-green-400">
                          📦 +{log.quantity}
                        </span>
                      </>
                    )}
                  </td>

                  <td>{log.unit}</td>
                  <td>{new Date(log.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="md:hidden">
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${
            fabOpen
              ? "backdrop-blur-sm opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setFabOpen(false)}
        />

        {/* FAB Menu Items */}
        <div className="fixed bottom-20 right-4 space-y-3 z-50">
          {/* Dashboard Button */}
          <button
            className={`flex items-center bg-purple-800 hover:bg-purple-700 text-white px-4 py-3 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 ${
              fabOpen
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-4 opacity-0 scale-75 pointer-events-none"
            }`}
            style={{ transitionDelay: fabOpen ? "100ms" : "0ms" }}
            onClick={() => route.push("/dashboard")}
          >
            <Home className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          {/* Add New Item and Update Stock Buttons */}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setFabOpen(false);
            }}
            className={`flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 ${
              fabOpen
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-4 opacity-0 scale-75 pointer-events-none"
            }`}
            style={{ transitionDelay: fabOpen ? "150ms" : "0ms" }}
          >
            <FilePlus className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">
            {showAddForm ? "Cancel" : "Add New Item"}
            </span>
          </button>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setFabOpen(false);
            }}
            className={`flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 ${
              fabOpen
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-4 opacity-0 scale-75 pointer-events-none"
            }`}
            style={{ transitionDelay: fabOpen ? "200ms" : "0ms" }}
          >
            <FilePlus className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">
            {showForm ? "Cancel" : "Update Stock"}
            </span>
          </button>
        </div>

        {/* Main FAB Button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transform transition-all duration-300 z-50 hover:shadow-2xl ${
            fabOpen
              ? "rotate-45 bg-purple-700 scale-110 shadow-2xl"
              : "rotate-0 hover:scale-110"
          }`}
        >
          <FilePlus
            className={`w-6 h-6 transition-transform duration-300 ${
              fabOpen ? "rotate-90" : "rotate-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
