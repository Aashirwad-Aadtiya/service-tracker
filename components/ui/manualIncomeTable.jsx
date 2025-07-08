"use client";
import { useState, useMemo } from "react";
import { useEffect } from "react";

export default function IncomeTable({Income = []}) {
  let incomes = Income;
  const [filters, setFilters] = useState({
    technician: "",
    fromDate: "",
    toDate: "",
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-sm">
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

      <table className="w-full text-sm text-white">
        <thead>
          <tr className="text-left border-b border-purple-800">
            <th className="py-2">Technician</th>
            <th>Description</th>
            <th>Amount (₹)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((entry) => (
              <tr
                key={entry._id}
                className="border-b border-purple-900 hover:bg-purple-950/30"
              >
                <td className="py-2">{entry.technician}</td>
                <td>{entry.description || "-"}</td>
                <td className="text-green-400 font-medium">₹{entry.amount}</td>
                <td>{new Date(entry.date).toLocaleDateString("en-GB")}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-purple-300 py-4 text-center">
                No income entries found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

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