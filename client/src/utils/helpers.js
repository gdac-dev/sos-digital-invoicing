export const formatCurrency = (amount, currency = 'FCFA') =>
  `${Number(amount || 0).toLocaleString('fr-FR')} ${currency}`;

export const formatDate = (date, lang = 'fr') =>
  date ? new Date(date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '—';

export const statusColors = {
  draft: '#94a3b8', sent: '#3b82f6', viewed: '#8b5cf6',
  partial: '#f59e0b', paid: '#22c55e', overdue: '#ef4444', canceled: '#6b7280',
  active: '#22c55e', inactive: '#94a3b8', vip: '#f59e0b',
  accepted: '#22c55e', declined: '#ef4444', expired: '#f97316', converted: '#0ea5e9',
};

export const openWhatsApp = (invoiceNumber, companyName = 'SOS DIGITAL', lang = 'fr', clientPhone = '', clientName = '', clientCompany = '') => {
  let phone = clientPhone ? clientPhone.replace(/\D/g, '') : '';

  // Smart Cameroon phone detection:
  // If it's a 9-digit number starting with 6 or 2 (Cameroonian mobile/landline), prepend 237
  if (phone.length === 9 && /^[62]/.test(phone)) {
    phone = '237' + phone;
  }
  // If someone typed e.g. "683091628" (8 digits after removing leading 0), handle "06..." format
  if (phone.length === 10 && phone.startsWith('0') && /^0[62]/.test(phone)) {
    phone = '237' + phone.substring(1);
  }
  // If already has country code (10+ digits not starting with 0), use as-is

  const recipient = clientCompany ? `${clientName} (${clientCompany})` : clientName;
  const msg = lang === 'fr'
    ? `Bonjour ${recipient ? recipient + ',' : ''}\nVeuillez trouver ci-joint votre facture ${companyName} #${invoiceNumber}.`
    : `Hello ${recipient ? recipient + ',' : ''}\nPlease find attached your ${companyName} invoice #${invoiceNumber}.`;
    
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
