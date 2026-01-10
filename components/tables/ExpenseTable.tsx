'use client';

import { useMemo, useState } from 'react';
import { Expense } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Edit, Trash2, Search } from 'lucide-react';

interface ExpenseTableProps {
  expenses: Expense[];
  categories: string[];
  modes: string[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  isAdmin?: boolean;
}

export default function ExpenseTable({
  expenses,
  categories,
  modes,
  onEdit,
  onDelete,
  isAdmin = false,
}: ExpenseTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');
  const [sortOption, setSortOption] = useState<'latest' | 'oldest' | 'highest' | 'lowest' | 'name'>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const filteredAndSortedData = useMemo(() => {
    let result = [...expenses];

    if (searchTerm) {
      result = result.filter((item) =>
        item.item.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (selectedMode !== 'all') {
      result = result.filter((item) => item.mode === selectedMode);
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'latest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'highest':
          return Number(b.total_amount) - Number(a.total_amount);
        case 'lowest':
          return Number(a.total_amount) - Number(b.total_amount);
        case 'name':
          return a.item.localeCompare(b.item);
        default:
          return 0;
      }
    });

    return result;
  }, [expenses, searchTerm, selectedCategory, selectedMode, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedData.length / recordsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (value: number) => {
    setRecordsPerPage(value);
    setCurrentPage(1);
  };

  return (
    <div className="theme-card bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={selectedMode}
            onChange={(e) => {
              setSelectedMode(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Modes</option>
            {modes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
            <option value="name">Item (A-Z)</option>
          </select>
        </div>

        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by item..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full theme-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                S.No
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Item
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Piece/Packet
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Price per Piece
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Note
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
              {isAdmin && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 10 : 9}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No expenses found
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {(currentPage - 1) * recordsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.item}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.pieces}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatCurrency(item.price_per_piece)}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                    {formatCurrency(item.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {item.mode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.note || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDateTime(item.date, item.time_hour, item.time_minute)}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Show</label>
          <select
            value={recordsPerPage}
            onChange={(e) => handleRecordsPerPageChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {[5, 10, 15, 20, 25, 30].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <label className="text-sm text-gray-700">records</label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
