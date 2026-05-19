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

  const paletteKey = invoice.palette || 'skyblue';
  const palette = PALETTES_RGB[paletteKey] || PALETTES_RGB.skyblue;
  const colors = { primary: palette.primary, dark: palette.dark, text: [0, 0, 0] };

  return generateUnifiedPDF(invoice, lang, qrDataUrl, colors, invoice.templateType || 'classic');
};

function generateUnifiedPDF(inv, lang, qrDataUrl, colors, templateType) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = 210, margin = 16;
  const labels = lang === 'fr'
    ? { invoice: 'FACTURE', billedTo: 'FACTURÉ À', payment: 'Paiement', currency: 'Devise', date: 'Date', due: 'Échéance', num: 'N°', desc: 'DESCRIPTION', unit: 'UNITÉ', qty: 'QTÉ', price: 'P.U.', total: 'TOTAL', subtotal: 'Total HT', tax: 'TVA', discount: 'Remise', grandTotal: 'TOTAL TTC', notes: 'Conditions et notes', footer: 'Merci de votre Confiance', sigClient: 'Signature client', sigCompany: `Pour ${inv.client?.company || 'SOS DIGITAL'}` }
    : { invoice: 'INVOICE', billedTo: 'BILLED TO', payment: 'Payment', currency: 'Currency', date: 'Date', due: 'Due Date', num: 'N°', desc: 'DESCRIPTION', unit: 'UNIT', qty: 'QTY', price: 'PRICE', total: 'TOTAL', subtotal: 'Subtotal', tax: 'VAT', discount: 'Discount', grandTotal: 'GRAND TOTAL', notes: 'Terms and Notes', footer: 'Thank you for your business', sigClient: 'Client Signature', sigCompany: `For ${inv.client?.company || 'SOS DIGITAL'}` };

  const isModern = templateType === 'modern';
  const isMinimal = templateType === 'minimalist' || templateType === 'minimal';
  let contentStartY = 0;

  // ===== HEADER =====
  if (isModern) {
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
    contentStartY = 55;
  } else if (isMinimal) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...colors.primary);
    doc.text('SOS DIGITAL', margin, 22);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text(lang === 'fr' ? 'Facturation & Services Numériques' : 'Invoicing & Digital Services', margin, 28);
    
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(30, 41, 59);
    doc.text(labels.invoice, w - margin, 22, { align: 'right' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text(`N° ${inv.number}`, w - margin, 28, { align: 'right' });

    // Border bottom
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.8);
    doc.line(margin, 35, w - margin, 35);
    contentStartY = 45;
  } else {
    // Classic & Elegant
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...colors.primary);
    doc.text('SOS DIGITAL', margin, 20);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
    doc.text(lang === 'fr' ? 'Facturation & Services Numériques' : 'Invoicing & Digital Services', margin, 25);
    doc.setFontSize(8.5); doc.setTextColor(100, 116, 139);
    doc.text('+237 653 522 435 · contact@sosdigital.cm', margin, 30);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(30, 41, 59);
    doc.text(labels.invoice, w - margin, 20, { align: 'right' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
    doc.text(`N° ${inv.number}`, w - margin, 26, { align: 'right' });
    doc.text(`${labels.date} : ${fmtDate(inv.issueDate, lang)}`, w - margin, 31, { align: 'right' });
    if (inv.dueDate) {
      doc.setTextColor(239, 68, 68); doc.setFont('helvetica', 'bold');
      doc.text(`${labels.due} : ${fmtDate(inv.dueDate, lang)}`, w - margin, 36, { align: 'right' });
    }

    // Color bar
    doc.setFillColor(...colors.primary);
    doc.rect(margin, 42, w - margin * 2, 1.2, 'F');
    contentStartY = 50;
  }

  // ===== BODY (Identical for all) =====
  
  // Client box (Light background with colored left border)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, contentStartY, 100, 35, 3, 3, 'F');
  doc.setFillColor(...colors.primary);
  doc.rect(margin, contentStartY, 3, 35, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...colors.primary);
  doc.text(labels.billedTo, margin + 8, contentStartY + 8);
  doc.setFontSize(11); doc.setTextColor(30, 41, 59);
  doc.text(inv.client?.name || '', margin + 8, contentStartY + 15);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
  if (inv.client?.company) doc.text(inv.client.company, margin + 8, contentStartY + 20);
  if (inv.client?.email) doc.text(inv.client.email, margin + 8, inv.client?.company ? contentStartY + 25 : contentStartY + 20);

  // Invoice details (Right side)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
  doc.text(`${labels.payment}:`, 125, contentStartY + 8);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105); doc.text('Virement', 150, contentStartY + 8);

  doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text(`${labels.currency}:`, 125, contentStartY + 15);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105); doc.text(inv.currency || 'FCFA', 150, contentStartY + 15);

  if (isModern) {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(`${labels.date}:`, 125, contentStartY + 22);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105); doc.text(fmtDate(inv.issueDate, lang), 150, contentStartY + 22);
  }

  const tableBody = [];
  let currentSection = null;
  let currentItemIndex = 1;

  for (const i of (inv.items || [])) {
    const st = i.sectionTitle || '';
    if (currentSection !== st) {
      if (st) {
        tableBody.push([{
          content: st,
          colSpan: 6,
          styles: { fillColor: [238, 242, 246], textColor: colors.dark, fontStyle: 'bold', fontSize: 9.5 }
        }]);
      }
      currentSection = st;
      currentItemIndex = 1; 
    }
    tableBody.push([
      String(currentItemIndex++),
      i.description || '',
      'Unité', 
      i.quantity,
      fmtCurrency(i.unitPrice, ''),
      { content: fmtCurrency(i.total, inv.currency), styles: { fontStyle: 'bold' } }
    ]);
  }

  // TABLE
  autoTable(doc, {
    startY: contentStartY + 45,
    margin: { left: margin, right: margin },
    head: [[labels.num, labels.desc, labels.unit, labels.qty, labels.price, labels.total]],
    body: tableBody,
    headStyles: { fillColor: colors.dark, textColor: 255, fontStyle: 'bold', fontSize: 8.5, halign: 'left' },
    bodyStyles: { fontSize: 9.5, textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 75 },
      2: { cellWidth: 20 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 33 }
    }
  });

  // TOTALS BOX
  const endY = doc.lastAutoTable.finalY + 10;
  
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(w - margin - 85, endY, 85, 38, 4, 4, 'F');

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

  doc.setFillColor(...colors.primary);
  doc.roundedRect(w - margin - 80, currentY - 3, 75, 12, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
  doc.text(labels.grandTotal, w - margin - 75, currentY + 4.5);
  doc.text(fmtCurrency(inv.total, inv.currency), w - margin - 10, currentY + 4.5, { align: 'right' });

  // NOTES & FOOTER
  const noteY = Math.max(endY + 45, doc.lastAutoTable.finalY + 15);
  
  if (inv.notes) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...colors.primary);
    doc.text(labels.notes.toUpperCase(), margin, noteY);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(71, 85, 105);
    doc.text(inv.notes, margin, noteY + 6, { maxWidth: 85 });
  }

  // Separator & Signatures
  const footerStartY = 245;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, footerStartY, w - margin, footerStartY);

  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
  if (inv.footer) {
    doc.text(inv.footer, margin, footerStartY + 6);
  }

  doc.setDrawColor(148, 163, 184);
  doc.line(margin, footerStartY + 30, margin + 40, footerStartY + 30);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(labels.sigClient, margin + 20, footerStartY + 35, { align: 'center' });

  doc.line(w - margin - 40, footerStartY + 30, w - margin, footerStartY + 30);
  doc.text('Pour SOS DIGITAL', w - margin - 20, footerStartY + 35, { align: 'center' });

  // Bottom QR & Legal
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(1.5);
  doc.line(margin, 275, w - margin, 275);
  
  doc.setFontSize(7.5); doc.setTextColor(148, 163, 184);
  doc.text(`SOS DIGITAL · +237 653 522 435 · contact@sosdigital.cm`, margin, 283);

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', w - margin - 16, 278, 16, 16);
    doc.setFontSize(6); doc.setTextColor(148, 163, 184);
    doc.text(lang === 'fr' ? 'Contactez-nous' : 'Contact us', w - margin - 8, 296, { align: 'center' });
  }

  if (window.electronAPI) {
    const arrayBuffer = doc.output('arraybuffer');
    window.electronAPI.savePdf(`${inv.number}.pdf`, arrayBuffer);
  } else {
    doc.save(`${inv.number}.pdf`);
  }
}
