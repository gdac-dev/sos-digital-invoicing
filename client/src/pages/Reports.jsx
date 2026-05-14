import { useState } from 'react';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import { formatCurrency, formatDate, statusColors, downloadCSV } from '../utils/helpers';
import { Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const { t, lang } = useLang();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/invoices', { params: { from, to, status } });
      setData(r.data);
    } catch { toast.error('Erreur'); } finally { setLoading(false); }
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/summary', { params: { year } });
      setSummary(r.data);
    } catch { toast.error('Erreur'); } finally { setLoading(false); }
  };

  const handleExportCSV = () => {
    downloadCSV(data.map(inv => ({
      Numero: inv.number, Client: inv.client?.name,
      Statut: t.status[inv.status], Date: formatDate(inv.issueDate),
      Total: inv.total, Paye: inv.paidAmount, Solde: inv.total - inv.paidAmount,
    })), `rapport-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const MONTHS = lang === 'fr'
    ? ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="fade-in">
      <h1 className="page-title" style={{ marginBottom: 24 }}>{t.report.title}</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{t.report.summary}</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <label className="form-label">{t.report.year}</label>
            <input type="number" className="form-control" style={{ width: 100 }} value={year} min={2020} max={2030} onChange={e => setYear(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={loadSummary} disabled={loading}>
            <Search size={14} />{loading ? t.common.loading : (lang === 'fr' ? 'Générer' : 'Generate')}
          </button>
        </div>
        {summary && (
          <>
            <div className="metrics-grid" style={{ marginBottom: 16 }}>
              {[
                { label: t.report.totalInvoiced, value: formatCurrency(summary.totalInvoiced), color: 'var(--primary)' },
                { label: t.report.totalCollected, value: formatCurrency(summary.totalRevenue), color: 'var(--success)' },
                { label: lang === 'fr' ? 'Factures' : 'Invoices', value: summary.invoiceCount, color: 'var(--info)' },
                { label: lang === 'fr' ? 'Devis' : 'Quotes', value: summary.quoteCount, color: 'var(--accent)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card card-sm" style={{ borderTop: `3px solid ${color}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'Inter,sans-serif' }}>{value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>{lang === 'fr' ? 'Mois' : 'Month'}</th>
                  <th>{lang === 'fr' ? 'Nb Factures' : 'Invoices'}</th>
                  <th>{t.report.totalInvoiced}</th>
                  <th>{t.report.totalCollected}</th>
                </tr></thead>
                <tbody>
                  {summary.byMonth.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{MONTHS[i]}</td>
                      <td>{m.invoices}</td>
                      <td>{formatCurrency(m.invoiceTotal)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(m.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{lang === 'fr' ? 'Rapport de factures' : 'Invoice Report'}</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div><label className="form-label">{t.report.from}</label><input type="date" className="form-control" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div><label className="form-label">{t.report.to}</label><input type="date" className="form-control" value={to} onChange={e => setTo(e.target.value)} /></div>
          <div>
            <label className="form-label">{t.invoice.status}</label>
            <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">{t.common.all}</option>
              {['draft','sent','viewed','paid','overdue','canceled'].map(s => <option key={s} value={s}>{t.status[s]}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={loadInvoices} disabled={loading}>
            <Search size={14} />{loading ? t.common.loading : (lang === 'fr' ? 'Filtrer' : 'Filter')}
          </button>
          {data.length > 0 && (
            <button className="btn btn-ghost" style={{ alignSelf: 'flex-end' }} onClick={handleExportCSV}>
              <Download size={14} />CSV
            </button>
          )}
        </div>
        {data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>{t.invoice.number}</th><th>{t.invoice.client}</th>
                <th>{t.invoice.date}</th><th>{t.invoice.status}</th>
                <th>Total</th><th>{lang === 'fr' ? 'Payé' : 'Paid'}</th><th>{lang === 'fr' ? 'Reste' : 'Balance'}</th>
              </tr></thead>
              <tbody>
                {data.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.number}</td>
                    <td>{inv.client?.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(inv.issueDate)}</td>
                    <td><span className="badge" style={{ background: `${statusColors[inv.status]}22`, color: statusColors[inv.status] }}>{t.status[inv.status]}</span></td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(inv.paidAmount)}</td>
                    <td style={{ color: inv.total - inv.paidAmount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{formatCurrency(inv.total - inv.paidAmount)}</td>
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
