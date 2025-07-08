"use client";
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#4D243D] to-[#1E1E2F] text-white font-sans">
      {/* Header */}
      <header className="flex justify-between items-center px-10 py-6 bg-opacity-20 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-[#DBF4A7]">CSR Services</h1>
        <a href="/login" className="bg-[#DBF4A7] text-[#4D243D] px-4 py-2 rounded-xl font-semibold">
          Login
        </a>
      </header>

      {/* Hero Section */}
      <section className="text-center px-6 py-20">
        <h2 className="text-5xl md:text-6xl font-bold mb-4 text-[#DBF4A7]">Your Reliable Repair Experts</h2>
        <p className="text-md md:text-lg text-gray-300 max-w-xl mx-auto">
          CSR refrigeration and ac repair and RO filter House, Sharda hospital, Sanawad Rd, Khargone, Madhya Pradesh 451001
        </p>
        <p className="text-xl mt-4 italic text-gray-200">
          &quot;AC, RO, and Repairs—Trusted by Khargone.&quot;
        </p>
        {/* <a
          href="/dashboard"
          className="mt-10 inline-block bg-[#DBF4A7] text-[#4D243D] px-8 py-4 text-xl rounded-full font-semibold shadow-lg hover:scale-105 transition-transform"
        >
          Go to Dashboard
        </a> */}
        <button
        onClick={() => localStorage.getItem("user")?window.location.href = "/dashboard": window.location.href = "/login"}
        className="mt-10 inline-block bg-[#DBF4A7] text-[#4D243D] px-8 py-4 text-xl rounded-full font-semibold shadow-lg hover:scale-105 transition-transform"
        >
          Go to DashBoard
        </button>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-10 py-16">
        <FeatureCard
          title="Sales & Services"
          description="Log daily sales, track repairs, and manage service details for your customers."
        />
        <FeatureCard
          title="Inventory"
          description="Add, update, and monitor stock levels with a powerful inventory tracker."
        />
        <FeatureCard
          title="Finance Logs"
          description="Manage daily income, credits, and expenses with detailed tracking."
        />
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} CSR Services. All rights reserved.
      </footer>
    </main>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="bg-white/10 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-white/20">
      <h3 className="text-2xl font-bold text-[#DBF4A7] mb-3">{title}</h3>
      <p className="text-gray-200">{description}</p>
    </div>
  );
}
