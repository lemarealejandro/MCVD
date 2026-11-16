// Exporta a CSV que Excel abre directamente: BOM UTF-8 para tildes y ";" como separador
// (el usado por Excel en configuración en español).
export function downloadCsv(filename, headers, rows) {
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers, ...rows].map(row => row.map(escape).join(';'));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
