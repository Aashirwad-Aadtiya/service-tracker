import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const defaultResolver = (row, key) => {
    switch (key) {
      case "date":
        return new Date(row.date).toLocaleDateString("en-GB");
      case "parts":
        return row.parts?.map((p) => `${p.item} (${p.qty})`).join(", ");
      case "technician":
        return row.employee ||  "—";
      case "assistant":
        return row.assistant || "—";
      case "cashMode":
        return row.cashReceived || "—";
      case "cashReceived":
        return row.cashReceived || "—";
      case "paid_by":
        return row.paid_by || "—";
      default:
        return row[key] ?? "—";
    }
  };
  
export const formatForExport = (data, columns, customResolver = defaultResolver) => {
  return data.map((row) => {
    const formatted = {};
    columns.forEach(({ key, label }) => {
      let value;

      if (customResolver) {
        value = customResolver(row, key);
      } else {
        value = row[key];
      }

      formatted[label] = value ?? "—";
    });
    return formatted;
  });
};

export const exportToExcel = (data, columns, customResolver, filename = "Export") => {
  const formattedData = formatForExport(data, columns, customResolver);
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportToPDF = (data, columns, customResolver, filename = "Export") => {
  const doc = new jsPDF();
  const formattedData = formatForExport(data, columns, customResolver);

  const headers = [columns.map(col => col.label)];
  const body = formattedData.map(item => headers[0].map(label => item[label] ?? ""));

  autoTable(doc, {
    head: headers,
    body: body,
    startY: 20,
    styles: { fontSize: 8 },
  });

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const handlePrint = (data, columns, customResolver, title = "Report") => {
  const formattedData = formatForExport(data, columns, customResolver);

  const tableHeader = columns.map(col => `<th>${col.label}</th>`).join('');
  const tableRows = formattedData.map(row => {
    return `<tr>${columns.map(col => `<td>${row[col.label] ?? ''}</td>`).join('')}</tr>`;
  }).join('');

  const printWindow = window.open('', '_blank');
  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <table>
          <thead><tr>${tableHeader}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};
