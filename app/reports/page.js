"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  exportToExcel,
  exportToPDF,
  printData,
} from "/app/utils/export";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "/components/ui/dropdown-menu";
import { Button } from "/components/ui/button";
import {
  Calendar,
  User,
  Wrench,
  Clock,
  Download,
  DollarSign,
  MapPin,
  CheckCircle,
  CircleDollarSign,
  BadgeIndianRupee,
  ChevronLeft,
  ChevronRight,
  Home,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import TravelButton from "@/components/ui/travelButton";

const TechnicianReport = () => {
  const Route = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState("daily"); // 'daily', 'weekly', 'monthly'
  const [showDateRange, setShowDateRange] = useState(false);
  const [manualIncome, setmanualIncome] = useState([]);
  const [customRange, setcustomRange] = useState({
    from: "",
    to: "",
  });

  // Extended sample data covering multiple dates
  const [sampleServicesData, setSampleServicesData] = useState([]);
  const [creditsData, setCreditsData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [activeSummaryDateRange, setActiveSummaryDateRange] = useState(null);
  useEffect(() => {
    fetch("api/manualIncome")
      .then((res) => res.json())
      .then(setmanualIncome);
    fetch("/api/credits")
      .then((res) => res.json())
      .then(setCreditsData);
    fetch("/api/spent")
      .then((res) => res.json())
      .then(setExpensesData);
    fetch("/api/services")
      .then((response) => response.json())
      .then((data) => {
        // Normalize date field
        const normalizedData = data.map((item) => ({
          ...item,
          date:
            typeof item.date === "object" && item.date.$date
              ? item.date.$date
              : item.date,
        }));
        setSampleServicesData(normalizedData);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  const goToPrevious = () => {
    const d = new Date(selectedDate);
    switch (viewType) {
      case "daily":
        d.setDate(d.getDate() - 1);
        break;
      case "weekly":
        d.setDate(d.getDate() - 7);
        break;
      case "monthly":
        d.setMonth(d.getMonth() - 1);
        break;
    }
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const goToNext = () => {
    const d = new Date(selectedDate);
    switch (viewType) {
      case "daily":
        d.setDate(d.getDate() + 1);
        break;
      case "weekly":
        d.setDate(d.getDate() + 7);
        break;
      case "monthly":
        d.setMonth(d.getMonth() + 1);
        break;
    }
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // FIX 1: Add missing getDateString function
  const getDateString = (dateStr) => {
    if (!dateStr) return "";
    let dateObj;
    // Handle MongoDB extended JSON { $date: ... }
    if (typeof dateStr === "object" && dateStr.$date) {
      dateObj = new Date(dateStr.$date);
    } else {
      dateObj = new Date(dateStr);
    }
    // Check for invalid date
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0];
  };

  // Helper functions for date calculations

  // Process data based on view type
  const reportData = useMemo(() => {
    const getWeekStart = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day;
      return new Date(d.setDate(diff));
    };

    const getWeekEnd = (date) => {
      const start = getWeekStart(date);
      return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    };

    const getMonthStart = (date) => {
      const d = new Date(date);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    };

    const getMonthEnd = (date) => {
      const d = new Date(date);
      return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    };

    const selectedDateObj = new Date(selectedDate);

    const isInRange = (date) => {
      const d = new Date(date);
      switch (viewType) {
        case "daily":
          return getDateString(d) === getDateString(selectedDateObj);
        case "weekly":
          const start = getWeekStart(selectedDateObj);
          const end = getWeekEnd(selectedDateObj);
          return d >= start && d <= end;
        case "monthly":
          const mStart = getMonthStart(selectedDateObj);
          const mEnd = getMonthEnd(selectedDateObj);
          return d >= mStart && d <= mEnd;
        case "custom":
          if (!customRange.from || !customRange.to) return false;
          const from = new Date(customRange.from);
          const to = new Date(customRange.to);
          return d >= from && d <= to;
        default:
          return false;
      }
    };

    // Filter service data
    const filteredServices = sampleServicesData.filter((s) =>
      isInRange(s.date?.$date || s.date)
    );

    // Filter credits
    const filteredCredits = creditsData.filter((c) =>
      isInRange(c.date?.$date || c.date)
    );

    // Filter expenses
    const filteredExpenses = expensesData.filter((e) =>
      isInRange(e.date?.$date || e.date)
    );

    const groupedByTechnician = {};

    // Group service entries
    for (const service of filteredServices) {
      const tech = service.cashReceived || service.employee || "Unknown";
      if (!groupedByTechnician[tech]) {
        groupedByTechnician[tech] = {
          name: tech,
          services: [],
          credits: [],
          expenses: [],
          summary: {
            totalServices: 0,
            completedServices: 0,
            totalIncome: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            totalCredit: 0,
            totalHours: 0,
            locations: new Set(),
            serviceTypes: new Set(),
            dailyBreakdown: {},
            weeklyBreakdown: {},
          },
        };
      }

      groupedByTechnician[tech].services.push(service);
      const summary = groupedByTechnician[tech].summary;

      summary.totalServices++;
      if (service.customer?.trim()) summary.completedServices++;
      summary.totalIncome += service.income || 0;
      summary.totalRevenue += (service.income || 0) - (service.credit || 0);
      summary.totalExpenses += service.expense || 0;
      summary.totalCredit += service.credit || 0;
      summary.locations.add(service.address || "Unknown");
      summary.serviceTypes.add(service.task || "Unknown");

      const dateKey = getDateString(service.date?.$date || service.date);
      if (!summary.dailyBreakdown[dateKey]) {
        summary.dailyBreakdown[dateKey] = {
          services: 0,
          income: 0,
          credit: 0,
          expenses: 0,
          revenue: 0,
          hours: 0,
        };
      }
      summary.dailyBreakdown[dateKey].services++;
      summary.dailyBreakdown[dateKey].income += service.income || 0;
      summary.dailyBreakdown[dateKey].expenses += service.expense || 0;
      summary.dailyBreakdown[dateKey].credit += service.credit || 0;
      summary.dailyBreakdown[dateKey].revenue +=
        (service.income || 0) - (service.credit || 0);
    }

    // Group credits
    for (const credit of filteredCredits) {
      const tech = credit.cashReceived || "Unknown";
      if (!groupedByTechnician[tech]) {
        groupedByTechnician[tech] = {
          name: tech,
          services: [],
          credits: [],
          expenses: [],
          summary: {
            totalServices: 0,
            completedServices: 0,
            totalExpenses: 0,
            totalIncome: 0,
            totalCredit: 0,
            totalRevenue: 0,
            totalHours: 0,
            locations: new Set(),
            serviceTypes: new Set(),
            dailyBreakdown: {},
            weeklyBreakdown: {},
          },
        };
      }

      groupedByTechnician[tech].credits.push(credit);
      const summary = groupedByTechnician[tech].summary;

      summary.totalRevenue -= credit.credit || 0;
      summary.totalCredit += credit.credit || 0;

      const dateKey = getDateString(credit.date?.$date || credit.date);
      if (!summary.dailyBreakdown[dateKey]) {
        summary.dailyBreakdown[dateKey] = {
          services: 0,
          income: 0,
          expenses: 0,
          credit: 0,
          revenue: 0,
          hours: 0,
        };
      }
      summary.dailyBreakdown[dateKey].revenue -= credit.credit || 0;
    }

    // Group expenses
    for (const expense of filteredExpenses) {
      const tech = expense.paid_by || "Unknown";
      if (!groupedByTechnician[tech]) {
        groupedByTechnician[tech] = {
          name: tech,
          services: [],
          credits: [],
          expenses: [],
          summary: {
            totalServices: 0,
            completedServices: 0,
            totalCredit: 0,
            totalIncome: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            totalHours: 0,
            locations: new Set(),
            serviceTypes: new Set(),
            dailyBreakdown: {},
            weeklyBreakdown: {},
          },
        };
      }

      groupedByTechnician[tech].expenses.push(expense);
      const summary = groupedByTechnician[tech].summary;

      summary.totalExpenses += expense.amount || 0;

      const dateKey = getDateString(expense.date?.$date || expense.date);
      if (!summary.dailyBreakdown[dateKey]) {
        summary.dailyBreakdown[dateKey] = {
          services: 0,
          income: 0,
          expenses: 0,
          credit: 0,
          revenue: 0,
          hours: 0,
        };
      }
      summary.dailyBreakdown[dateKey].expenses += expense.amount || 0;
    }

    // Convert sets to arrays
    Object.values(groupedByTechnician).forEach((tech) => {
      tech.summary.locations = Array.from(tech.summary.locations);
      tech.summary.serviceTypes = Array.from(tech.summary.serviceTypes);
    });
    // Add manual income to the grouped data
    const filteredManualIncome = manualIncome.filter((income) =>
      isInRange(income.date?.$date || income.date)
    );
    const totalManualIncome = filteredManualIncome.reduce(
      (sum, income) => sum + (income.amount || 0),
      0
    );
    // Add manual income to each technician's summary

    // Date range label
    let dateRange = "";
    switch (viewType) {
      case "daily":
        dateRange = selectedDateObj.toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        break;
      case "weekly":
        const weekStart = getWeekStart(selectedDateObj);
        const weekEnd = getWeekEnd(selectedDateObj);
        dateRange = `${weekStart.toLocaleDateString(
          "en-GB"
        )} - ${weekEnd.toLocaleDateString("en-GB")}`;
        break;
      case "monthly":
        dateRange = selectedDateObj.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
        });
        break;
      case "custom":
        if (customRange.from && customRange.to) {
          const from = new Date(customRange.from);
          const to = new Date(customRange.to);
          dateRange = `${from.toLocaleDateString(
            "en-GB"
          )} - ${to.toLocaleDateString("en-GB")}`;
        } else {
          dateRange = "Custom Range";
        }
        break;
    }

    Object.values(groupedByTechnician).forEach((tech) => {
      const weekly = {};

      Object.entries(tech.summary.dailyBreakdown).forEach(
        ([dateStr, dailyData]) => {
          const weekStart = getDateString(getWeekStart(dateStr));

          if (!weekly[weekStart]) {
            weekly[weekStart] = {
              services: 0,
              income: 0,
              credit: 0,
              expenses: 0,
              revenue: 0,
              hours: 0,
            };
          }

          weekly[weekStart].services += dailyData.services;
          weekly[weekStart].income += dailyData.income;
          weekly[weekStart].credit += dailyData.credit;
          weekly[weekStart].expenses += dailyData.expenses;
          weekly[weekStart].revenue += dailyData.revenue;
          weekly[weekStart].hours += dailyData.hours;
        }
      );

      tech.summary.weeklyBreakdown = weekly;
    });

    Object.values(groupedByTechnician).forEach((tech) => {
      tech.rangedServices = tech.services.filter((s) => {
        const serviceDate = new Date(s.date?.$date || s.date);
        if (!activeSummaryDateRange) return true;
    
        if (viewType === "monthly") {
          const weekStart = getDateString(getWeekStart(serviceDate));
          return weekStart === activeSummaryDateRange;
        } else if (viewType === "weekly") {
          const day = getDateString(serviceDate);
          return day === activeSummaryDateRange;
        }
    
        return true;
      });
    });

    return {
      groupedByTechnician,
      dateRange,
      filteredData: filteredServices,
      filteredManualIncome,
      totalManualIncome,
    };
  }, [
    selectedDate,
    viewType,
    sampleServicesData,
    creditsData,
    expensesData,
    customRange,
    manualIncome,
    activeSummaryDateRange,
  ]);

  const formatCurrency = (amount) => `₹${amount.toLocaleString()}`;
  const formatTime = (time) =>
    time
      ? new Date(`2000-01-01 ${time}`).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--";

  const ViewTypeButton = ({ type, label, icon: Icon }) => (
    <button
      onClick={() => setViewType(type)}
      className={`flex items-center gap-2 px-2 py-2 rounded-lg font-small transition-all ${
        viewType === type
          ? "bg-gradient-to-br from-slate-900 to-slate-800 text-purple-300 shadow-md"
          : "bg-[#2c273f] text-purple-100 hover:bg-gradient-to-br from-slate-900 to-slate-800 border border-gray-600"
      }`}
    >
      <Icon size={12} />
      {label}
    </button>
  );

  return (
    <div className="mx-auto bg-[#1e1b2e] text-purple-300 p-4 min-h-screen">
      {/* Header */}
      <div className="bg-[#2c273f] rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
              <Wrench className="text-purple-300" />
              Technician Report
            </h1>
            <p className="text-purple-100 mt-1">
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)} performance
              overview - {reportData?.dateRange || "select a date"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 mb-4">
            {/* ⬅️➡️ Navigation + Date Range */}
            <div className="flex items-center gap-2 min-w-[260px]">
              <button
                onClick={goToPrevious}
                className="w-9 h-9 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                <ChevronLeft />
              </button>
              <span className="text-white font-medium truncate">
                {reportData.dateRange}
              </span>
              <button
                onClick={goToNext}
                className="w-9 h-9 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                <ChevronRight />
              </button>
            </div>

            {/* View Type Buttons */}
            {!showDateRange && (
              <div className="flex md:flex-row sm:flex-row gap-2 ">
                <ViewTypeButton type="daily" label="Daily" icon={Calendar} />
                <ViewTypeButton type="weekly" label="Weekly" icon={BarChart3} />
                <ViewTypeButton
                  type="monthly"
                  label="Monthly"
                  icon={TrendingUp}
                />
              </div>
            )}

            {/* Date Picker or Custom Range */}
            <div className="flex items-center gap-2">
              {!showDateRange ? (
                <button
                  onClick={() => {
                    setShowDateRange(true);
                    setViewType("custom");
                  }}
                  className="px-3 py-2 bg-[#2c273f] text-purple-100 border border-slate-600 rounded-lg hover:bg-purple-700 transition"
                >
                  Custom Range
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={customRange.from}
                    onChange={(e) =>
                      setcustomRange({ ...customRange, from: e.target.value })
                    }
                    className="px-3 py-2 bg-[#2c273f] border border-gray-600 text-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span className="text-purple-300">to</span>
                  <input
                    type="date"
                    value={customRange.to}
                    onChange={(e) =>
                      setcustomRange({ ...customRange, to: e.target.value })
                    }
                    className="px-3 py-2 bg-[#2c273f] border border-gray-600 text-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Cancel Button */}
            {showDateRange && (
              <button
                onClick={() => {
                  setShowDateRange(false);
                  setcustomRange({ from: "", to: "" });
                }}
                className="px-3 py-2 bg-[#2c273f] text-purple-100 border border-purple-600 rounded-lg hover:bg-purple-700 transition"
              >
                Cancel
              </button>
            )}

            {/* Export Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Download size={16} />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-[#1e1b2f] border border-gray-700">
                <DropdownMenuItem
                  onClick={() =>
                    exportToExcel(
                      reportData.groupedByTechnician,
                      reportData.dateRange
                    )
                  }
                >
                  Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    exportToPDF(
                      reportData.groupedByTechnician,
                      reportData.dateRange
                    )
                  }
                >
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    printData(
                      reportData.groupedByTechnician,
                      reportData.dateRange
                    )
                  }
                >
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Home Button */}
            <div className="hidden md:block">
            <TravelButton/>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#2c273f] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Active Technicians</p>
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(reportData.groupedByTechnician).length}
              </p>
            </div>
            <User className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-[#2c273f] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Total Services</p>
              <p className="text-2xl font-bold text-purple-600">
                {Object.values(reportData.groupedByTechnician).reduce(
                  (sum, tech) => sum + tech.summary.totalServices,
                  0
                )}
              </p>
            </div>
            <Wrench className="text-purple-600" size={24} />
          </div>
        </div>

        <div className="bg-[#2c273f] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  Object.values(reportData.groupedByTechnician).reduce(
                    (sum, tech) => sum + tech.summary.totalIncome,
                    0
                  )
                )}
              </p>
            </div>
            <CircleDollarSign className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-[#2c273f] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Total Extra Income</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{reportData.totalManualIncome.toLocaleString()}
              </p>
            </div>
            <CircleDollarSign className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-[#2c273f] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Total Credit</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(
                  Object.values(reportData.groupedByTechnician).reduce(
                    (sum, tech) => sum + tech.summary.totalCredit,
                    0
                  )
                )}
              </p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-[#2c273f] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  Object.values(reportData.groupedByTechnician).reduce(
                    (sum, tech) => sum + tech.summary.totalExpenses,
                    0
                  )
                )}
              </p>
            </div>
            <BadgeIndianRupee className="text-red-600" size={24} />
          </div>
        </div>

        <div className="bg-[#2c273f] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Revenue collection Rate</p>
              <p className="text-2xl font-bold text-indigo-600">
                {Object.values(reportData.groupedByTechnician).length > 0
                  ? Math.round(
                      (Object.values(reportData.groupedByTechnician).reduce(
                        (sum, tech) => sum + tech.summary.totalRevenue,
                        0
                      ) /
                        Object.values(reportData.groupedByTechnician).reduce(
                          (sum, tech) => sum + tech.summary.totalIncome,
                          0
                        )) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
            <CheckCircle className="text-indigo-600" size={24} />
          </div>
        </div>
        <div className="bg-[#2c273f] p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Net Profit</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(
                  Object.values(reportData.groupedByTechnician).reduce(
                    (sum, tech) =>
                      sum +
                      tech.summary.totalIncome -
                      tech.summary.totalExpenses,
                    0
                  )
                )}
              </p>
            </div>
            <DollarSign className="text-emerald-600" size={24} />
          </div>
        </div>
      </div>

      {/* Individual Technician Reports */}
      <div className="space-y-6">
        {Object.values(reportData.groupedByTechnician).map((techData) => (
          <div
            key={techData.name}
            className="bg-[#2c273f] rounded-lg shadow-sm overflow-hidden"
          >
            {/* Technician Header */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-purple-300 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#2c273f]/20 p-2 rounded-full">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{techData.name}</h2>
                    <p className="text-blue-100">
                      {techData.summary.completedServices}/
                      {techData.summary.totalServices} services completed
                      {viewType !== "daily" &&
                        ` • ${
                          Object.keys(techData.summary.dailyBreakdown).length
                        } active days`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-blue-100 text-sm">Income</p>
                    <p className="font-bold">
                      {formatCurrency(techData.summary.totalIncome)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Expenses</p>
                    <p className="font-bold">
                      {formatCurrency(techData.summary.totalExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Credit</p>
                    <p className="font-bold">{techData.summary.totalCredit}</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Profit</p>
                    <p className="font-bold">
                      {formatCurrency(
                        techData.summary.totalIncome -
                          techData.summary.totalExpenses
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Types */}
              {techData.summary.serviceTypes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-blue-100 text-sm mb-2">Service Types:</p>
                  <div className="flex flex-wrap gap-2">
                    {techData.summary.serviceTypes.map((type) => (
                      <span
                        key={type}
                        className="bg-[#2c273f]/20 px-2 py-1 rounded text-sm"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Daily Breakdown for Weekly/Monthly Views */}
            {viewType === "weekly" && (
              <div className="p-6 bg-[#2c273f]/20 border-b border-gray-600">
                <h3 className="font-semibold text-purple-100 mb-4">
                  {viewType === "weekly" ? "Daily Breakdown" : "Daily Summary"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(techData.summary.dailyBreakdown)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .slice(0, viewType === "weekly" ? 7 : 10)
                    .map(([date, data]) => (
                      <button
                        key={date}
                        onClick={() => setActiveSummaryDateRange(date)}
                        className={`text-left bg-[#2c273f] p-3 rounded border ${
                          activeSummaryDateRange === date
                            ? "border-slate-500"
                            : "border-gray-600"
                        } hover:border-purple-500 transition`}
                      >
                        <div
                          key={date}
                          className="bg-[#2c273f] p-3 rounded border border-gray-600"
                        >
                          <p className="font-medium text-purple-100">
                            {new Date(date).toLocaleDateString("en-GB", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <div className="mt-2 space-y-1 text-sm">
                            <div>{data.services} services</div>
                            <div className="text-green-400">
                              {formatCurrency(data.revenue)}
                            </div>
                            <div className="text-purple-300">
                              Exp: {formatCurrency(data.expenses)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
            {viewType === "monthly" && (
              <div className="p-6 bg-[#2c273f]/20 border-b border-gray-600">
                <h3 className="font-semibold text-purple-100 mb-4">
                  Weekly Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(techData.summary.weeklyBreakdown)
                    .sort(([a], [b]) => new Date(a) - new Date(b)) // ascending order
                    .map(([weekStart, data], index) => {
                      const start = new Date(weekStart);
                      const end = new Date(start);
                      end.setDate(start.getDate() + 6);
                      const formattedStart = start.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      });
                      const formattedEnd = end.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      });

                      return (
                        <button
                          key={weekStart}
                          onClick={() => setActiveSummaryDateRange(weekStart)}
                          className={`text-left bg-[#2c273f] p-3 rounded border ${
                            activeSummaryDateRange === weekStart
                              ? "bg-slate-500"
                              : "bg-[#2c273f]"
                          } hover:border-purple-500 transition`}
                        >
                          <div
                            key={weekStart}
                            className="bg-[#2c273f] p-3 rounded border border-gray-600"
                          >
                            <p className="font-medium text-purple-100 mb-1">
                              Week {index + 1}: {formattedStart} -{" "}
                              {formattedEnd}
                            </p>
                            <div className="space-y-1 text-sm">
                              <div>{data.services} services</div>
                              <div className="text-green-400">
                                {formatCurrency(data.income)}
                              </div>
                              <div className="text-purple-300">
                                Exp: {formatCurrency(data.expenses)}
                              </div>
                              <div className="text-purple-300">
                                credit: {formatCurrency(data.credit)}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Services List */}
            <div className="p-6">
              <div className="grid gap-4">
                {techData.rangedServices
                  .sort(
                    (a, b) => new Date(b.date.$date) - new Date(a.date.$date)
                  )
                  .slice(0, viewType === "daily" ? 50 : 20)
                  .map((service) => (
                    <div
                      key={service._id.$oid || service._id}
                      className="border border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-purple-100">
                              {service.customer || "Unknown Customer"}
                            </h3>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                              <CheckCircle size={12} className="inline mr-1" />
                              completed
                            </span>
                            {viewType !== "daily" && (
                              <span className="text-xs text-purple-300 bg-[#2c273f] px-2 py-1 rounded">
                                {new Date(service.date).toLocaleDateString(
                                  "en-GB"
                                )}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-100">
                            <div className="flex items-center gap-1">
                              <Wrench size={14} />
                              <span>{service.task || "Unknown Service"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span>
                                {service.address || "Unknown Location"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>Phone: {service.phone || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={14} />
                              <span className="text-yellow-500">
                                Credit:{" "}
                                {formatCurrency(
                                  (service.credit || 0)
                                )}
                              </span>
                            </div>
                          </div>

                          {service.parts && service.parts.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-purple-300">
                                Parts used:{" "}
                              </span>
                              <span className="text-xs text-purple-100">
                                {service.parts
                                  .map((p) => `${p.item} (${p.qty})`)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">
                            {formatCurrency(
                              (service.income || 0)
                            )}
                          </div>
                          <div className="text-sm text-purple-300">
                            Expense: {formatCurrency(service.expense || 0)}
                          </div>
                          <div className="text-sm font-medium text-purple-100">
                            Profit:{" "}
                            {formatCurrency(
                              (service.income || 0) -
                                (service.expense || 0)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {techData.services.length > (viewType === "daily" ? 50 : 20) && (
                <div className="mt-4 text-center">
                  <p className="text-purple-300 text-sm">
                    Showing {viewType === "daily" ? 50 : 20} of{" "}
                    {techData.services.length} services
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Floating Action Button */}
      <div className="absolute top-5 right-5 space-y-3 z-50 md:hidden">
       <TravelButton/>
      </div>

      {Object.keys(reportData.groupedByTechnician).length === 0 && (
        <div className="bg-[#2c273f] rounded-lg shadow-sm p-12 text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-purple-100 mb-2">
            No services found
          </h3>
          <p className="text-purple-100">
            No technician activities recorded for the selected {viewType}{" "}
            period.
          </p>
        </div>
      )}
    </div>
  );
};

export default TechnicianReport;
