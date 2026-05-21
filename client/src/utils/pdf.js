import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportInvoicePDF = async (element, options = {}) => {
  if (!element) return;
  const number = options.number || 'Facture';
  
  // Clone the element to apply specific PDF styling (e.g. remove scaling)
  const clone = element.cloneNode(true);
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.position = 'absolute';
  clone.style.top = '-9999px'; // hide offscreen
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    if (window.electronAPI) {
      const arrayBuffer = pdf.output('arraybuffer');
      window.electronAPI.savePdf(`${number}.pdf`, arrayBuffer);
    } else {
      pdf.save(`${number}.pdf`);
    }
  } catch (err) {
    console.error('Error generating PDF:', err);
  } finally {
    document.body.removeChild(clone);
  }
};
