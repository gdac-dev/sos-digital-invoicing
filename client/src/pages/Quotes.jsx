import { useEffect, useState, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatDate, statusColors } from '../utils/helpers';
import { Plus, Search, ArrowRight, Trash2, FileText } from 'lucide-react';

const STATUSES = ['draft','sent','accepted','declined','expired','converted'];
const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: 0 };

export default function Quotes() {
  const { t, lang } = useLang();
  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({ clientId: '', templateType: 'classic', language: lang, taxRate: 0, discount: 0, currency: 'FCFA', validUntil: '', notes: '', items: [{ ...EMPTY_ITEM }] });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/quotes', { params: { status, page, limit: 15 } })
      .then(r => { setQuotes(r.data.quotes); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/clients', { params: { limit: 100 } }).then(r => setClients(r.data.clients));
    api.get('/catalog').then(r => setCatalog(r.data));
  }, []);

  const setItem = (i, field, val) => {
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/quotes', form);
      toast.success(lang === 'fr' ? 'Devis créé !' : 'Quote created!');
      setShowModal(false); load();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const convertToInvoice = async (id) => {
    if (!confirm(lang === 'fr' ? 'Convertir ce devis en facture ?' : 'Convert this quote to an invoice?')) return;
    try {
      await api.post(`/quotes/${id}/convert`);
      toast.success(lang === 'fr' ? 'Facture créée !' : 'Invoice created!');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t.common.confirm)) return;
    await api.delete(`/quotes/${id}`); toast.success('Supprimé'); load();
  };

  const subtotal = form.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0);
  const total2 = subtotal - Number(form.discount) + (subtotal - Number(form.discount)) * (Number(form.taxRate) / 100);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.quote.title}</h1>
          <p className="page-subtitle">{total} devis</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16}/>{t.quote.new}</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select className="form-control" style={{ width: 180 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t.common.all}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t.status[s]}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loader"><div className="loader-dot"/><div className="loader-dot"/><div className="loader-dot"/></div>
        : quotes.length === 0 ? <div className="empty-state"><FileText size={48}/><h3>{t.common.noData}</h3></div>
        : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr>
                <th>{t.quote.number}</th><th>{t.invoice.client}</th>
                <th>{t.invoice.date}</th><th>{t.quote.validity}</th>
                <th>{t.invoice.amount}</th><th>{t.invoice.status}</th><th>{t.common.actions}</th>
              </tr></thead>
              <tbody>
                {quotes.map(q => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{q.number}</td>
                    <td>{q.client?.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(q.issueDate)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(q.validUntil)}</td>
                    <td style={{ fontWeight: 600 }}>{Number(q.total).toLocaleString('fr-FR')} {q.currency}</td>
                    <td>
                      <span className="badge" style={{ background: `${statusColors[q.status]}22`, color: statusColors[q.status] }}>
                        {t.status[q.status]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {q.status !== 'converted' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => convertToInvoice(q.id)} title={t.quote.convertToInvoice}>
                            <ArrowRight size={13}/>{lang === 'fr' ? 'Convertir' : 'Convert'}
                          </button>
                        )}
                        <button className="btn-icon" onClick={() => handleDelete(q.id)}><Trash2 size={13} style={{ color: 'var(--danger)' }}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{t.quote.new}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t.invoice.client} *</label>
                  <select className="form-control" value={form.clientId} onChange={e => setForm(f => ({...f, clientId: e.target.value}))} required>
                    <option value="">—</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t.quote.validity}</label>
                  <input type="date" className="form-control" value={form.validUntil} onChange={e => setForm(f => ({...f, validUntil: e.target.value}))} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="form-label">{t.invoice.addItem}</label>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>{t.invoice.description}</th><th>{t.invoice.qty}</th><th>{t.invoice.unitPrice}</th><th>Total</th><th></th></tr></thead>
                    <tbody>
                      {form.items.map((item, i) => (
                        <tr key={i}>
                          <td><input className="form-control" style={{ padding: '6px 8px' }} value={item.description} onChange={e => setItem(i, 'description', e.target.value)} /></td>
                          <td><input type="number" className="form-control" style={{ padding: '6px 8px', width: 60 }} value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} /></td>
                          <td><input type="number" className="form-control" style={{ padding: '6px 8px', width: 100 }} value={item.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)} /></td>
                          <td style={{ fontWeight: 600 }}>{(item.quantity * item.unitPrice).toLocaleString('fr-FR')}</td>
                          <td>{form.items.length > 1 && <button type="button" className="btn-icon" onClick={() => setForm(f => ({...f, items: f.items.filter((_,j)=>j!==i)}))}><Trash2 size={12} style={{ color: 'var(--danger)' }}/></button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setForm(f => ({...f, items: [...f.items, {...EMPTY_ITEM}]}))}>
                  <Plus size={13}/> {t.invoice.addItem}
                </button>
              </div>

              <div style={{ textAlign: 'right', marginBottom: 12, fontSize: 14 }}>
                <strong style={{ color: 'var(--primary)' }}>Total: {total2.toLocaleString('fr-FR')} FCFA</strong>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t.common.cancel}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t.common.loading : t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
