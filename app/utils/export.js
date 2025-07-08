import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const flattenTechnicianReport = (groupedData) => {
  return Object.values(groupedData).map((tech) => ({
    Technician: tech.name,
    Services: tech.summary.totalServices,
    Income: tech.summary.totalIncome,
    Credit: tech.summary.totalCredit,
    Expenses: tech.summary.totalExpenses,
    Locations: tech.summary.locations.join(', '),
    Tasks: tech.summary.serviceTypes.join(', '),
  }));
};


export const exportToCSV = (groupedData, dateRange = "") => {
  const flatData = flattenTechnicianReport(groupedData);
  const ws = XLSX.utils.json_to_sheet(flatData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const wbout = XLSX.write(wb, { bookType: 'csv', type: 'array' });
  saveAs(new Blob([wbout], { type: 'text/csv;charset=utf-8;' }), `TechnicianReport_${dateRange}.csv`);
};


export const exportToExcel = (groupedData, dateRange = "") => {
  const flatData = flattenTechnicianReport(groupedData);
  const ws = XLSX.utils.json_to_sheet(flatData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `TechnicianReport_${dateRange}.xlsx`);
};


export const exportToPDF = (groupedData, dateRange = "") => {
  const flatData = flattenTechnicianReport(groupedData);
  const doc = new jsPDF();
  doc.text(`Technician Report - ${dateRange}`, 10, 10);
  autoTable(doc, {
    startY: 20,
    head: [Object.keys(flatData[0])],
    body: flatData.map(obj => Object.values(obj)),
  });
  doc.save(`TechnicianReport_${dateRange}.pdf`);
};


export const printData = (groupedData, dateRange = "") => {
  const flatData = flattenTechnicianReport(groupedData);
  const newWindow = window.open('', '_blank');
  const tableRows = flatData.map(row => {
    return `<tr>${Object.values(row).map(val => `<td>${val}</td>`).join('')}</tr>`;
  }).join('');

  const html = `
    <html>
      <head>
        <title>Print Technician Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: white; color: black; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          th { background: #eee; }
        </style>
      </head>
      <body>
        <h2>Technician Report - ${dateRange}</h2>
        <table>
          <thead>
            <tr>${Object.keys(flatData[0]).map(col => `<th>${col}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  newWindow.document.write(html);
  newWindow.document.close();
  newWindow.print();
};

