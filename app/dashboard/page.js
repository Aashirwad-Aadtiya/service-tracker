"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SalesChart from "../components/SalesChart";
import Image from "next/image";
import {
  X,
  Home,
  List,
  FileText,
  Archive,
  Bell,
  Menu,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [todaysCredit, setTodaysCredit] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) router.push("/login");

    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        setServices(data);

        const today = new Date().toISOString().split("T")[0];
        const filtered = data.filter((s) => s.date?.startsWith(today));

        const totalCredit = filtered.reduce(
          (sum, s) => sum + (s.credit || 0),
          0
        );
        setTodaysCredit(totalCredit);
      });
  }, [router]);

  const today = new Date().toISOString().split("T")[0];
  const todaysServices = services.filter((srv) => srv.date?.startsWith(today));

  const totalPartsUsed = todaysServices.reduce(
    (sum, srv) =>
      sum + srv.parts.reduce((pSum, p) => pSum + parseInt(p.qty || 0), 0),
    0
  );

  return (
    <div className="flex min-h-screen bg-[#1e1b2e] text-white relative">
      {/* Sidebar */}
      <div
        className={`${
          isMenuOpen ? "block" : "hidden"
        } md:block bg-[#2c273f] shadow-md w-full md:w-64 fixed md:relative z-10`}
      >
        <div className="p-4 border-b border-purple-800">
          <div className="flex items-center">
            <Link href={"/"}>
              <span className="font-bold text-xl text-purple-400">CSR</span>
              <span className="bg-purple-600 text-white px-2 py-1 rounded ml-2 text-sm">
                REPAIRS
              </span>
            </Link>
           
          </div>
        </div>

        <nav className="p-4">
          <div className="mb-6">
            <p className="text-xs text-purple-300 mb-2">MAIN</p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center text-purple-100 hover:bg-purple-900 p-2 rounded"
                >
                  <Home size={18} className="mr-2" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/servicing"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center text-purple-100 hover:bg-purple-900 p-2 rounded"
                >
                  <List size={18} className="mr-2" />
                  <span>Service Logs</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/inventory"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center text-purple-100 hover:bg-purple-900 p-2 rounded"
                >
                  <Archive size={18} className="mr-2" />
                  <span>Inventory</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/expenses"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center text-purple-100 hover:bg-purple-900 p-2 rounded"
                >
                  <FileText size={18} className="mr-2" />
                  <span>Expenses</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/logs"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center text-purple-100 hover:bg-purple-900 p-2 rounded"
                >
                  <FileText size={18} className="mr-2" />
                  <span>Logs</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/reports"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center text-purple-100 hover:bg-purple-900 p-2 rounded"
                >
                  <FileText size={18} className="mr-2" />
                  <span>Reports</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="md:hidden flex items-center text-purple-100 hover:bg-purple-900 p-2 rounded"
                >
                  <X size={18} className="mr-2" />
                  <span>Close</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Main Content */}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#2c273f] shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-purple-300 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1 flex justify-end items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/winnie_.jpg"
                    alt="User"
                    style={{ objectFit: "cover" }}
                    width={32}
                    height={32}
                  />
                </div>
                <div className="ml-2 hidden md:block">
                  <div className="text-sm font-medium text-purple-100">
                    Admin
                  </div>
                  <div className="text-xs text-purple-400">Daily Operator</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <StatCard
              title="Total Services Today"
              value={todaysServices.length}
              href="/servicing"
            />
            <StatCard
              title="Parts Used Today"
              value={totalPartsUsed}
              href="/inventory"
            />
            <StatCard
              title="Credit Given Today"
              value={`₹${todaysCredit}`}
              href="/expenses"
            />
          </div>

          {/* Service log & Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#322c49] p-4 rounded-lg shadow max-h-[300px] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Today’s Services</h2>
              {todaysServices.map((srv) => (
                <div
                  key={srv._id}
                  className="flex justify-between py-2 border-b border-purple-800 text-sm"
                >
                  <div>
                    <p className="font-medium text-purple-100">
                      {srv.customer}
                    </p>
                    <p className="text-purple-400">
                      {srv.task} by {srv.employee}
                    </p>
                    <p className="text-purple-500 text-xs">
                      Parts:{" "}
                      {srv.parts.map((p) => `${p.item} (${p.qty})`).join(", ")}
                    </p>
                  </div>
                  <div className="text-purple-400 text-xs">
                    {new Date(srv.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="bg-[#322c49] p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
              <ProgressBar label="Inventory Health" value={70} color="purple" />
              <ProgressBar label="Expense Load" value={40} color="red" />
              <ProgressBar
                label="Daily Entry Completion"
                value={90}
                color="purple"
              />
            </div>

            <div>
              <SalesChart />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, href }) {
  return (
    <div className="bg-[#322c49] p-4 rounded-lg shadow flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold text-purple-300">{value}</h2>
        <p className="text-purple-200 text-sm">{title}</p>
      </div>
      {href && (
        <Link href={href}>
          <ArrowRight className="w-5 h-5 text-purple-400 hover:text-purple-200" />
        </Link>
      )}
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  const colorClasses = {
    purple: "bg-purple-500",
    red: "bg-red-600",
  };
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-purple-200">{label}</span>
        <span className="text-purple-300">{value}%</span>
      </div>
      <div className="w-full bg-purple-950 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
