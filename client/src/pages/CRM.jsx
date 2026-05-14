import { useEffect, useState, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { statusColors } from '../utils/helpers';
import { Plus, Search, Trash2, Edit, Users, Star } from 'lucide-react';

const STATUSES = ['active', 'inactive', 'vip'];

export default function CRM() {
  const { t, lang } = useLang();
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', address: '', city: '', country: 'Cameroun', taxId: '', status: 'active', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/clients', { params: { search, status, page, limit: 15 } })
      .then(r => { setClients(r.data.clients); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ name: '', company: '', email: '', phone: '', address: '', city: '', country: 'Cameroun', taxId: '', status: 'active', notes: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm(c); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.patch(`/clients/${editing.id}`, form); toast.success(lang === 'fr' ? 'Client mis à jour !' : 'Client updated!'); }
      else { await api.post('/clients', form); toast.success(lang === 'fr' ? 'Client créé !' : 'Client created!'); }
      setShowModal(false); load();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t.common.confirm)) return;
    await api.delete(`/clients/${id}`); toast.success('Supprimé'); load();
  };

  const statusIcons = { vip: <Star size={11} fill="currentColor"/>, active: null, inactive: null };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.client.title}</h1>
          <p className="page-subtitle">{total} clients</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/>{t.client.new}</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15}/>
          <input placeholder={t.client.search} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-control" style={{ width: 150 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t.common.all}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t.status[s]}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loader"><div className="loader-dot"/><div className="loader-dot"/><div className="loader-dot"/></div>
        : clients.length === 0 ? <div className="empty-state"><Users size={48}/><h3>{t.common.noData}</h3></div>
        : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr>
                <th>{t.client.name}</th><th>{t.client.company}</th>
                <th>{t.client.email}</th><th>{t.client.phone}</th>
                <th>{t.client.city}</th><th>{t.client.status}</th><th>{t.common.actions}</th>
              </tr></thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.company || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.email || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.phone || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.city || '—'}</td>
                    <td>
                      <span className="badge" style={{ background: `${statusColors[c.status]}22`, color: statusColors[c.status], gap: 4 }}>
                        {statusIcons[c.status]}{t.status[c.status]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(c)}><Edit size={13}/></button>
                        <button className="btn-icon" onClick={() => handleDelete(c.id)}><Trash2 size={13} style={{ color: 'var(--danger)' }}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p-1)} disabled={page===1}>←</button>
          <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text-muted)' }}>{page} / {Math.ceil(total/15)}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p+1)} disabled={page>=Math.ceil(total/15)}>→</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? t.common.edit : t.client.new}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">{t.client.name} *</label><input className="form-control" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
                <div className="form-group"><label className="form-label">{t.client.company}</label><input className="form-control" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} /></div>
                <div className="form-group"><label className="form-label">{t.client.email}</label><input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
                <div className="form-group"><label className="form-label">{t.client.phone}</label><input className="form-control" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
                <div className="form-group"><label className="form-label">{t.client.city}</label><input className="form-control" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} /></div>
                <div className="form-group">
                  <label className="form-label">{t.client.status}</label>
                  <select className="form-control" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    {STATUSES.map(s => <option key={s} value={s}>{t.status[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">{t.client.address}</label><input className="form-control" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">{t.client.notes}</label><textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
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
