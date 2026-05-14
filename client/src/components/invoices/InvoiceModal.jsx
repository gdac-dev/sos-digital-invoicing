import { useState, useEffect } from 'react';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, Package } from 'lucide-react';

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: 0, total: 0, catalogItemId: null };

export default function InvoiceModal({ onClose, initial = null }) {
  const { t, lang } = useLang();
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({
    clientId: '', templateType: 'classic', language: lang,
    taxRate: 0, discount: 0, currency: 'FCFA', dueDate: '', notes: '',
    items: [{ ...EMPTY_ITEM }],
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/clients', { params: { limit: 100 } }).then(r => setClients(r.data.clients));
    api.get('/catalog').then(r => setCatalog(r.data));
  }, []);

  const setItem = (i, field, val) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        items[i].total = (Number(items[i].quantity) || 0) * (Number(items[i].unitPrice) || 0);
      }
      return { ...f, items };
    });
  };

  const addFromCatalog = (cat) => {
    setForm(f => ({
      ...f,
      items: [...f.items, { description: cat.name, quantity: 1, unitPrice: cat.unitPrice, total: cat.unitPrice, catalogItemId: cat.id }],
    }));
  };

  const subtotal = form.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0);
  const taxAmount = (subtotal - Number(form.discount)) * (Number(form.taxRate) / 100);
  const total = subtotal - Number(form.discount) + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId) return toast.error('Sélectionnez un client');
    if (form.items.some(i => !i.description)) return toast.error('Remplissez tous les articles');
    setSaving(true);
    try {
      await api.post('/invoices', form);
      toast.success('Facture créée !');
      onClose();
    } catch { toast.error('Erreur lors de la création'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-xl">
        <div className="modal-header">
          <h2 className="modal-title">{t.invoice.new}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ gridColumn: 'span 1', margin: 0 }}>
              <label className="form-label">{t.invoice.client} *</label>
              <select className="form-control" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} required>
                <option value="">— {t.invoice.client} —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t.invoice.template}</label>
              <select className="form-control" value={form.templateType} onChange={e => setForm(f => ({ ...f, templateType: e.target.value }))}>
                <option value="classic">{t.invoice.classic}</option>
                <option value="modern">{t.invoice.modern}</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t.invoice.language}</label>
              <select className="form-control" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t.invoice.dueDate}</label>
              <input type="date" className="form-control" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t.invoice.tax} (%)</label>
              <input type="number" className="form-control" min="0" max="100" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t.invoice.discount} (FCFA)</label>
              <input type="number" className="form-control" min="0" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
            </div>
          </div>

          {/* Quick add from catalog */}
          {catalog.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 8 }}><Package size={13} style={{ marginRight: 4 }} />{t.catalog.addToInvoice}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {catalog.map(c => (
                  <button type="button" key={c.id} className="btn btn-ghost btn-sm" onClick={() => addFromCatalog(c)}>
                    + {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">{t.invoice.addItem}</label>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th style={{ width: '50%' }}>{t.invoice.description}</th>
                  <th>{t.invoice.qty}</th><th>{t.invoice.unitPrice}</th><th>{t.invoice.lineTotal}</th><th></th>
                </tr></thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i}>
                      <td><input className="form-control" style={{ padding: '6px 10px' }} value={item.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder={t.invoice.description} /></td>
                      <td><input type="number" className="form-control" style={{ padding: '6px 10px', width: 70 }} min="0" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} /></td>
                      <td><input type="number" className="form-control" style={{ padding: '6px 10px', width: 110 }} min="0" value={item.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)} /></td>
                      <td style={{ fontWeight: 600 }}>{Number(item.quantity * item.unitPrice).toLocaleString('fr-FR')}</td>
                      <td>
                        {form.items.length > 1 && (
                          <button type="button" className="btn-icon" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}>
                            <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
              onClick={() => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))}>
              <Plus size={14} />{t.invoice.addItem}
            </button>
          </div>

          {/* Totals */}
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <div style={{ display: 'inline-block', minWidth: 260 }}>
              {[
                { label: t.invoice.subtotal, val: `${subtotal.toLocaleString('fr-FR')} FCFA` },
                form.discount > 0 && { label: t.invoice.discount, val: `- ${Number(form.discount).toLocaleString('fr-FR')} FCFA` },
                form.taxRate > 0 && { label: `${t.invoice.tax} ${form.taxRate}%`, val: `${taxAmount.toLocaleString('fr-FR')} FCFA` },
              ].filter(Boolean).map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 32, fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span><span>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, paddingTop: 8, borderTop: '1px solid var(--border)', color: 'var(--primary)' }}>
                <span>{t.invoice.total}</span><span>{total.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t.invoice.notes}</label>
            <textarea className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t.common.cancel}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t.common.loading : t.invoice.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
