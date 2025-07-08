"use client";

import { FilePlus, Plus, Home, Funnel, X, Download } from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import CollapsibleTable from "@/components/collapsibleTable";
import ManualIncomeForm from "@/components/ui/manualIncomeform";
import IncomeTable from "@/components/ui/manualIncomeTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import TravelButton from "@/components/ui/travelButton";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [incomes, setIncomes] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [showIncomeForm, setshowIncomeForm] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const route = useRouter();

  const [form, setForm] = useState({
    customer: "",
    address: "",
    phone: "",
    task: "",
    employee: "",
    assistant: "",
    parts: [{ item: "", qty: 1 }],
    income: "",
    credit: "",
    cashReceived: "",
    expense: "",
    date: today,
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [showFilters, setshowFilters] = useState(false);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);

  const [filters, setFilters] = useState({
    dateRange: "all", // today, week, month, custom, all
    fromDate: "", // for custom range
    toDate: "",
    customer: "",
    address: "",
    employee: "",
    creditStatus: "", // credit / no-credit
    minIncome: "",
    maxIncome: "",
    partUsed: "",
  });

  //print and export
  const mobileVisibleColumns = [
    { key: "customer", label: "Customer" },
    { key: "phone", label: "Phone" },
    { key: "task", label: "Task" },
    { key: "technician", label: "Technician" },
    { key: "income", label: "₹Income" },
    { key: "credit", label: "₹Credit" },
    { key: "expense", label: "₹Expense" },
    { key: "date", label: "Date" },
  ];
  const formatForExport = (data, columns) => {
    return data.map((srv) => {
      const formatted = {};
      columns.forEach(({ key, label }) => {
        let value;

        switch (key) {
          case "date":
            value = new Date(srv.date).toLocaleDateString("en-GB");
            break;
          case "parts":
            value = srv.parts?.map((p) => `${p.item} (${p.qty})`).join(", ");
            break;
          case "technician":
            value = srv.employee || "—";
            break;
          case "cashMode":
            value = srv.cashReceived || "—";
            break;
          default:
            value = srv[key] ?? "—";
        }

        formatted[label] = value;
      });
      return formatted;
    });
  };

  const exportToExcel = (data) => {
    const formattedData = formatForExport(data, mobileVisibleColumns);
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ServiceLogs");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `ServiceLogs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    const formattedData = formatForExport(data, mobileVisibleColumns);

    const headers = [mobileVisibleColumns.map((col) => col.label)];
    const body = formattedData.map((item) =>
      headers[0].map((label) => item[label] ?? "")
    );

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 20,
      styles: { fontSize: 8 },
    });

    doc.save(`ServiceLogs_${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  const handlePrint = (data) => {
    const formattedData = formatForExport(data, mobileVisibleColumns);

    const printWindow = window.open("", "_blank");
    const tableHeader = mobileVisibleColumns
      .map((col) => `<th>${col.label}</th>`)
      .join("");
    const tableRows = formattedData
      .map((row) => {
        return `<tr>${mobileVisibleColumns
          .map((col) => `<td>${row[col.label] ?? ""}</td>`)
          .join("")}</tr>`;
      })
      .join("");

    const html = `
    <html>
      <head>
        <title>Service Logs Print</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; }
        </style>
      </head>
      <body>
        <h2>Service Logs</h2>
        <table>
          <thead><tr>${tableHeader}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
    </html>
  `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const applyFilters = useCallback(
    (logs) => {
      return logs.filter((log) => {
        const {
          dateRange,
          fromDate,
          toDate,
          customer,
          address,
          employee,
          creditStatus,
          minIncome,
          maxIncome,
          partUsed,
        } = filters;

        const matchDate = () => {
          const logDate = new Date(log.date);
          const today = new Date();

          // Reset time to 00:00:00 for accurate comparisons
          logDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          if (dateRange === "all") return true;

          if (dateRange === "today") {
            return logDate.getTime() === today.getTime();
          }

          if (dateRange === "week") {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
            endOfWeek.setHours(23, 59, 59, 999);

            return logDate >= startOfWeek && logDate <= endOfWeek;
          }

          if (dateRange === "month") {
            return (
              logDate.getMonth() === today.getMonth() &&
              logDate.getFullYear() === today.getFullYear()
            );
          }

          if (dateRange === "custom") {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return logDate >= start && logDate <= end;
          }

          return true;
        };

        return (
          matchDate() &&
          (!customer ||
            log.customer?.toLowerCase().includes(customer.toLowerCase())) &&
          (!address ||
            log.address?.toLowerCase().includes(address.toLowerCase())) &&
          (!employee ||
            log.employee?.toLowerCase().includes(employee.toLowerCase())) &&
          (!creditStatus ||
            (creditStatus === "credit" && log.credit > 0) ||
            (creditStatus === "no-credit" &&
              (!log.credit || log.credit === 0))) &&
          (!minIncome || log.income >= parseFloat(minIncome)) &&
          (!maxIncome || log.income <= parseFloat(maxIncome)) &&
          (!partUsed ||
            log.parts.some((p) =>
              p.item.toLowerCase().includes(partUsed.toLowerCase())
            ))
        );
      });
    },
    [filters]
  );
  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        setServiceLogs(data);
        setFilteredLogs(applyFilters(data));
      });
  }, [applyFilters]);

  const fetchIncomes = async () => {
    try {
      const res = await fetch("/api/manualIncome");
      const data = await res.json();
      setIncomes(data);
    } catch (err) {
      console.error("Failed to fetch incomes:", err);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  useEffect(() => {
    setFilteredLogs(applyFilters(serviceLogs));
  }, [applyFilters, filters, serviceLogs]);

  const handleIncomeAdded = () => {
    fetchIncomes();
  };

  useEffect(() => {
    fetch("/api/services")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
      })
      .then((data) => setServices(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data) => setInventoryItems(data));
  }, []);

  const refreshServices = async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      setServiceLogs(data);
      setFilteredLogs(applyFilters(data));
    } catch (err) {
      console.error("Failed to refresh services:", err);
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const newService = await res.json();
    setServices([newService, ...services]);
    setForm({
      customer: "",
      address: "",
      phone: "",
      task: "",
      employee: "",
      assistant: "",
      parts: [{ item: "", qty: 1 }],
      income: "",
      credit: "",
      cashReceived: "",
      expense: "",
      date: today,
      notes: "",
    });

    setShowForm(false);
    setServiceLogs([newService, ...serviceLogs]);
    setFilteredLogs(applyFilters([newService, ...serviceLogs]));
  };

  return (
    <div className="min-h-screen bg-[#1e1b2e] text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Service Logs</h1>
        <div className=" gap-3 hidden md:flex">
          <button
            onClick={() => setshowIncomeForm(!showIncomeForm)}
            className="flex items-center  bg-slate-800 md:text-xl text-sm hover:bg-slate-700 px-2 py-0.5 text-white md:px-4 md:py-1 rounded shadow"
          >
            <Plus className="w-4 h-4 mr-2" />{" "}
            {showIncomeForm ? "Cancel" : "Income"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center  bg-slate-800 md:text-xl text-sm hover:bg-slate-700 px-2 py-0.5 text-white md:px-4 md:py-1 rounded shadow"
          >
            <Plus className="w-4 h-4 mr-2" /> {showForm ? "Cancel" : "Add"}
          </button>
          {/* <Link
            href="/dashboard"
            className="flex items-center  bg-slate-800 md:text-xl text-sm hover:bg-slate-700 px-2 py-0.5 text-white md:px-4 md:py-1 rounded shadow"
          >
            <Home className="w-4 h-4 mr-2" /> Dashboard
          </Link> */}
          <button
            onClick={() => setshowFilters(!showFilters)}
            className="flex items-center bg-slate-800 md:text-xl text-sm hover:bg-slate-700 px-2 py-0.5 text-white md:px-4 md:py-1 rounded shadow"
          >
            <Funnel className="w-4 h-4 mr-2" /> Filters
          </button>
          <TravelButton />
        </div>
        <div className="flex flex-row items-center gap-2 md:hidden ">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Download size={16} />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-[#1e1b2f] border border-gray-700">
              <DropdownMenuItem onClick={() => exportToExcel(filteredLogs)}>
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF(filteredLogs)}>
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrint(filteredLogs)}>
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TravelButton />
        </div>
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
          {/* Add New servic Buttons */}
          <button
            onClick={() => {
              setShowForm(!showForm);
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
            <span className="text-sm font-medium">Add</span>
          </button>
          <button
            onClick={() => {
              setshowFilters(!showFilters);
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
            <span className="text-sm font-medium">Filters</span>
          </button>
          <button
            onClick={() => {
              setshowIncomeForm(!showIncomeForm);
              setFabOpen(false);
            }}
            className={`flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 ${
              fabOpen
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-4 opacity-0 scale-75 pointer-events-none"
            }`}
            style={{ transitionDelay: fabOpen ? "150ms" : "0ms" }}
          >
            <Plus className="w-4 h-4 mr-2" />{" "}
            {showIncomeForm ? "Cancel" : "Income"}
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

      {loading ? (
        <p className="text-purple-300">Loading services...</p>
      ) : error ? (
        <p className="text-red-400">Error: {error}</p>
      ) : (
        <>
          {/* service entry form  */}
          {showIncomeForm && (
            <div className="max-w-xl mx-auto bg-slate-800 p-6 rounded-xl shadow-md border border-slate-700 relative">
              {/* Close Button */}
              <button
                onClick={() => setshowIncomeForm(false)}
                title="Close income form"
                className="absolute top-4 right-4 p-1 rounded-full bg-slate-700 hover:bg-slate-600 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-6 text-center">
                Log Manual Technician Income
              </h2>

              <ManualIncomeForm onIncomeAdded={handleIncomeAdded} />
            </div>
          )}

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#322c49] p-4 rounded-xl shadow text-sm mb-4"
            >
              <input
                type="text"
                placeholder="Customer Name"
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                required
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              />
              <input
                type="text"
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              />
              <input
                type="text"
                placeholder="Phone Number (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              />
              <input
                type="text"
                placeholder="Service Task"
                value={form.task}
                onChange={(e) => setForm({ ...form, task: e.target.value })}
                required
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              />
              <select
                value={form.employee}
                onChange={(e) => {
                  const technician = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    employee: technician,
                    cashReceived: prev.cashReceived || technician, // set only if empty
                  }));
                }}
                required
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              >
                <option value="" disabled>
                  Technician
                </option>
                <option value="Savan">Savan</option>
                <option value="Khande">Khande</option>
              </select>

              <input
                type="text"
                placeholder="Assistant (optional)"
                value={form.assistant}
                onChange={(e) =>
                  setForm({ ...form, assistant: e.target.value })
                }
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              />

              <div className="md:col-span-3 space-y-2">
                <p className="text-purple-300 text-sm">Parts Used:</p>
                {form.parts.map((part, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      list="inventory-items"
                      placeholder="Select or type part"
                      value={part.item}
                      onChange={(e) => {
                        const updated = [...form.parts];
                        updated[idx].item = e.target.value;
                        setForm({ ...form, parts: updated });
                      }}
                      className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700 w-2/3"
                    />

                    <datalist id="inventory-items">
                      {inventoryItems.map((inv) => (
                        <option key={inv._id} value={inv.item} />
                      ))}
                    </datalist>

                    <input
                      type="number"
                      placeholder="Qty"
                      value={part.qty}
                      min={1}
                      onChange={(e) => {
                        const updated = [...form.parts];
                        updated[idx].qty = parseInt(e.target.value);
                        setForm({ ...form, parts: updated });
                      }}
                      className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700 w-1/3"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      parts: [...form.parts, { item: "", qty: 1 }],
                    })
                  }
                  className="mt-2 text-sm text-purple-400 hover:underline"
                >
                  + Add another part
                </button>
              </div>

              <input
                type="number"
                placeholder="Income"
                value={form.income}
                onChange={(e) =>
                  setForm({ ...form, income: parseFloat(e.target.value) })
                }
                required
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              />

              <input
                type="number"
                placeholder="Credit (optional)"
                value={form.credit}
                onChange={(e) =>
                  setForm({ ...form, credit: parseFloat(e.target.value) })
                }
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              />

              <select
                type="text"
                value={form.cashReceived}
                onChange={(e) =>
                  setForm({ ...form, cashReceived: e.target.value })
                }
                required
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              >
                <option value="" disabled>
                  Cash recieved by
                </option>
                <option value="Savan">Savan</option>
                <option value="Khande">Khande</option>
              </select>

              <input
                type="number"
                placeholder="Expense"
                value={form.expense}
                onChange={(e) =>
                  setForm({ ...form, expense: parseFloat(e.target.value) })
                }
                required
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              />

              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              />
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes (optional)"
                className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              />

              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded col-span-full md:col-auto"
              >
                Save
              </button>
            </form>
          )}

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="w-full flex flex-col my-2">
              <div className="relative bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
                <button
                  onClick={() => setshowFilters(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                  title="Close filter panel"
                >
                  <X />
                </button>
                <h2 className="text-lg font-semibold text-white mb-6">
                  Filter Service Logs
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-slate-300">
                  <div>
                    <label className="block mb-1 text-slate-400">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={filters.customer}
                      onChange={(e) =>
                        setFilters({ ...filters, customer: e.target.value })
                      }
                      className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded w-full"
                      placeholder="Enter name"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400">
                      Technician
                    </label>
                    <input
                      type="text"
                      value={filters.employee}
                      onChange={(e) =>
                        setFilters({ ...filters, employee: e.target.value })
                      }
                      className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded w-full"
                      placeholder="Enter technician"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400">Address</label>
                    <input
                      type="text"
                      value={filters.address}
                      onChange={(e) =>
                        setFilters({ ...filters, address: e.target.value })
                      }
                      className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded w-full"
                      placeholder="Enter address"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400">
                      Date Range
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) =>
                        setFilters({ ...filters, dateRange: e.target.value })
                      }
                      className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded w-full"
                    >
                      <option value="all">All</option>
                      <option value="today">Today</option>
                      <option value="week">This Week </option>
                      <option value="month">This Month </option>
                      <option value="custom">Custom Range </option>
                    </select>
                  </div>
                  {filters.dateRange === "custom" && (
                    <div className="flex gap-8">
                      <div>
                        <label className="block mb-1 text-slate-400">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={filters.fromDate}
                          onChange={(e) =>
                            setFilters({ ...filters, fromDate: e.target.value })
                          }
                          className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded w-full"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-slate-400">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={filters.toDate}
                          onChange={(e) =>
                            setFilters({ ...filters, toDate: e.target.value })
                          }
                          className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded w-full"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block mb-1 text-slate-400">
                      Credit Status
                    </label>
                    <select
                      value={filters.creditStatus}
                      onChange={(e) =>
                        setFilters({ ...filters, creditStatus: e.target.value })
                      }
                      className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded w-full"
                    >
                      <option value="">All</option>
                      <option value="withCredit">With Credit</option>
                      <option value="withoutCredit">Without Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400">
                      Min Income
                    </label>
                    <input
                      type="number"
                      value={filters.minIncome}
                      onChange={(e) =>
                        setFilters({ ...filters, minIncome: e.target.value })
                      }
                      className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded w-full"
                      placeholder="₹"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400">
                      Max Income
                    </label>
                    <input
                      type="number"
                      value={filters.maxIncome}
                      onChange={(e) =>
                        setFilters({ ...filters, maxIncome: e.target.value })
                      }
                      className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded w-full"
                      placeholder="₹"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => {
                      setFilteredLogs(applyFilters(serviceLogs)),
                        setshowFilters(!showFilters);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => {
                      setFilters({
                        customer: "",
                        employee: "",
                        address: "",
                        fromDate: "",
                        toDate: "",
                        creditStatus: "",
                        minIncome: "",
                        maxIncome: "",
                      });
                      setFilteredLogs(serviceLogs);
                      setshowFilters(!showFilters);
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {showIncomeForm && (
            <div className="max-w-full mb-2 mx-auto mt-6">
              <IncomeTable Income={incomes} />
            </div>
          )}

          {/* 🔁 Card View for small screens */}
          <div className="space-y-4 md:hidden">
            {filteredLogs.map((srv) => (
              <div
                key={srv._id}
                className="bg-[#2a243a] rounded-lg p-4 border border-purple-700 text-sm"
              >
                <div className="font-semibold text-purple-300 mb-2">
                  {srv.customer} • {srv.task}
                </div>
                <p>
                  <span className="text-purple-400">Phone:</span>{" "}
                  {srv.phone || "-"}
                </p>
                <p>
                  <span className="text-purple-400">Address:</span>{" "}
                  {srv.address}
                </p>
                <p>
                  <span className="text-purple-400">Technician:</span>{" "}
                  {srv.employee}
                </p>
                <p>
                  <span className="text-purple-400">Assistant:</span>{" "}
                  {srv.assistant || "-"}
                </p>
                <p>
                  <span className="text-purple-400">Parts:</span>{" "}
                  {srv.parts?.map((p) => `${p.item} (${p.qty})`).join(", ")}
                </p>
                <p>
                  <span className="text-purple-400">Income:</span> ₹{srv.income}
                </p>
                <p>
                  <span className="text-purple-400">Credit:</span>{" "}
                  {srv.credit ? `₹${srv.credit}` : "-"}
                </p>
                <p>
                  <span className="text-purple-400">Cash Mode:</span>{" "}
                  {srv.cashReceived}
                </p>
                <p>
                  <span className="text-purple-400">Expense:</span> ₹
                  {srv.expense}
                </p>
                <p>
                  <span className="text-purple-400">Date:</span>{" "}
                  {new Date(srv.date).toLocaleDateString("en-GB")}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <CollapsibleTable filteredLogs={filteredLogs} onRefresh={refreshServices} />
    </div>
  );
}
