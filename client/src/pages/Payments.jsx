import { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import { formatCurrency, formatDate, statusColors, downloadCSV } from '../utils/helpers';
import { CreditCard, Download } from 'lucide-react';

export default function Payments() {
  const { t, lang } = useLang();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments').then(r => setPayments(r.data)).finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    const data = payments.map(p => ({
      Date: formatDate(p.date),
      Facture: p.invoice?.number,
      Client: p.invoice?.client?.name,
      Montant: p.amount,
      Devise: 'FCFA',
      Methode: p.method,
      Notes: p.notes || '',
    }));
    downloadCSV(data, 'paiements-sos-digital.csv');
  };

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.payment.title}</h1>
          <p className="page-subtitle">{payments.length} {lang === 'fr' ? 'paiements' : 'payments'} · {formatCurrency(total)}</p>
        </div>
        <button className="btn btn-ghost" onClick={handleExport}><Download size={15}/>CSV</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loader"><div className="loader-dot"/><div className="loader-dot"/><div className="loader-dot"/></div>
        : payments.length === 0 ? <div className="empty-state"><CreditCard size={48}/><h3>{t.common.noData}</h3></div>
        : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr>
                <th>{t.payment.date}</th><th>{t.invoice.number}</th>
                <th>{t.invoice.client}</th><th>{t.payment.amount}</th>
                <th>{t.payment.method}</th><th>{t.payment.notes}</th>
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(p.date)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.invoice?.number}</td>
                    <td>{p.invoice?.client?.name}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text-muted)' }}>
                        {t.payment.methods[p.method] || p.method}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
