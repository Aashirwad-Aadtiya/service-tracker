"use client";

import { useEffect, useState } from "react";
import { FilePlus, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TravelButton from "@/components/ui/travelButton";

export default function LogStocksPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const route = useRouter();
  const [fabOpen, setFabOpen] = useState(false);
  const [filters, setFilters] = useState({
    item: "",
    type: "all",
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    fetch("/api/logs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch logs");
        return res.json();
      })
      .then((data) => setLogs(data))
      .catch((err) => setError(err.message));
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchItem =
      !filters.item ||
      log.item.toLowerCase().includes(filters.item.toLowerCase());

    const matchType =
      filters.type === "all" ||
      log.type.toLowerCase() === filters.type.toLowerCase();

    const logDate = new Date(log.date);
    const from = filters.fromDate ? new Date(filters.fromDate) : null;
    const to = filters.toDate ? new Date(filters.toDate) : null;

    const matchFrom = !from || logDate >= from;
    const matchTo = !to || logDate <= to;


    return matchItem && matchType && matchFrom && matchTo;

  });
  
  

  return (
    <div className="min-h-screen bg-[#1e1b2e] text-white p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold mb-4">Stock Update Logs</h1>
        <TravelButton />
      </div>
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

      {error && (
        <p className="text-red-500 bg-red-900 p-2 rounded mb-4">{error}</p>
      )}

      <div className="bg-[#1e1b2e] p-4 rounded-lg mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-white">
        {/* Item Filter */}
        <div>
          <label className="block mb-1 text-purple-400">Item</label>
          <input
            type="text"
            placeholder="Search item"
            value={filters.item}
            onChange={(e) => setFilters({ ...filters, item: e.target.value })}
            className="w-full bg-[#2a243a] border border-purple-700 p-2 rounded"
          />
        </div>

        {/* Type Filter */}
        <div>
          <label className="block mb-1 text-purple-400">Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full bg-[#2a243a] border border-purple-700 p-2 rounded"
          >
            <option value="all">All</option>
            <option value="service">Service</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="block mb-1 text-purple-400">From Date</label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters({ ...filters, fromDate: e.target.value })
            }
            className="w-full bg-[#2a243a] border border-purple-700 p-2 rounded"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block mb-1 text-purple-400">To Date</label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            className="w-full bg-[#2a243a] border border-purple-700 p-2 rounded"
          />
        </div>
      </div>

      <div className="bg-[#322c49] p-4 hidden md:block rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-purple-800">
              <th className="py-2">Item</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Type</th>
              <th>Reference</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr
                key={log._id}
                className="border-b border-purple-900 hover:bg-purple-950/30"
              >
                <td className="py-2">{log.item}</td>
                <td
                  className={
                    log.type === "service" ? "text-red-400" : "text-green-400"
                  }
                >
                  {log.type === "service"
                    ? `-${log.quantity}`
                    : `+${log.quantity}`}
                </td>
                <td>{log.unit}</td>
                <td>{log.type}</td>
                <td>{log.reference}</td>
                <td>{new Date(log.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-4 md:hidden">
        {filteredLogs.map((log) => (
          <div
            key={log._id}
            className="bg-[#2a243a] rounded-lg p-4 border border-purple-700 text-sm"
          >
            <div className="font-semibold text-purple-300 mb-2">{log.item}</div>
            <p>
              <span className="text-purple-400">Qty:</span>{" "}
              {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
            </p>
            <p>
              <span className="text-purple-400">Unit:</span> {log.unit}
            </p>
            <p>
              <span className="text-purple-400">Type:</span> {log.type}
            </p>
            <p>
              <span className="text-purple-400">Ref:</span>{" "}
              {log.reference || "-"}
            </p>
            <p>
              <span className="text-purple-400">Date:</span>{" "}
              {new Date(log.date).toLocaleDateString("en-GB")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
