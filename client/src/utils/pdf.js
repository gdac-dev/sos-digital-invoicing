import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

// RGB equivalents of every palette in editorConstants.js
const PALETTES_RGB = {
  skyblue:  { primary: [14, 165, 233],  dark: [3, 105, 161] },
  violet:   { primary: [124, 58, 237],  dark: [91, 33, 182] },
  emerald:  { primary: [5, 150, 105],   dark: [4, 120, 87] },
  orange:   { primary: [234, 88, 12],   dark: [194, 65, 12] },
  rose:     { primary: [225, 29, 72],   dark: [190, 18, 60] },
  brown:    { primary: [120, 53, 15],   dark: [69, 26, 3] },
  slate:    { primary: [51, 65, 85],    dark: [15, 23, 42] },
  gold:     { primary: [180, 83, 9],    dark: [146, 64, 14] },
};

const fmtCurrency = (v, currency = 'FCFA') => `${Number(v || 0).toLocaleString('fr-FR')} ${currency}`;
const fmtDate = (d, lang) => d ? new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '—';

export const exportInvoicePDF = async (invoice, lang = 'fr') => {
  let qrDataUrl = '';
  try { qrDataUrl = await QRCode.toDataURL('https://wa.me/237653522435', { width: 100, margin: 1 }); } catch (e) {}

  // Use the palette chosen in the design, fallback to skyblue
  const paletteKey = invoice.palette || 'skyblue';
  const palette = PALETTES_RGB[paletteKey] || PALETTES_RGB.skyblue;
  const colors = { primary: palette.primary, dark: palette.dark, text: [0, 0, 0] };

  if (invoice.templateType === 'elegant') return elegantPDF(invoice, lang, qrDataUrl, colors);
  if (invoice.templateType === 'minimalist') return minimalistPDF(invoice, lang, qrDataUrl, colors);
  if (invoice.templateType === 'modern') return modernPDF(invoice, lang, qrDataUrl, colors);
  return classicPDF(invoice, lang, qrDataUrl, colors);
};


