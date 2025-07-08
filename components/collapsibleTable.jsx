import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Settings,
  Expand,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"; // adjust to your setup
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const CollapsibleTable = ({ filteredLogs, onRefresh }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [expandedCells, setExpandedCells] = useState({});
  const [detailModal, setDetailModal] = useState({
    show: false,
    data: null,
    field: null,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  //print handling
  const handlePrint = () => {
    const selectedColumns = columns.filter((col) => visibleColumns[col.key]);

    const tableHead = `
      <tr>
        ${selectedColumns
          .map(
            (col) =>
              `<th style="text-align:left; padding:8px; border-bottom:1px solid #ccc;">${col.label}</th>`
          )
          .join("")}
      </tr>`;

    const tableBody = filteredLogs
      .map(
        (srv) => `
      <tr>
        ${selectedColumns
          .map((col) => {
            const value = (() => {
              switch (col.key) {
                case "date":
                  return new Date(srv.date).toLocaleDateString("en-GB");
                case "income":
                  return `₹${srv.income}`;
                case "credit":
                  return srv.credit ? `₹${srv.credit}` : "—";
                case "expense":
                  return `₹${srv.expense}`;
                case "parts":
                  return (
                    srv.parts?.map((p) => `${p.item} (${p.qty})`).join(", ") ||
                    "—"
                  );
                case "technician":
                  return srv.employee || "—";
                case "cashMode":
                  return srv.cashReceived || "—";
                default:
                  return srv[col.key] || "—";
              }
            })();
            return `<td style="padding:8px; border-bottom:1px solid #eee;">${value}</td>`;
          })
          .join("")}
      </tr>
    `
      )
      .join("");

    const printWindow = window.open("", "", "height=800,width=1000");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print - Service Logs</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>Service Logs Report</h2>
          <table>
            <thead>${tableHead}</thead>
            <tbody>${tableBody}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const exportToExcel = () => {
    const selectedColumns = columns.filter((col) => visibleColumns[col.key]);
    const exportData = filteredLogs.map((row) => {
      const entry = {};
      selectedColumns.forEach((col) => {
        switch (col.key) {
          case "date":
            entry[col.label] = new Date(row.date).toLocaleDateString("en-GB");
            break;
          case "parts":
            entry[col.label] = row.parts
              ?.map((p) => `${p.item} (${p.qty})`)
              .join(", ");
            break;
          case "technician":
            return srv.employee || "—";
          case "cashMode":
            return srv.cashReceived || "—";
          default:
            entry[col.label] = row[col.key] ?? "—";
        }
      });
      return entry;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Service Logs");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Service_Logs.xlsx");
  };

  const exportToPDF = () => {
    const selectedColumns = columns.filter((col) => visibleColumns[col.key]);
    const doc = new jsPDF();

    const tableData = filteredLogs.map((row) =>
      selectedColumns.map((col) => {
        switch (col.key) {
          case "date":
            return new Date(row.date).toLocaleDateString("en-GB");
          case "parts":
            return row.parts?.map((p) => `${p.item} (${p.qty})`).join(", ");
          case "technician":
            return srv.employee || "—";
          case "cashMode":
            return srv.cashReceived || "—";
          default:
            return row[col.key] ?? "—";
        }
      })
    );

    autoTable(doc, {
      head: [selectedColumns.map((col) => col.label)],
      body: tableData,
      styles: { fontSize: 8 },
      margin: { top: 20 },
    });

    doc.save("Service_Logs.pdf");
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  //delete button handler 
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
  
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        const updated = filteredLogs.filter((item) => item._id !== id);
        // update filteredLogs or call prop method to update the parent
        // example:
        setCurrentPage(1); // reset page
        // optionally notify parent
        onRefresh?.();



      } else {
        console.error("Failed to delete entry");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };
  

  
  const [visibleColumns, setVisibleColumns] = useState({
    customer: true,
    phone: true,
    address: true,
    task: true,
    parts: true,
    technician: true,
    assistant: false,
    income: true,
    credit: false,
    cashMode: false,
    expense: false,
    date: true,
    notes: false,
    delete: true,
    
  });

  // Toggle cell expansion
  const toggleCellExpansion = (rowId, column) => {
    const key = `${rowId}-${column}`;
    setExpandedCells((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Show detail modal
  const showDetail = (data, field, label) => {
    setDetailModal({ show: true, data, field, label });
  };

  // Toggle column visibility
  const toggleColumn = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Check if text is long enough to need expansion
  const isLongText = (text, maxLength = 30) => {
    return text && text.length > maxLength;
  };

  // Column definitions
  const columns = [
    { key: "customer", label: "Customer", essential: true },
    { key: "phone", label: "Phone", essential: false },
    { key: "address", label: "Address", essential: false },
    { key: "task", label: "Task", essential: true },
    { key: "parts", label: "Parts Used", essential: false },
    { key: "technician", label: "Technician", essential: true },
    { key: "assistant", label: "Assistant", essential: false },
    { key: "income", label: "₹Income", essential: true },
    { key: "credit", label: "₹Credit", essential: false },
    { key: "cashMode", label: "Payment", essential: false },
    { key: "expense", label: "₹Expense", essential: false },
    { key: "date", label: "Date", essential: true },
    { key: "notes", label: "Notes", essential: false },
    { key: "delete", label: "Delete", essential: false },
  ];

  // Preset column configurations
  const presets = {
    minimal: {
      customer: true,
      task: true,
      technician: true,
      income: true,
      date: true,
      delete: true,
    },
    financial: {
      customer: true,
      income: true,
      credit: true,
      expense: true,
      cashMode: true,
      date: true,
      delete: true,
    },
    detailed: {
      customer: true,
      phone: true,
      address: true,
      task: true,
      parts: true,
      technician: true,
      assistant: true,
      income: true,
      credit: true,
      expense: true,
      date: true,
      notes: true,
      delete: true,
    },
    service: {
      customer: true,
      phone: true,
      task: true,
      parts: true,
      technician: true,
      assistant: true,
      date: true,
      delete: true,
    },
  };

  const applyPreset = (presetName) => {
    setVisibleColumns((prev) => {
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      return { ...newState, ...presets[presetName] };
    });
  };

  const renderCellContent = (srv, column) => {
    const rowId = srv._id || srv.id;
    const cellKey = `${rowId}-${column}`;
    const isExpanded = expandedCells[cellKey];

    switch (column) {
      case "customer":
        return <div className="text-white font-medium">{srv.customer}</div>;

      case "phone":
        return srv.phone ? (
          <a
            href={`tel:${srv.phone}`}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {srv.phone}
          </a>
        ) : (
          <span className="text-slate-500">—</span>
        );

      case "address":
        const addressText = srv.address;
        const isAddressLong = isLongText(addressText);
        return (
          <div className="relative group">
            <div
              className={`text-slate-300 ${
                !isExpanded && isAddressLong ? "max-w-32 truncate" : "max-w-48"
              }`}
            >
              {addressText}
            </div>
            {isAddressLong && (
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => toggleCellExpansion(rowId, column)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {isExpanded ? "Less" : "More"}
                </button>
                <button
                  onClick={() =>
                    showDetail(addressText, "address", "Full Address")
                  }
                  className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  title="View in popup"
                >
                  <Expand size={12} />
                </button>
              </div>
            )}
          </div>
        );

      case "task":
        const taskText = srv.task;
        const isTaskLong = isLongText(taskText);
        return (
          <div className="relative group">
            <div
              className={`text-slate-300 ${
                !isExpanded && isTaskLong ? "max-w-40 truncate" : "max-w-64"
              }`}
            >
              {taskText}
            </div>
            {isTaskLong && (
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => toggleCellExpansion(rowId, column)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {isExpanded ? "Less" : "More"}
                </button>
                <button
                  onClick={() => showDetail(taskText, "task", "Task Details")}
                  className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  title="View in popup"
                >
                  <Expand size={12} />
                </button>
              </div>
            )}
          </div>
        );

      case "parts":
        if (!srv.parts || srv.parts.length === 0) {
          return <span className="text-slate-500">—</span>;
        }

        const partsText = srv.parts
          .map((p) => `${p.item} (${p.qty})`)
          .join(", ");
        const isPartsLong = srv.parts.length > 2;

        return (
          <div className="max-w-48 space-y-1">
            {isExpanded
              ? // Show all parts when expanded
                srv.parts.map((p, i) => (
                  <div
                    key={i}
                    className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300"
                  >
                    {p.item} <span className="text-slate-400">({p.qty})</span>
                  </div>
                ))
              : // Show first 2 parts when collapsed
                srv.parts.slice(0, 2).map((p, i) => (
                  <div
                    key={i}
                    className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300"
                  >
                    {p.item} <span className="text-slate-400">({p.qty})</span>
                  </div>
                ))}
            {isPartsLong && (
              <div className="flex items-center gap-2">
                {!isExpanded && (
                  <div className="text-xs text-slate-400">
                    +{srv.parts.length - 2} more
                  </div>
                )}
                <button
                  onClick={() => toggleCellExpansion(rowId, column)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {isExpanded ? "Less" : "Show All"}
                </button>
                <button
                  onClick={() =>
                    showDetail(partsText, "parts", "All Parts Used")
                  }
                  className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  title="View in popup"
                >
                  <Expand size={12} />
                </button>
              </div>
            )}
          </div>
        );

      case "technician":
        return <div className="text-slate-300 font-medium">{srv.employee}</div>;

      case "assistant":
        return srv.assistant ? (
          <div className="text-slate-400">{srv.assistant}</div>
        ) : (
          <span className="text-slate-500">—</span>
        );

      case "income":
        return (
          <span className="text-green-400 font-medium">₹{srv.income}</span>
        );

      case "credit":
        return srv.credit ? (
          <span className="text-amber-400">₹{srv.credit}</span>
        ) : (
          <span className="text-slate-500">—</span>
        );

      case "cashMode":
        return (
          <span className="text-slate-300 text-xs">{srv.cashReceived}</span>
        );

      case "expense":
        return <span className="text-red-400">₹{srv.expense}</span>;

      case "date":
        return (
          <div className="text-slate-300 text-sm">
            {new Date(srv.date).toLocaleDateString("en-GB")}
          </div>
        );

      case "notes":
        const notesText = srv.notes;
        if (!notesText) return <span className="text-slate-500">—</span>;

        const isNotesLong = isLongText(notesText);
        return (
          <div className="relative group">
            <div
              className={`text-slate-400 text-xs ${
                !isExpanded && isNotesLong ? "max-w-32 truncate" : "max-w-48"
              }`}
            >
              {notesText}
            </div>
            {isNotesLong && (
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => toggleCellExpansion(rowId, column)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {isExpanded ? "Less" : "More"}
                </button>
                <button
                  onClick={() => showDetail(notesText, "notes", "Full Notes")}
                  className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  title="View in popup"
                >
                  <Expand size={12} />
                </button>
              </div>
            )}
          </div>
        );
        case "delete":
          return (
            <button
              onClick={() => handleDelete(srv._id)}
              className="text-white  hover:underline text-xs "
            >
              Delete
            </button>
          );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-2xl hidden md:block">
      {/* Header with Table Info and Pagination Info */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-semibold">Service Records</h3>
          <span className="text-slate-400 text-sm">
            {Object.values(visibleColumns).filter(Boolean).length} of{" "}
            {columns.length} columns visible
          </span>
          <span className="text-slate-400 text-sm">•</span>
          <span className="text-slate-400 text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)}{" "}
            of {filteredLogs.length} entries
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-300">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="bg-slate-700 text-slate-300 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Settings size={16} />
            Customize
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Download size={16} />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-[#1e1b2f] border border-gray-700">
              <DropdownMenuItem onClick={exportToExcel}>
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>Print</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="mb-4">
            <h4 className="text-white font-medium mb-3">Quick Presets</h4>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(presets).map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    applyPreset(preset), setShowSettings(!showSettings);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors capitalize"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3">Individual Columns</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {columns.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns[column.key]}
                    onChange={() => toggleColumn(column.key)}
                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                  />
                  <span
                    className={`text-sm ${
                      visibleColumns[column.key]
                        ? "text-white"
                        : "text-slate-400"
                    }`}
                  >
                    {column.label}
                    {column.essential && (
                      <span className="text-blue-400 ml-1">*</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-2">
              * Essential columns recommended for basic functionality
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              {columns.map(
                (column) =>
                  visibleColumns[column.key] && (
                    <th
                      key={column.key}
                      className="py-4 px-3 text-slate-300 font-semibold text-xs uppercase tracking-wider border-b border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        <button
                          onClick={() => toggleColumn(column.key)}
                          className="opacity-0 group-hover:opacity-100 hover:text-slate-200 transition-all"
                          title="Hide column"
                        >
                          <EyeOff size={12} />
                        </button>
                      </div>
                    </th>
                  )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700">
            {currentLogs.map((srv, index) => (
              <tr
                key={srv._id || srv.id}
                className={`
                  hover:bg-slate-800/50 transition-colors duration-200 group
                  ${index % 2 === 0 ? "bg-slate-900/20" : "bg-transparent"}
                `}
              >
                {columns.map(
                  (column) =>
                    visibleColumns[column.key] && (
                      <td key={column.key} className="py-4 px-3">
                        {renderCellContent(srv, column.key)}
                      </td>
                    )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-slate-400 text-sm">
          Page {currentPage} of {totalPages}
        </div>

        <div className="flex items-center space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex space-x-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() =>
                  typeof page === "number" && handlePageChange(page)
                }
                disabled={page === "..."}
                className={`
                  px-3 py-2 text-sm rounded transition-colors
                  ${
                    page === currentPage
                      ? "bg-blue-600 text-white"
                      : page === "..."
                      ? "text-slate-400 cursor-default"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }
                `}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Hidden Columns Indicator */}
      {Object.values(visibleColumns).filter((v) => !v).length > 0 && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <EyeOff size={16} />
            <span>
              {Object.values(visibleColumns).filter((v) => !v).length} columns
              hidden
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="text-blue-400 hover:text-blue-300 underline ml-2"
            >
              Show settings
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-white font-semibold">{detailModal.label}</h3>
              <button
                onClick={() =>
                  setDetailModal({ show: false, data: null, field: null })
                }
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-80">
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {detailModal.data}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleTable;
