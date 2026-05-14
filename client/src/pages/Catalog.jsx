import { useEffect, useState, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, Package, Search } from 'lucide-react';

export default function Catalog() {
  const { t, lang } = useLang();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', unitPrice: '', currency: 'FCFA', category: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/catalog', { params: { search } }).then(r => setItems(r.data));
  }, [search]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', unitPrice: '', currency: 'FCFA', category: '' }); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setForm(item); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.patch(`/catalog/${editing.id}`, form); toast.success(lang === 'fr' ? 'Service mis à jour !' : 'Service updated!'); }
      else { await api.post('/catalog', form); toast.success(lang === 'fr' ? 'Service ajouté !' : 'Service added!'); }
      setShowModal(false); load();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t.common.confirm)) return;
    await api.delete(`/catalog/${id}`); toast.success('Archivé'); load();
  };

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.catalog.title}</h1>
          <p className="page-subtitle">{items.length} services</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/>{t.catalog.new}</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 20, maxWidth: 360 }}>
        <Search size={15}/>
        <input placeholder={t.common.search} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {categories.map(cat => (
            <span key={cat} style={{ padding: '3px 12px', background: 'var(--bg3)', borderRadius: 99, fontSize: 12, color: 'var(--text-muted)' }}>{cat}</span>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state"><Package size={48}/><h3>{t.common.noData}</h3><p style={{ fontSize: 13, marginTop: 8 }}>{lang === 'fr' ? 'Ajoutez vos services et prestations' : 'Add your services and offerings'}</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                  {item.category && <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>{item.category}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-icon" onClick={() => openEdit(item)}><Edit size={13}/></button>
                  <button className="btn-icon" onClick={() => handleDelete(item.id)}><Trash2 size={13} style={{ color: 'var(--danger)' }}/></button>
                </div>
              </div>
              {item.description && <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.description}</p>}
              <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', fontFamily: 'Inter, sans-serif' }}>
                  {Number(item.unitPrice).toLocaleString('fr-FR')}
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 4 }}>{item.currency}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? t.common.edit : t.catalog.new}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">{t.catalog.name} *</label><input className="form-control" required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">{t.catalog.description}</label><textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} /></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">{t.catalog.unitPrice} *</label><input type="number" className="form-control" min="0" required value={form.unitPrice} onChange={e => setForm(f=>({...f,unitPrice:e.target.value}))} /></div>
                <div className="form-group"><label className="form-label">{t.catalog.category}</label><input className="form-control" value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} /></div>
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