function classicPDF(inv, lang, qrDataUrl, colors) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = 210, margin = 20;
  const labels = lang === 'fr'
    ? { invoice: 'FACTURE', client: 'Client', date: 'Date', due: 'Échéance', num: 'Numéro', desc: 'Description', qty: 'Qté', price: 'Prix unit.', total: 'Total', subtotal: 'Sous-total', tax: 'TVA', discount: 'Remise', grandTotal: 'TOTAL TTC', notes: 'Notes', footer: 'Signature', legal: 'Merci pour votre confiance — SOS DIGITAL' }
    : { invoice: 'INVOICE', client: 'Client', date: 'Date', due: 'Due Date', num: 'Number', desc: 'Description', qty: 'Qty', price: 'Unit Price', total: 'Total', subtotal: 'Subtotal', tax: 'VAT', discount: 'Discount', grandTotal: 'GRAND TOTAL', notes: 'Notes', footer: 'Signature', legal: 'Thank you for your business — SOS DIGITAL' };

  // Header bar
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, w, 40, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('SOS DIGITAL', margin, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(lang === 'fr' ? 'Facturation & Gestion Commerciale' : 'Invoicing & Business Management', margin, 23);
  doc.text('Tél: +237 653 522 435', margin, 30);
  doc.text('contact@sosdigital.cm', margin, 36);

  // Invoice title (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text(labels.invoice, w - margin, 18, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${labels.num}: ${inv.number}`, w - margin, 26, { align: 'right' });
  doc.text(`${labels.date}: ${fmtDate(inv.issueDate, lang)}`, w - margin, 32, { align: 'right' });
  if (inv.dueDate) doc.text(`${labels.due}: ${fmtDate(inv.dueDate, lang)}`, w - margin, 38, { align: 'right' });

  // Client box
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(margin, 48, 80, 28, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(labels.client.toUpperCase(), margin + 4, 55);
  doc.setTextColor(...colors.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(inv.client?.name || '', margin + 4, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (inv.client?.company) doc.text(inv.client.company, margin + 4, 68);
  if (inv.client?.email) doc.text(inv.client.email, margin + 4, 72);

  // Items table
  autoTable(doc, {
    startY: 84,
    margin: { left: margin, right: margin },
    head: [[labels.desc, labels.qty, labels.price, labels.total]],
    body: inv.items?.map(i => [i.description, i.quantity, fmtCurrency(i.unitPrice, inv.currency), fmtCurrency(i.total, inv.currency)]) || [],
    headStyles: { fillColor: colors.primary, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: colors.text },
    alternateRowStyles: { fillColor: [240, 249, 255] },
    columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center', cellWidth: 20 }, 2: { halign: 'right', cellWidth: 40 }, 3: { halign: 'right', cellWidth: 40, fontStyle: 'bold' } },
  });

  // Totals
  const y = doc.lastAutoTable.finalY + 8;
  const totals = [
    [labels.subtotal, fmtCurrency(inv.subtotal, inv.currency)],
    inv.discount > 0 && [`${labels.discount}`, `- ${fmtCurrency(inv.discount, inv.currency)}`],
    inv.taxRate > 0 && [`${labels.tax} (${inv.taxRate}%)`, fmtCurrency(inv.taxAmount, inv.currency)],
  ].filter(Boolean);

  totals.forEach(([l, v], i) => {
    doc.setFontSize(9); doc.setTextColor(...colors.text);
    doc.text(l, w - margin - 50, y + i * 6);
    doc.text(v, w - margin, y + i * 6, { align: 'right' });
  });

  const totalY = y + totals.length * 6 + 4;
  doc.setFillColor(...colors.primary);
  doc.roundedRect(w - margin - 70, totalY - 6, 70 + margin - 20, 10, 2, 2, 'F');
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text(labels.grandTotal, w - margin - 68, totalY + 0.5);
  doc.text(fmtCurrency(inv.total, inv.currency), w - margin, totalY + 0.5, { align: 'right' });

  // Signature area
  const sigY = totalY + 24;
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.3);
  doc.line(margin, sigY + 15, margin + 60, sigY + 15);
  doc.setFontSize(8); doc.setTextColor(...colors.text); doc.setFont('helvetica', 'normal');
  doc.text(labels.footer, margin, sigY + 20);

  // Notes
  if (inv.notes) {
    doc.setFontSize(8); doc.setTextColor(...colors.text);
    doc.setFont('helvetica', 'bold'); doc.text(labels.notes + ':', margin, sigY + 30);
    doc.setFont('helvetica', 'normal'); doc.text(inv.notes, margin, sigY + 36, { maxWidth: w - margin * 2 });
  }

  // Footer
  doc.setFillColor(...colors.dark);
  doc.rect(0, 287, w, 10, 'F');
  doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal');
  doc.text(labels.legal, w / 2, 293, { align: 'center' });

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', margin, 268, 16, 16);
    doc.setFontSize(6); doc.setTextColor(0, 0, 0);
    doc.text('Contact', margin + 8, 286, { align: 'center' });
  }

  doc.save(`${inv.number}.pdf`);
};

function modernPDF(inv, lang, qrDataUrl, colors) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = 210, margin = 16;
  const labels = lang === 'fr'
    ? { invoice: 'FACTURE', desc: 'Prestation', qty: 'Qté', price: 'Prix', total: 'Total', grandTotal: 'TOTAL TTC', due: 'Échéance', subtotal: 'Sous-total', tax: 'TVA' }
    : { invoice: 'INVOICE', desc: 'Service', qty: 'Qty', price: 'Price', total: 'Total', grandTotal: 'GRAND TOTAL', due: 'Due Date', subtotal: 'Subtotal', tax: 'VAT' };

  // Colored left stripe
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 8, 297, 'F');

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(8, 0, w - 8, 50, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(255, 255, 255);
  doc.text('SOS DIGITAL', 20, 20);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
  doc.text(lang === 'fr' ? 'Facturation & Gestion Commerciale' : 'Invoicing & Business Management', 20, 28);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...colors.primary);
  doc.text(labels.invoice, w - margin, 18, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
  doc.text(`#${inv.number}`, w - margin, 26, { align: 'right' });
  doc.text(fmtDate(inv.issueDate, lang), w - margin, 32, { align: 'right' });
  if (inv.dueDate) doc.text(`${labels.due}: ${fmtDate(inv.dueDate, lang)}`, w - margin, 38, { align: 'right' });

  // Two columns below header
  doc.setTextColor(...colors.text);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...colors.primary);
  doc.text('DE:', 20, 62);
  doc.setFontSize(10); doc.setTextColor(...colors.text); doc.setFont('helvetica', 'bold');
  doc.text('SOS DIGITAL', 20, 69);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  doc.text('+237 653 522 435', 20, 75);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...colors.primary);
  doc.text(lang === 'fr' ? 'POUR:' : 'TO:', 115, 62);
  doc.setFontSize(10); doc.setTextColor(...colors.text); doc.setFont('helvetica', 'bold');
  doc.text(inv.client?.name || '', 115, 69);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  if (inv.client?.company) doc.text(inv.client.company, 115, 75);
  if (inv.client?.email) doc.text(inv.client.email, 115, inv.client?.company ? 81 : 75);

  // Table
  autoTable(doc, {
    startY: 92,
    margin: { left: 20, right: margin },
    head: [[labels.desc, labels.qty, labels.price, labels.total]],
    body: inv.items?.map(i => [i.description, i.quantity, fmtCurrency(i.unitPrice, inv.currency), fmtCurrency(i.total, inv.currency)]) || [],
    headStyles: { fillColor: colors.dark, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 85 }, 1: { halign: 'center', cellWidth: 18 }, 2: { halign: 'right', cellWidth: 38 }, 3: { halign: 'right', cellWidth: 38, fontStyle: 'bold', textColor: colors.primary } },
  });

  // Total box
  const endY = doc.lastAutoTable.finalY + 6;
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(w - margin - 70, endY, 70 + margin - 16, 30, 3, 3, 'F');
  doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  doc.text(labels.subtotal, w - margin - 68, endY + 7);
  doc.text(fmtCurrency(inv.subtotal, inv.currency), w - margin - 2, endY + 7, { align: 'right' });
  if (inv.taxRate > 0) {
    doc.text(`${labels.tax} ${inv.taxRate}%`, w - margin - 68, endY + 14);
    doc.text(fmtCurrency(inv.taxAmount, inv.currency), w - margin - 2, endY + 14, { align: 'right' });
  }
  doc.setFillColor(...colors.primary);
  doc.roundedRect(w - margin - 70, endY + 20, 70 + margin - 16, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
  doc.text(labels.grandTotal, w - margin - 68, endY + 27);
  doc.text(fmtCurrency(inv.total, inv.currency), w - margin - 2, endY + 27, { align: 'right' });

  // Footer stripe
  doc.setFillColor(...colors.primary);
  doc.rect(0, 285, w, 12, 'F');
  doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal');
  doc.text('SOS DIGITAL  ·  +237 653 522 435  ·  contact@sosdigital.cm', w / 2, 292, { align: 'center' });

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', w - margin - 16, 266, 16, 16);
    doc.setFontSize(6); doc.setTextColor(100, 116, 139);
    doc.text('Contact', w - margin - 8, 284, { align: 'center' });
  }

  doc.save(`${inv.number}.pdf`);
};

