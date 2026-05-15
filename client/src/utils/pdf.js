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
  const w = 210, h = 297, margin = 16;
  const labels = lang === 'fr'
    ? { invoice: 'FACTURE', billedTo: 'FACTURÉ À', payment: 'Paiement', currency: 'Devise', date: 'Date', due: 'Échéance', num: 'N°', desc: 'DESCRIPTION', unit: 'UNITÉ', qty: 'QTÉ', price: 'P.U.', total: 'TOTAL', subtotal: 'Total HT', tax: 'TVA', discount: 'Remise', grandTotal: 'TOTAL TTC', notes: 'Notes', footer: 'Merci de votre Confiance', sigClient: 'Signature client', sigCompany: 'Pour SOS DIGITAL' }
    : { invoice: 'INVOICE', billedTo: 'BILLED TO', payment: 'Payment', currency: 'Currency', date: 'Date', due: 'Due Date', num: 'N°', desc: 'DESCRIPTION', unit: 'UNIT', qty: 'QTY', price: 'PRICE', total: 'TOTAL', subtotal: 'Subtotal', tax: 'VAT', discount: 'Discount', grandTotal: 'GRAND TOTAL', notes: 'Notes', footer: 'Thank you for your business', sigClient: 'Client Signature', sigCompany: 'For SOS DIGITAL' };

  // 1. TOP HEADER BANNER (Solid color)
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, w, 45, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(255, 255, 255);
  doc.text('SOS DIGITAL', margin, 20);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255);
  doc.text(lang === 'fr' ? 'Facturation & Services Numériques' : 'Invoicing & Digital Services', margin, 26);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(255, 255, 255);
  doc.text(labels.invoice, w - margin, 20, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`N° ${inv.number}`, w - margin, 27, { align: 'right' });

  // 2. CLIENT & INVOICE DETAILS
  // Client box (Light background with colored left border)
  doc.setFillColor(248, 250, 252); // Very light gray
  doc.roundedRect(margin, 55, 100, 35, 3, 3, 'F');
  doc.setFillColor(...colors.primary);
  doc.rect(margin, 55, 3, 35, 'F'); // Left border

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...colors.primary);
  doc.text(labels.billedTo, margin + 8, 63);
  doc.setFontSize(11); doc.setTextColor(30, 41, 59); // Dark slate
  doc.text(inv.client?.name || '', margin + 8, 70);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
  if (inv.client?.company) doc.text(inv.client.company, margin + 8, 75);
  if (inv.client?.email) doc.text(inv.client.email, margin + 8, inv.client?.company ? 80 : 75);

  // Invoice details (Right side)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
  doc.text(`${labels.payment}:`, 125, 63);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105); doc.text('Virement', 145, 63); // Or dynamically from somewhere if available

  doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text(`${labels.currency}:`, 125, 70);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105); doc.text(inv.currency || 'FCFA', 145, 70);

  doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text(`${labels.date}:`, 125, 77);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105); doc.text(fmtDate(inv.issueDate, lang), 145, 77);
  
  if (inv.dueDate) {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(`${labels.due}:`, 125, 84);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105); doc.text(fmtDate(inv.dueDate, lang), 145, 84);
  }

  // 3. TABLE
  autoTable(doc, {
    startY: 100,
    margin: { left: margin, right: margin },
    head: [[labels.num, labels.desc, labels.unit, labels.qty, labels.price, labels.total]],
    body: inv.items?.map((i, idx) => [
      String(idx + 1),
      i.description,
      'Unité', // We'll hardcode unit since it's not in the DB, or just 'Unité'
      i.quantity,
      fmtCurrency(i.unitPrice, ''),
      { content: fmtCurrency(i.total, inv.currency), styles: { fontStyle: 'bold' } }
    ]) || [],
    headStyles: { fillColor: colors.primary, textColor: 255, fontStyle: 'bold', fontSize: 8, halign: 'left' },
    bodyStyles: { fontSize: 9, textColor: 30, 41, 59 },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 75 },
      2: { cellWidth: 20 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 33 }
    },
    didDrawPage: function (data) {
      // Optional: Add a subtle line below the table if needed
    }
  });

  // 4. TOTALS BOX
  const endY = doc.lastAutoTable.finalY + 10;
  
  // Outer gray box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(w - margin - 85, endY, 85, 38, 4, 4, 'F');

  // Subtotals inside gray box
  doc.setFontSize(9); doc.setTextColor(71, 85, 105);
  doc.text(labels.subtotal, w - margin - 80, endY + 8);
  doc.text(fmtCurrency(inv.subtotal, inv.currency), w - margin - 5, endY + 8, { align: 'right' });
  
  let currentY = endY + 15;
  if (inv.discount > 0) {
    doc.text(labels.discount, w - margin - 80, currentY);
    doc.text(`- ${fmtCurrency(inv.discount, inv.currency)}`, w - margin - 5, currentY, { align: 'right' });
    currentY += 7;
  }
  if (inv.taxRate > 0) {
    doc.text(`${labels.tax} (${inv.taxRate}%)`, w - margin - 80, currentY);
    doc.text(fmtCurrency(inv.taxAmount, inv.currency), w - margin - 5, currentY, { align: 'right' });
    currentY += 7;
  }

  // Inner purple TTC box
  doc.setFillColor(...colors.primary);
  doc.roundedRect(w - margin - 80, currentY - 3, 75, 12, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
  doc.text(labels.grandTotal, w - margin - 75, currentY + 4.5);
  doc.text(fmtCurrency(inv.total, inv.currency), w - margin - 10, currentY + 4.5, { align: 'right' });

  // 5. NOTES & FOOTER
  const noteY = Math.max(endY + 45, doc.lastAutoTable.finalY + 15);
  
  if (inv.notes) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...colors.primary);
    doc.text(labels.notes + ':', margin, noteY);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(71, 85, 105);
    doc.text(inv.notes, margin, noteY + 6, { maxWidth: 80 });
  }

  // Separator line
  const footerStartY = 245;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, footerStartY, w - margin, footerStartY);

  // Signatures
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(148, 163, 184);
  doc.text(labels.footer, margin, footerStartY + 10);

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerStartY + 30, margin + 40, footerStartY + 30);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(labels.sigClient, margin + 20, footerStartY + 35, { align: 'center' });

  doc.line(w - margin - 40, footerStartY + 30, w - margin, footerStartY + 30);
  doc.text(labels.sigCompany, w - margin - 20, footerStartY + 35, { align: 'center' });

  // Bottom text & QR
  doc.line(margin, 270, w - margin, 270);
  doc.setFontSize(7); doc.setTextColor(148, 163, 184);
  doc.text(`SOS DIGITAL · +237 653 522 435 · contact@sosdigital.cm`, margin, 278);

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', w - margin - 16, 272, 16, 16);
    doc.setFontSize(6); doc.setTextColor(148, 163, 184);
    doc.text('Contact', w - margin - 8, 291, { align: 'center' });
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
