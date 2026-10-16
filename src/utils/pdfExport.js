
export function exportTimetableToPDF(elementId = 'timetable') {
  const timetable = document.getElementById(elementId);

  if (!timetable) {
    console.error(`Timetable element with ID "${elementId}" was not found.`);
    return;
  }

  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow pop-ups to export your timetable.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ClassOptima - Timetable</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #111827;
          }

          h1 {
            text-align: center;
            margin-bottom: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            border: 1px solid #9ca3af;
            padding: 10px;
            text-align: left;
          }

          th {
            background: #e5e7eb;
          }

          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <h1>ClassOptima Timetable</h1>
        ${timetable.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}