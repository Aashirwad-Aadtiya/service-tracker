'use client';

import { Bar } from 'react-chartjs-2'; // Import Bar chart component
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register components from Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SalesChart = () => {
  // Demo sales data for the past week
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales (₹)',
        data: [5000, 7000, 6000, 8000, 5500, 9000, 7500], // Replace with your actual data later
        backgroundColor: '#DBF4A7',
        borderColor: '#4D243D',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Sales Overview - This Week',
        font: {
          size: 18,
        },
        color: '#DBF4A7',
      },
      tooltip: {
        backgroundColor: '#1E1E2F',
        titleColor: '#DBF4A7',
        bodyColor: '#FFFFFF',
      },
    },
    scales: {
      x: {
        grid: {
          color: '#4D243D',
        },
        ticks: {
          color: '#DBF4A7',
        },
      },
      y: {
        grid: {
          color: '#4D243D',
        },
        ticks: {
          color: '#DBF4A7',
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default SalesChart;
