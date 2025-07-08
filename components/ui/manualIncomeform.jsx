// components/ManualIncomeForm.jsx
import { useState } from 'react';
import axios from 'axios';

export default function ManualIncomeForm({ onIncomeAdded }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ technician: '', amount: '', description: '', date:today  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/api/manualIncome', form);
    setForm({ technician: '', amount: '', description: '', date: new Date().toISOString().split("T")[0] }); // Reset form after submission
    if (onIncomeAdded) onIncomeAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#322c49] p-4 rounded-xl shadow mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
  <input
    name="technician"
    value={form.technician}
    placeholder="Technician"
    onChange={handleChange}
    required
    className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
  />
  <input
    name="amount"
    value={form.amount}
    type="number"
    placeholder="Amount"
    onChange={handleChange}
    required
    className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
  />
  <input
    name="description"
    value={form.description}
    placeholder="Description (optional)"
    onChange={handleChange}
    className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
  />
  <input
    name="date"
    value={form.date}
    type="date"
    onChange={handleChange}
    className="bg-[#1e1b2e] p-2 rounded text-white border border-purple-700"
  />
  <button
    type="submit"
    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded col-span-full md:col-auto"
  >
    Add Income
  </button>
</form>

  );
}
