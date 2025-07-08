"use client";

import { useState, useEffect } from "react";
import { Download, FilePlus, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "/components/ui/dropdown-menu";
import TravelButton from "@/components/ui/travelButton";
import { Button } from "/components/ui/button";
import {
  exportToExcel,
  exportToPDF,
  handlePrint,
} from "/app/utils/exportprint";

export default function ExpensesPage() {
  const route = useRouter();
  const [datefilter, setdateFilter] = useState("all");
  const [customDate, setCustomDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const [expenses, setExpenses] = useState([
    {
      id: 1,
      paid_by: "Paid by Savan",
      details: "Bus fare to Sanawad",
      amount: 120,
      date: "2025-04-12",
    },
    {
      id: 2,
      paid_by: "Paid by Khande",
      details: "AC repair (Mr. Sharma)",
      amount: 2500,
      date: "2025-04-12",
    },
    {
      id: 3,
      paid_by: "other employee",
      details: "3x RO Filters",
      amount: 900,
      date: "2025-04-11",
    },
  ]);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNotes, setSettleNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCreditsForm, setShowCreditsForm] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [swipeStates, setSwipeStates] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const [credits, setCredits] = useState([]);
  const [totalCredit, setTotalCredit] = useState(0);
  useEffect(() => {
    if (showForm || showCreditsForm) {
      setFabOpen(false);
    }
  }, [showForm, showCreditsForm]);
  const [filters, setFilters] = useState({
    cashReceived: "",
    minCredit: "",
    maxCredit: "",
    paid_by: "", // This can be used for filtering expenses by paid_by
    minExpense: "",
    maxExpense: "",
    // ... other filters
  });

  useEffect(() => {
    const today = new Date();
    const isSameDay = (d1, d2) =>
      new Date(d1).toDateString() === new Date(d2).toDateString();

    const getStartOfWeek = () => {
      const date = new Date(today);
      const day = date.getDay(); // 0 (Sun) to 6 (Sat)
      const diff = day === 0 ? -6 : 1 - day; // Adjust when it's Sunday
      const start = new Date(date.setDate(date.getDate() + diff));
      start.setHours(0, 0, 0, 0);
      return start;
    };
    const getEndOfWeek = () => {
      const start = getStartOfWeek();
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return end;
    };

    const isSameWeek = (d) => {
      const date = new Date(d);
      const start = getStartOfWeek();
      const end = getEndOfWeek();
      return date >= start && date <= end;
    };

    const isSameMonth = (d) => {
      const date = new Date(d);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth()
      );
    };

    const applyFilter = (entries) => {
      return entries
        .filter((entry) => {
          const date = new Date(entry.date);
          switch (datefilter) {
            case "today":
              return isSameDay(date, today);
            case "week":
              return isSameWeek(date);
            case "month":
              return isSameMonth(date);
            case "custom":
              return isSameDay(date, customDate);
            case "all":
              return true;
            default:
              return true;
          }
        })
        .filter(
          (entry) =>
            !filters.cashReceived ||
            entry.cashReceived
              .toLowerCase()
              .includes(filters.cashReceived.toLowerCase())
        )
        .filter((entry) => {
          const credit = parseFloat(entry.credit) || 0;

          // If no credit filters are set, include all entries
          if (!filters.minCredit && !filters.maxCredit) {
            return true;
          }

          const minCredit = filters.minCredit
            ? parseFloat(filters.minCredit)
            : 0;
          const maxCredit = filters.maxCredit
            ? parseFloat(filters.maxCredit)
            : Infinity;

          return credit >= minCredit && credit <= maxCredit;
        });
    };
    const applyExpenseFilter = (entries) => {
      return entries
        .filter((entry) => {
          const date = new Date(entry.date);
          switch (datefilter) {
            case "today":
              return isSameDay(date, today);
            case "week":
              return isSameWeek(date);
            case "month":
              return isSameMonth(date);
            case "custom":
              return isSameDay(date, customDate);
            case "all":
              return true;
            default:
              return true;
          }
        })
        .filter(
          (entry) =>
            !filters.paid_by ||
            entry.paid_by.toLowerCase().includes(filters.paid_by.toLowerCase())
        )
        .filter((entry) => {
          const amount = parseFloat(entry.amount) || 0;
          const min = filters.minExpense ? parseFloat(filters.minExpense) : 0;
          const max = filters.maxExpense
            ? parseFloat(filters.maxExpense)
            : Infinity;
          return amount >= min && amount <= max;
        });
    };

    Promise.all([
      fetch("/api/services").then((res) => res.json()),
      fetch("/api/credits").then((res) => res.json()),
      fetch("/api/spent").then((res) => res.json()),
    ]).then(([servicesData, manualCredits, spentData]) => {
      const serviceCredits = servicesData
        .filter((entry) => entry.credit > 0)
        .map((entry) => ({
          _id: entry._id,
          customer: entry.customer,
          credit: entry.credit,
          cashReceived: entry.cashReceived || "-",
          date: entry.date,
          notes: entry.notes || "",
          from: "service",
        }));

      const manual = manualCredits.map((entry) => ({
        ...entry,
        from: "manual",
      }));

      const combined = [...serviceCredits, ...manual];
      const filtered = applyFilter(combined).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setCredits(filtered);
      setTotalCredit(filtered.reduce((sum, curr) => sum + curr.credit, 0));

      const manualExpenses = spentData
        .filter((entry) => entry.amount > 0)
        .map((entry) => ({
          id: entry.id,
          paid_by: entry.paid_by || "Unknown",
          details: entry.details || "Manual Expense",
          amount: entry.amount,
          date: entry.date,
          from: "manual",
        }));

      const serviceExpenses = servicesData
        .filter((entry) => entry.expense > 0)
        .map((entry) => ({
          id: entry._id,
          paid_by: entry.cashReceived || "Unknown",
          details: `Service for ${entry.customer}` || "Service Expense",
          // details: {
          //   text: "Service Expense",
          //   link: `/servicelogs/${entry._id}`,
          // },
          amount: entry.expense,
          date: entry.date,
          from: "service",
        }));

      const combinedExpenses = [...manualExpenses, ...serviceExpenses];
      const sortedExpenses = applyExpenseFilter(combinedExpenses).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setExpenses(sortedExpenses);
    });
  }, [
    datefilter,
    customDate,
    filters.cashReceived,
    filters.minCredit,
    filters.maxCredit,
    filters.paid_by,
    filters.minExpense,
    filters.maxExpense,
    showForm,
    showCreditsForm,
  ]);

  const [form, setForm] = useState({
    paid_by: "",
    details: "",
    amount: "",
    date: "",
  });


  //columns to include for export and print
  const ExpenseColumns = [
    { key: "paid_by", label: "Technician" },
    { key: "details", label: "Details" },
    { key: "amount", label: "Expense" },
    { key: "date", label: "Date" },
  ];


  const CreditColumns = [
    { key: "customer", label: "customer" },
    { key: "cashRecieved", label: "Technician" },
    { key: "credit", label: "Credit" },
    { key: "date", label: "Date" },
    { key: "notes", label: "Notes" },
  ];

  // Swipe handling functions
  const minSwipeDistance = 50;

  const onTouchStart = (e, creditId) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e, creditId) => {
    setTouchEnd(e.targetTouches[0].clientX);

    if (!touchStart) return;

    const currentTouch = e.targetTouches[0].clientX;
    const distance = touchStart - currentTouch;

    // Update swipe state for visual feedback
    if (distance > 0) {
      setSwipeStates((prev) => ({
        ...prev,
        [creditId]: Math.min(distance, 100), // Cap at 100px
      }));
    } else {
      setSwipeStates((prev) => ({
        ...prev,
        [creditId]: 0,
      }));
    }
  };

  const onTouchEnd = (creditId) => {
    if (!touchStart || !touchEnd) {
      // Reset swipe state if no proper swipe
      setSwipeStates((prev) => ({
        ...prev,
        [creditId]: 0,
      }));
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;

    if (isLeftSwipe) {
      // Trigger settle action
      const credit = credits.find((c) => c._id === creditId);
      if (credit) {
        setSelectedCredit(credit);
      }
    }

    // Reset swipe state
    setSwipeStates((prev) => ({
      ...prev,
      [creditId]: 0,
    }));
  };

  const handleSettlement = async (e) => {
    e.preventDefault();

    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid settlement amount.");
      return;
    }

    const res = await fetch("/api/credits/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedCredit._id,
        amountPaid: amount,
      }),
    });

    const result = await res.json();

    if (result.deleted) {
      setCredits(credits.filter((c) => c._id !== selectedCredit._id));
    } else if (result.updated) {
      setCredits(
        credits.map((c) => (c._id === selectedCredit._id ? result.credit : c))
      );
    }

    // reset form
    setSelectedCredit(null);
    setSettleAmount("");
    setSettleNotes("");
  };

  const handleAddCredits = async (e) => {
    e.preventDefault();

    const newCredit = {
      customer: form.customer || "Unknown",
      credit: parseFloat(form.credit),
      date: form.date,
      cashReceived: form.cashReceived || "-",
      notes: form.notes || "",
    };

    const res = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCredit),
    });

    const saved = await res.json();
    setCredits([saved, ...credits]);
    setForm({
      customer: "",
      date: "",
      cashReceived: "",
      credit: "",
      notes: "",
    });
    setShowCreditsForm(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const newExpense = {
      id: expenses.length + 1,
      paid_by: form.type || "Unknown",
      details: form.details,
      amount: parseFloat(form.amount),
      date: form.date,
    };
    const res = await fetch("/api/spent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newExpense),
    });

    const saved = await res.json();
    setShowCreditsForm(false);
    setExpenses([saved, ...expenses]);
    setForm({ type: "", details: "", amount: "", date: "" });
    setShowForm(false);
  };
  const [view, setView] = useState("none");
  return (
    <>
      <div className="min-h-screen bg-[#1e1b2e] text-white p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Expenses & Credits</h1>
          <div className="md:flex gap-2 hidden ">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center bg-purple-800 hover:bg-purple-700 text-white px-4 py-2 rounded shadow"
            >
              <FilePlus className="w-4 h-4 mr-2" />{" "}
              {showForm ? "Cancel" : "Add Expense"}
            </button>
            <button
              onClick={() => setShowCreditsForm(!showCreditsForm)}
              className="flex items-center bg-purple-800 hover:bg-purple-700 text-white px-4 py-2 rounded shadow"
            >
              <FilePlus className="w-4 h-4 mr-2" />{" "}
              {showCreditsForm ? "Cancel" : "Add Credits"}
            </button>
            <TravelButton />
          </div>
          <div className="md:hidden">
            <TravelButton />
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="bg-[#322c49] p-4 rounded-xl shadow mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm"
          >
            <select
              required
              className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="">Paid by</option>
              <option value="Savan">Savan</option>
              <option value="Khande">Khande</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Details"
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              required
              className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
            />
            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
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
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded col-span-full md:col-auto"
            >
              Save
            </button>
          </form>
        )}
        {showCreditsForm && (
          <form
            onSubmit={handleAddCredits}
            className="bg-[#322c49] p-4 rounded-xl shadow mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm"
          >
            <input
              type="text"
              placeholder="Customer"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              required
              className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
            />
            <input
              type="number"
              placeholder="Credit Amount"
              value={form.credit}
              onChange={(e) => setForm({ ...form, credit: e.target.value })}
              required
              className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
            />
            <input
              type="text"
              placeholder="Cash Received (optional)"
              value={form.cashReceived}
              onChange={(e) =>
                setForm({ ...form, cashReceived: e.target.value })
              }
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
              placeholder="Notes //optional"
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

        {view === "expenses" && (
          <>
            <div className="flex flex-col sm:flex-wrap sm:flex-row sm:items-center sm:gap-3 mt-2 mb-4 space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-purple-300">
                <select
                  value={datefilter}
                  onChange={(e) => setdateFilter(e.target.value)}
                  className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Date</option>
                  <option value="all">All Time</option>
                </select>
                {datefilter === "custom" && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="bg-[#1e1b2e] border border-purple-700 text-white p-2 rounded"
                  />
                )}
              </div>

              <input
                type="text"
                placeholder="Paid By"
                value={filters.paid_by}
                onChange={(e) =>
                  setFilters({ ...filters, paid_by: e.target.value })
                }
                className="bg-[#1e1b2e] text-sm border border-purple-700 text-white p-2 rounded w-full sm:w-auto"
              />

              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <input
                  type="number"
                  placeholder="Min Expense"
                  value={filters.minExpense}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minExpense: e.target.value,
                    }))
                  }
                  min="0"
                  step="0.01"
                  className="bg-[#1e1b2e] text-sm border border-purple-700 text-white p-2 rounded w-full sm:w-32"
                />
                <input
                  type="number"
                  placeholder="Max Expense"
                  value={filters.maxExpense}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxExpense: e.target.value,
                    }))
                  }
                  min="0"
                  step="0.01"
                  className="bg-[#1e1b2e] text-sm border border-purple-700 text-white p-2 rounded w-full sm:w-32"
                />
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      paid_by: "",
                      minExpense: "",
                      maxExpense: "",
                    }))
                  }
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                >
                  Clear
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <Download size={16} />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-[#1e1b2f] border border-gray-700">
                    <DropdownMenuItem
                      onClick={() => exportToExcel(expenses, ExpenseColumns)}
                    >
                      Export Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToPDF(expenses, ExpenseColumns)}>
                      Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrint(expenses, ExpenseColumns)}>
                      Print
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* mobile screen expenses */}

            <div className="md:hidden">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="bg-[#1e1b2e] border border-purple-700 rounded-xl p-4 mb-3 text-white shadow-sm"
                >
                  <div className="flex justify-between text-sm font-semibold text-purple-300">
                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                    <span className="text-right text-green-400">
                      ₹{expense.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-2 text-sm">
                    <div>
                      <span className="text-purple-400">Details:</span>{" "}
                      {expense.details}
                    </div>
                    <div>
                      <span className="text-purple-400">Paid By:</span>{" "}
                      {expense.paid_by}
                    </div>
                    <div>
                      <span className="text-purple-400">Source:</span>{" "}
                      {expense.from === "service" ? "Service" : "Manual"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#322c49] p-4 rounded-xl hidden md:block shadow overflow-x-auto">
              <h2 className="text-lg font-semibold mb-2">Expenses</h2>
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-left border-b border-purple-800">
                    <th className="py-2">Paid By</th>
                    <th>Details</th>
                    <th>Amount (₹)</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr
                      key={exp.id || `${exp.paid_by}-${exp.date}`}
                      className="border-b border-purple-900 hover:bg-purple-950/30"
                    >
                      <td className="py-2">{exp.paid_by}</td>
                      <td>
                        {typeof exp.details === "object" && exp.details.link ? (
                          <a
                            href={exp.details.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {exp.details.text}
                          </a>
                        ) : (
                          exp.details
                        )}
                      </td>
                      <td className="text-green-400">₹{exp.amount}</td>
                      <td>{new Date(exp.date).toLocaleDateString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex justify-center my-5">
          <button
            className="bg-purple-500 text-white px-4 py-2 rounded-full"
            onClick={() => setView(view === "expenses" ? "none" : "expenses")}
          >
            {view === "expenses" ? "Hide Expenses" : "Show Expenses"}
          </button>
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

            {/* Add Expense Button */}
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
              <span className="text-sm font-medium">
                {showForm ? "Cancel Expense" : "Add Expense"}
              </span>
            </button>

            {/* Add Credit Button */}
            <button
              onClick={() => {
                setShowCreditsForm(!showCreditsForm);
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
                {showCreditsForm ? "Cancel Credit" : "Add Credit"}
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

        {view === "credits" && (
          <>
            <div className="flex flex-wrap justify-items-start items-center mt-2 mb-4 gap-3">
              <div className="flex items-center gap-4 text-sm text-purple-300">
                <select
                  value={datefilter}
                  onChange={(e) => setdateFilter(e.target.value)}
                  className="bg-[#1e1b2e] border border-purple-700 text-white p-1 rounded"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Date</option>
                  <option value="all">All Time</option>
                </select>
                {datefilter === "custom" && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="bg-[#1e1b2e] border border-purple-700 text-white p-1 rounded"
                  />
                )}
              </div>
              <input
                type="text"
                placeholder="Cash Received By"
                value={filters.cashReceived}
                onChange={(e) =>
                  setFilters({ ...filters, cashReceived: e.target.value })
                }
                className="bg-[#1e1b2e] text-sm border border-purple-700 text-white p-1 rounded"
              />
              <div className="credit-range-filter gap-2">
                <input
                  type="number"
                  placeholder="Min Credit"
                  value={filters.minCredit}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minCredit: e.target.value,
                    }))
                  }
                  min="0"
                  step="0.01"
                  className="bg-[#1e1b2e] text-sm border border-purple-700 text-white p-1 rounded mr-2"
                />
                <input
                  type="number"
                  placeholder="Max Credit"
                  value={filters.maxCredit}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxCredit: e.target.value,
                    }))
                  }
                  min="0"
                  step="0.01"
                  className="bg-[#1e1b2e] text-sm border border-purple-700 text-white p-1 rounded mr-2"
                />
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      cashReceived: "",
                      minCredit: "",
                      maxCredit: "",
                    }))
                  }
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                >
                  Clear
                </button>
                
              </div>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <Download size={16} />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-[#1e1b2f] border border-gray-700">
                    <DropdownMenuItem
                      onClick={() => exportToExcel(credits, CreditColumns)}
                    >
                      Export Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToPDF(credits, CreditColumns)}>
                      Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrint(credits, CreditColumns)}>
                      Print
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="bg-[#322c49] p-4 rounded-xl mb-5 hidden md:block shadow overflow-x-auto mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Credits</h2>
                <span className="text-yellow-400 font-semibold">
                  Total: ₹{totalCredit}
                </span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-purple-800">
                    <th className="py-2">Customer</th>
                    <th>Date</th>
                    <th>Cash Received</th>
                    <th>Credit (₹)</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.length > 0 ? (
                    credits.map((credit) => (
                      <tr
                        key={credit._id || `${credit.customer}-${credit.date}`}
                        className="border-b border-purple-900 hover:bg-purple-950/30"
                      >
                        <td className="py-2">{credit.customer}</td>
                        <td>
                          {new Date(credit.date).toLocaleDateString("en-GB")}
                        </td>
                        <td>{credit.cashReceived || "-"}</td>
                        <td className="text-yellow-400 font-medium">
                          ₹{credit.credit}
                        </td>
                        <td>{credit.notes}</td>
                        <td>
                          <button
                            onClick={() => setSelectedCredit(credit)}
                            className="text-sm text-purple-300 hover:text-purple-100 underline"
                          >
                            Settle
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-purple-400 py-2">
                        No credit entries found for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {selectedCredit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-[#2c273f] text-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
                    <button
                      onClick={() => setSelectedCredit(null)}
                      className="absolute top-2 right-3 text-purple-300 hover:text-white"
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-semibold mb-4">
                      Settle Credit for {selectedCredit.customer}
                    </h3>
                    <form
                      onSubmit={(e) => handleSettlement(e, selectedCredit)}
                      className="space-y-4 text-sm"
                    >
                      <input
                        type="number"
                        name="amountPaid"
                        placeholder="Amount Paid"
                        className="w-full bg-[#1e1b2e] p-2 rounded border border-purple-700"
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(e.target.value)}
                        required
                      />
                      <select
                        name="method"
                        className="w-full bg-[#1e1b2e] p-2 rounded border border-purple-700"
                      >
                        <option>Khande</option>
                        <option>Savan</option>
                      </select>
                      <input
                        type="text"
                        name="notes"
                        placeholder="Notes (optional)"
                        value={settleNotes}
                        onChange={(e) => setSettleNotes(e.target.value)}
                        className="w-full bg-[#1e1b2e] p-2 rounded border border-purple-700"
                      />
                      <button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                      >
                        Confirm Settlement
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
            <div className=" md:hidden">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Credits</h2>
                <span className="text-yellow-400 font-semibold">
                  Total: ₹{totalCredit}
                </span>
              </div>
              {/* Swipe instruction */}
              <div className="text-purple-400 text-sm mb-3 text-center">
                Swipe left to settle credit
              </div>
              <div className="space-y-4">
                {credits.map((credit) => (
                  <div
                    key={credit._id || `${credit.customer}-${credit.date}`}
                    className="relative overflow-hidden rounded-lg border border-purple-700"
                    onTouchStart={(e) => onTouchStart(e, credit._id)}
                    onTouchMove={(e) => onTouchMove(e, credit._id)}
                    onTouchEnd={() => onTouchEnd(credit._id)}
                  >
                    <div className="absolute inset-y-0 right-0 bg-green-600 flex items-center justify-center px-6 rounded-r-lg">
                      <span className="text-white font-semibold text-sm">
                        SETTLE
                      </span>
                    </div>
                    {/* Card Content */}
                    <div
                      className="bg-[#322c49] p-4 text-sm transition-transform duration-200 ease-out"
                      style={{
                        transform: `translateX(-${
                          swipeStates[credit._id] || 0
                        }px)`,
                      }}
                    >
                      <div className="font-semibold text-purple-300 mb-2 flex justify-between items-center">
                        <span>{credit.customer}</span>
                        <span className="text-yellow-400">
                          ₹{credit.credit}
                        </span>
                      </div>
                      <div className="space-y-1 text-purple-200">
                        <p>
                          <span className="text-purple-400">Date:</span>{" "}
                          {new Date(credit.date).toLocaleDateString("en-GB")}
                        </p>
                        <p>
                          <span className="text-purple-400">
                            Cash Received:
                          </span>{" "}
                          {credit.cashReceived || "-"}
                        </p>
                        <p>
                          <span className="text-purple-400">Notes:</span>{" "}
                          {credit.notes || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="flex justify-center my-5">
          <button
            className="bg-purple-500 text-white px-4 py-2 rounded-full"
            onClick={() => setView(view === "credits" ? "none" : "credits")}
          >
            {view === "credits" ? "Hide Credits" : "Show Credits"}
          </button>
        </div>

        {/* Settlement Modal */}
        {selectedCredit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2c273f] text-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
              <button
                onClick={() => setSelectedCredit(null)}
                className="absolute top-2 right-3 text-purple-300 hover:text-white text-xl"
              >
                ✕
              </button>
              <h3 className="text-lg font-semibold mb-4">
                Settle Credit for {selectedCredit.customer}
              </h3>
              <div className="text-sm text-purple-300 mb-4">
                Outstanding Amount: ₹{selectedCredit.credit}
              </div>
              <form onSubmit={handleSettlement} className="space-y-4 text-sm">
                <input
                  type="number"
                  placeholder="Amount Paid"
                  className="w-full bg-[#1e1b2e] p-3 rounded border border-purple-700 text-white"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  required
                />
                <select className="w-full bg-[#1e1b2e] p-3 rounded border border-purple-700 text-white">
                  <option>Khande</option>
                  <option>Savan</option>
                </select>
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full bg-[#1e1b2e] p-3 rounded border border-purple-700 text-white"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCredit(null)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded font-medium"
                  >
                    Settle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
