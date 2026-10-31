import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportConfig {
  title: string;
  subtitle?: string;
  columns: { header: string; key: string; width?: number }[];
  data: Record<string, any>[];
  kpis?: { label: string; value: string | number }[];
  orientation?: 'portrait' | 'landscape';
}

const formatValue = (v: any): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  return String(v);
};

const now = () => {
  const d = new Date();
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export function exportPDF(config: ReportConfig) {
  const doc = new jsPDF({ orientation: config.orientation || 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(config.title, pageW / 2, 20, { align: 'center' });

  if (config.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(config.subtitle, pageW / 2, 28, { align: 'center' });
  }

  let startY = config.subtitle ? 34 : 28;

  // KPIs
  if (config.kpis?.length) {
    doc.setFontSize(9);
    const kpiPerRow = 4;
    const kpiW = (pageW - 28) / kpiPerRow;
    config.kpis.forEach((kpi, i) => {
      const col = i % kpiPerRow;
      const row = Math.floor(i / kpiPerRow);
      const x = 14 + col * kpiW;
      const y = startY + row * 14;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(kpi.label, x, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text(String(kpi.value), x, y + 5);
    });
    startY += Math.ceil(config.kpis.length / kpiPerRow) * 14 + 4;
  }

  // Table
  autoTable(doc, {
    startY,
    head: [config.columns.map(c => c.header)],
    body: config.data.map(row => config.columns.map(c => formatValue(row[c.key]))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [34, 89, 58], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 14 },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(7);
      doc.setTextColor(150);
      const h = doc.internal.pageSize.getHeight();
      doc.text(`Gerado em ${now()}`, 14, h - 8);
      doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, pageW - 14, h - 8, { align: 'right' });
    },
  });

  doc.save(`${config.title.replace(/\s+/g, '_')}.pdf`);
}

export function exportExcel(config: ReportConfig) {
  const wb = XLSX.utils.book_new();

  // KPIs sheet if any
  if (config.kpis?.length) {
    const kpiData = config.kpis.map(k => ({ Indicador: k.label, Valor: k.value }));
    const wsKpi = XLSX.utils.json_to_sheet(kpiData);
    wsKpi['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsKpi, 'Resumo');
  }

  // Data sheet
  const sheetData = config.data.map(row => {
    const obj: Record<string, any> = {};
    config.columns.forEach(c => { obj[c.header] = row[c.key] ?? ''; });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(sheetData);
  ws['!cols'] = config.columns.map(c => ({ wch: c.width || 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');

  XLSX.writeFile(wb, `${config.title.replace(/\s+/g, '_')}.xlsx`);
}

export function exportHTML(config: ReportConfig) {
  const kpiHtml = config.kpis?.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:24px">${config.kpis.map(k =>
      `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 20px;min-width:160px">
        <div style="font-size:12px;color:#666">${k.label}</div>
        <div style="font-size:20px;font-weight:700;color:#166534">${k.value}</div>
      </div>`).join('')}</div>` : '';

  const tableRows = config.data.map(row =>
    `<tr>${config.columns.map(c => `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${formatValue(row[c.key])}</td>`).join('')}</tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${config.title}</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:1100px;margin:0 auto;padding:24px;background:#fff;color:#1a1a1a}
h1{font-size:24px;color:#166534;margin-bottom:4px}
.sub{color:#666;font-size:13px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#22593a;color:#fff;padding:10px 12px;text-align:left;font-weight:600}
tr:nth-child(even){background:#f9fafb}
tr:hover{background:#f0fdf4}
.footer{margin-top:24px;font-size:11px;color:#999;text-align:center}
@media print{body{padding:0}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<h1>${config.title}</h1>
${config.subtitle ? `<div class="sub">${config.subtitle}</div>` : ''}
${kpiHtml}
<table><thead><tr>${config.columns.map(c => `<th>${c.header}</th>`).join('')}</tr></thead>
<tbody>${tableRows}</tbody></table>
<div class="footer">Relatório gerado em ${now()}</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.title.replace(/\s+/g, '_')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
