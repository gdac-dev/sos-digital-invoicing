export const formatCurrency = (amount, currency = 'FCFA') =>
  `${Number(amount || 0).toLocaleString('fr-FR')} ${currency}`;

export const formatDate = (date, lang = 'fr') =>
  date ? new Date(date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '—';

export const statusColors = {
  draft: '#94a3b8', sent: '#3b82f6', viewed: '#8b5cf6',
  paid: '#22c55e', overdue: '#ef4444', canceled: '#6b7280',
  active: '#22c55e', inactive: '#94a3b8', vip: '#f59e0b',
  accepted: '#22c55e', declined: '#ef4444', expired: '#f97316', converted: '#0ea5e9',
};

export const openWhatsApp = (invoiceNumber, lang = 'fr') => {
  const phone = '237653522435';
  const msg = lang === 'fr'
    ? `Bonjour, veuillez trouver ci-joint votre facture SOS DIGITAL #${invoiceNumber}.`
    : `Hello, please find attached your SOS DIGITAL invoice #${invoiceNumber}.`;
    
  if (window.electronAPI) {
    window.electronAPI.openExternal(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`);
  } else {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }
};

export const downloadCSV = (data, filename) => {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};