function elegantPDF(inv, lang, qrDataUrl, colors) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = 210, margin = 20;
  const labels = lang === 'fr'
    ? { invoice: 'FACTURE', client: 'Client', date: 'Date', due: 'Échéance', num: 'Numéro', desc: 'Description', qty: 'Qté', price: 'Prix unit.', total: 'Total', subtotal: 'Sous-total', tax: 'TVA', discount: 'Remise', grandTotal: 'TOTAL TTC', notes: 'Notes', footer: 'Signature', legal: 'Merci pour votre confiance — SOS DIGITAL' }
    : { invoice: 'INVOICE', client: 'Client', date: 'Date', due: 'Due Date', num: 'Number', desc: 'Description', qty: 'Qty', price: 'Unit Price', total: 'Total', subtotal: 'Subtotal', tax: 'VAT', discount: 'Discount', grandTotal: 'GRAND TOTAL', notes: 'Notes', footer: 'Signature', legal: 'Thank you for your business — SOS DIGITAL' };

  doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(...colors.primary);
  doc.text('SOS DIGITAL', margin, 24);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
  doc.text(lang === 'fr' ? 'Facturation & Gestion Commerciale' : 'Invoicing & Business Management', margin, 30);
  doc.text('Tél: +237 653 522 435  ·  contact@sosdigital.cm', margin, 35);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...colors.text);
  doc.text(labels.invoice, w - margin, 24, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...colors.text);
  doc.text(`${labels.num}: ${inv.number}`, w - margin, 30, { align: 'right' });
  doc.text(`${labels.date}: ${fmtDate(inv.issueDate, lang)}`, w - margin, 35, { align: 'right' });
  if (inv.dueDate) doc.text(`${labels.due}: ${fmtDate(inv.dueDate, lang)}`, w - margin, 40, { align: 'right' });

  doc.setDrawColor(...colors.primary); doc.setLineWidth(1);
  doc.line(margin, 46, w - margin, 46);

  doc.setFontSize(8); doc.setTextColor(...colors.primary); doc.setFont('helvetica', 'bold');
  doc.text(lang === 'fr' ? 'FACTURÉ À' : 'BILLED TO', margin, 56);
  doc.setFontSize(11); doc.setTextColor(...colors.text); doc.text(inv.client?.name || '', margin, 62);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  if (inv.client?.company) doc.text(inv.client.company, margin, 68);
  if (inv.client?.email) doc.text(inv.client.email, margin, 73);

  autoTable(doc, {
    startY: 86, margin: { left: margin, right: margin },
    head: [[labels.desc, labels.qty, labels.price, labels.total]],
    body: inv.items?.map(i => [i.description, i.quantity, fmtCurrency(i.unitPrice, inv.currency), fmtCurrency(i.total, inv.currency)]) || [],
    headStyles: { fillColor: [248, 250, 252], textColor: colors.text, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: 0 },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center', cellWidth: 20 }, 2: { halign: 'right', cellWidth: 40 }, 3: { halign: 'right', cellWidth: 40, fontStyle: 'bold' } },
  });

  const y = doc.lastAutoTable.finalY + 8;
  const totals = [
    [labels.subtotal, fmtCurrency(inv.subtotal, inv.currency)],
    inv.discount > 0 && [`${labels.discount}`, `- ${fmtCurrency(inv.discount, inv.currency)}`],
    inv.taxRate > 0 && [`${labels.tax} (${inv.taxRate}%)`, fmtCurrency(inv.taxAmount, inv.currency)],
  ].filter(Boolean);

  totals.forEach(([l, v], i) => {
    doc.setFontSize(9); doc.setTextColor(...colors.text);
    doc.text(l, w - margin - 50, y + i * 6);
    doc.text(v, w - margin, y + i * 6, { align: 'right' });
  });

  const totalY = y + totals.length * 6 + 4;
  doc.setFillColor(...colors.primary);
  doc.roundedRect(w - margin - 70, totalY - 6, 70 + margin - 20, 10, 2, 2, 'F');
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text(labels.grandTotal, w - margin - 68, totalY + 0.5);
  doc.text(fmtCurrency(inv.total, inv.currency), w - margin, totalY + 0.5, { align: 'right' });

  if (inv.notes) {
    doc.setFontSize(8); doc.setTextColor(...colors.text);
    doc.setFont('helvetica', 'bold'); doc.text(labels.notes + ':', margin, totalY + 16);
    doc.setFont('helvetica', 'normal'); doc.text(inv.notes, margin, totalY + 22, { maxWidth: w - margin * 2 });
  }

  doc.setFillColor(248, 250, 252); doc.rect(0, 287, w, 10, 'F');
  doc.setFontSize(7); doc.setTextColor(100, 116, 139);
  doc.text(labels.legal, w / 2, 293, { align: 'center' });

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', margin, 268, 16, 16);
    doc.setFontSize(6); doc.setTextColor(0, 0, 0);
    doc.text('Contact', margin + 8, 286, { align: 'center' });
  }

  doc.save(`${inv.number}.pdf`);
}

