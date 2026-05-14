import { useState } from 'react';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export default function PaymentModal({ invoiceId, onClose }) {
  const { t } = useLang();
  const [form, setForm] = useState({ amount: '', method: 'cash', date: new Date().toISOString().split('T')[0], notes: '', isPartial: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) return toast.error('Montant requis');
    setSaving(true);
    try {
      await api.post('/payments', { ...form, invoiceId });
      toast.success('Paiement enregistré !');
      onClose();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const methods = Object.entries(t.payment.methods);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{t.payment.add}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t.payment.amount} (FCFA) *</label>
            <input type="number" className="form-control" min="0" required value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t.payment.method}</label>
              <select className="form-control" value={form.method} onChange={e => setForm(f => ({...f, method: e.target.value}))}>
                {methods.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.payment.date}</label>
              <input type="date" className="form-control" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t.payment.notes}</label>
            <input type="text" className="form-control" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          </div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="partial" checked={form.isPartial} onChange={e => setForm(f => ({...f, isPartial: e.target.checked}))} />
            <label htmlFor="partial" style={{ fontSize: 13, cursor: 'pointer' }}>{t.payment.partial}</label>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t.common.cancel}</button>
            <button type="submit" className="btn btn-success" disabled={saving}>{saving ? t.common.loading : t.common.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
