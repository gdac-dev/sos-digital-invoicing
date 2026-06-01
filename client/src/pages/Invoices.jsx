import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import { formatCurrency, formatDate, statusColors } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Trash2, FileText, Edit } from 'lucide-react';

const STATUSES = ['draft','sent','viewed','paid','overdue','canceled'];

export default function Invoices() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/invoices', { params: { search, status, page, limit: 15 } })
      .then(r => { setInvoices(r.data.invoices); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm(t.invoice.confirmDelete)) return;
    await api.delete(`/invoices/${id}`);
    toast.success(lang === 'fr' ? 'Facture supprimée' : 'Invoice deleted');
    load();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.invoice.title}</h1>
          <p className="page-subtitle">{total} {total > 1 ? 'factures' : 'facture'}</p>
        </div>
        <button id="create-invoice" className="btn btn-primary" onClick={() => navigate('/invoices/new')}>
          <Plus size={16} />{t.invoice.new}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} />
          <input placeholder={t.client.search} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-control" style={{ width: 160 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t.common.all}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t.status[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loader"><div className="loader-dot"/><div className="loader-dot"/><div className="loader-dot"/></div>
        ) : invoices.length === 0 ? (
          <div className="empty-state"><FileText size={48} /><h3>{t.common.noData}</h3></div>
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr>
                <th>{t.invoice.number}</th><th>{t.invoice.client}</th>
                <th>{t.invoice.date}</th><th>{t.invoice.dueDate}</th>
                <th>{t.invoice.amount}</th><th>{t.invoice.status}</th><th>{t.common.actions}</th>
              </tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.number}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.client?.name}</div>
                      {inv.client?.company && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.client.company}</div>}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(inv.issueDate)}</td>
                    <td style={{ color: inv.status === 'overdue' ? 'var(--danger)' : 'var(--text-muted)' }}>{formatDate(inv.dueDate)}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(inv.total, inv.currency)}</td>
                    <td>
                      <span className="badge" style={{ background: `${statusColors[inv.status]}22`, color: statusColors[inv.status] }}>
                        {t.status[inv.status]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" title={t.common.view} onClick={() => navigate(`/invoices/${inv.id}`)}><Eye size={14}/></button>
                        <button className="btn-icon" title={t.common.edit} onClick={() => navigate(`/invoices/${inv.id}/edit`)}><Edit size={14}/></button>
                        <button className="btn-icon" title={t.common.delete} onClick={e => handleDelete(inv.id, e)} style={{ color: 'var(--danger)' }}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {invoices.length > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>←</button>
          <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text-muted)' }}>{t.common.page} {page} {t.common.of} {Math.ceil(total/15)}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total/15)}>→</button>
        </div>
      )}
    </div>
  );
}