function minimalistPDF(inv, lang, qrDataUrl, colors) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = 210, margin = 20;
  const labels = lang === 'fr'
    ? { invoice: 'FACTURE', client: 'Client', date: 'Date', due: 'Échéance', num: 'Numéro', desc: 'Description', qty: 'Qté', price: 'Prix unit.', total: 'Total', subtotal: 'Sous-total', tax: 'TVA', discount: 'Remise', grandTotal: 'TOTAL TTC', notes: 'Notes', legal: 'Merci pour votre confiance — SOS DIGITAL' }
    : { invoice: 'INVOICE', client: 'Client', date: 'Date', due: 'Due Date', num: 'Number', desc: 'Description', qty: 'Qty', price: 'Unit Price', total: 'Total', subtotal: 'Subtotal', tax: 'VAT', discount: 'Discount', grandTotal: 'GRAND TOTAL', notes: 'Notes', legal: 'Thank you for your business — SOS DIGITAL' };

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(0, 0, 0);
  doc.text('SOS DIGITAL', margin, 24);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
  doc.text('contact@sosdigital.cm', margin, 30);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text(labels.invoice, w - margin, 24, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`${labels.num}: ${inv.number}`, w - margin, 30, { align: 'right' });
  doc.text(`${labels.date}: ${fmtDate(inv.issueDate, lang)}`, w - margin, 35, { align: 'right' });

  doc.setFont('helvetica', 'bold'); doc.text(lang === 'fr' ? 'À:' : 'TO:', margin, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(inv.client?.name || '', margin, 56);
  if (inv.client?.company) doc.text(inv.client.company, margin, 61);

  autoTable(doc, {
    startY: 70, margin: { left: margin, right: margin },
    head: [[labels.desc, labels.qty, labels.price, labels.total]],
    body: inv.items?.map(i => [i.description, i.quantity, fmtCurrency(i.unitPrice, inv.currency), fmtCurrency(i.total, inv.currency)]) || [],
    theme: 'plain',
    headStyles: { textColor: 0, fontStyle: 'bold', fontSize: 9, lineWidth: { bottom: 0.5 }, lineColor: 0 },
    bodyStyles: { fontSize: 9, textColor: 0 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center', cellWidth: 20 }, 2: { halign: 'right', cellWidth: 40 }, 3: { halign: 'right', cellWidth: 40, fontStyle: 'bold' } },
  });

  const y = doc.lastAutoTable.finalY + 8;
  const totals = [
    [labels.subtotal, fmtCurrency(inv.subtotal, inv.currency)],
    inv.discount > 0 && [`${labels.discount}`, `- ${fmtCurrency(inv.discount, inv.currency)}`],
    inv.taxRate > 0 && [`${labels.tax} (${inv.taxRate}%)`, fmtCurrency(inv.taxAmount, inv.currency)],
  ].filter(Boolean);

  totals.forEach(([l, v], i) => {
    doc.setFontSize(9); doc.text(l, w - margin - 50, y + i * 6);
    doc.text(v, w - margin, y + i * 6, { align: 'right' });
  });

  const totalY = y + totals.length * 6 + 4;
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(labels.grandTotal, w - margin - 50, totalY);
  doc.text(fmtCurrency(inv.total, inv.currency), w - margin, totalY, { align: 'right' });

  if (inv.notes) {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(inv.notes, margin, totalY + 16, { maxWidth: w - margin * 2 });
  }

  doc.setFontSize(7); doc.text(labels.legal, w / 2, 290, { align: 'center' });

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', margin, 270, 16, 16);
    doc.setFontSize(6); doc.setTextColor(0, 0, 0);
    doc.text('Contact', margin + 8, 288, { align: 'center' });
  }

  doc.save(`${inv.number}.pdf`);
}
