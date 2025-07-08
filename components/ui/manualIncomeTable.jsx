"use client";
import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";

export default function IncomeTable({Income = [], onRefresh}) {
  let incomes = Income;
  const [filters, setFilters] = useState({
    technician: "",
    fromDate: "",
    toDate: "",
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // Function to handle deletion of an income entry
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
  
    try {
      const res = await fetch(`/api/manualIncome/${id}`, { method: "DELETE" });
      if (res.ok) {
        // optionally notify parent
        alert("Entry deleted successfully");
        onRefresh(); // Call the refresh function passed as prop


      } else {
        console.error("Failed to delete entry");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  const getFilteredIncomes = () => {
    return incomes.filter((entry) => {
      // Technician filter
      const matchTechnician = filters.technician
        ? entry.technician?.toLowerCase().includes(filters.technician.toLowerCase())
        : true;
  
      // Date filter
      const entryDate = new Date(entry.date);
      const from = filters.fromDate && !isNaN(new Date(filters.fromDate))
        ? new Date(filters.fromDate)
        : null;
      const to = filters.toDate && !isNaN(new Date(filters.toDate))
        ? new Date(filters.toDate)
        : null;
  
      // Normalize dates to ignore time part
      const normalize = (date) => new Date(date.toDateString());
  
      const matchDate =
        (!from || normalize(entryDate) >= normalize(from)) &&
        (!to || normalize(entryDate) <= normalize(to));
  
      return matchTechnician && matchDate;
    });
  };

  // Calculate pagination values
  const filteredIncomes = useMemo(() => getFilteredIncomes(), [incomes, filters]);
  const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredIncomes.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  return (
    <div className="bg-[#322c49] p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold text-white mb-4">
        Manual Income Entries
      </h2>

      <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
        <input
          type="text"
          placeholder="Filter by Technician"
          value={filters.technician}
          onChange={(e) =>
            setFilters({ ...filters, technician: e.target.value })
          }
          className="bg-[#1e1b2e] text-white border border-purple-700 p-2 rounded"
        />
        <label className="text-sm text-gray-400 mb-1 sm:block md:hidden">Date Range</label>
        <div className="sm:flex sm:flex-row md:gap-5">
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            className="bg-[#1e1b2e] text-white border mr-2 border-purple-700 p-2 rounded"
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            className="bg-[#1e1b2e] text-white border border-purple-700 p-2 rounded"
          />
        </div>
        <button
          onClick={() =>
            setFilters({ technician: "", fromDate: "", toDate: "" })
          }
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
        >
          Reset
        </button>
      </div>

      {/* Items per page selector */}
     {/* Header Controls */}
<div className="space-y-4">
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
    <div className="flex items-center gap-2">
      <span className="text-gray-400">Show:</span>
      <select
        value={itemsPerPage}
        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
        className="bg-[#1e1b2e] text-white border border-purple-700 p-1 rounded"
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
      <span className="text-gray-400">entries</span>
    </div>

    <div className="text-sm text-gray-400">
      Showing {startIndex + 1} to {Math.min(endIndex, filteredIncomes.length)} of {filteredIncomes.length} entries
    </div>
  </div>

  {/* Mobile View - Card Layout */}
  <div className="space-y-4 sm:hidden">
    {currentItems.length > 0 ? (
      currentItems.map((entry) => (
        <div
          key={entry._id}
          className="bg-[#2a243a] rounded-lg p-4 border relative border-purple-700 text-sm"
        >
          <div className="mb-2 flex justify-between text-purple-300 font-semibold">
            <span>{entry.technician}</span>
            <span className="text-green-400">₹{entry.amount}</span>
          </div>
          <div className="text-gray-300">{entry.description || "-"}</div>
          <div className="text-gray-400 mt-1 text-xs">
            {new Date(entry.date).toLocaleDateString("en-GB")}
          </div>
          <button
                  onClick={() => handleDelete(entry._id)}
                  className="text-red-400 hover:text-red-600 p-1 absolute bottom-2 right-2 rounded-full hover:bg-red-950 transition"
                  title="Delete">
                  <Trash2 size={16} />
                </button>
        </div>
      ))
    ) : (
      <div className="text-purple-300 py-4 text-center">
        No income entries found.
      </div>
    )}
  </div>

  {/* Desktop View - Table Layout */}
  <table className="w-full text-sm text-white hidden sm:table">
  <thead>
    <tr className="text-left border-b border-purple-800">
      <th className="py-2">Technician</th>
      <th>Description</th>
      <th>Amount</th>
      <th>Date</th>
      <th className="text-right pr-2">Action</th>
    </tr>
  </thead>
  <tbody>
    {currentItems.length > 0 ? (
      currentItems.map((entry) => (
        <tr
          key={entry._id}
          className="border-b border-purple-900 hover:bg-purple-950/30 group"
        >
          <td className="py-2">{entry.technician}</td>
          <td>{entry.description || "-"}</td>
          <td className="text-green-400 font-medium">₹{entry.amount}</td>
          <td>{new Date(entry.date).toLocaleDateString("en-GB")}</td>
          <td className="text-right pr-2">
            <button
              onClick={() => handleDelete(entry._id)}
              className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-950 transition"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="5" className="text-purple-300 py-4 text-center">
          No income entries found.
        </td>
      </tr>
    )}
  </tbody>
</table>

</div>


      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-[#1e1b2e] text-white border border-purple-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-900"
          >
            Previous
          </button>
          
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 border border-purple-700 rounded ${
                currentPage === page
                  ? 'bg-purple-700 text-white'
                  : 'bg-[#1e1b2e] text-white hover:bg-purple-900'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-[#1e1b2e] text-white border border-purple-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-900"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}