import { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Shield, Users, AlertTriangle } from 'lucide-react';

const ROLES = ['admin', 'agent', 'accounting'];

export default function Settings() {
  const { t, lang } = useLang();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent', canViewData: true });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'agent', canViewData: true });
    setShowModal(true);
  };
  const openEdit = (u) => { setEditing(u); setForm({ ...u, password: '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.patch(`/users/${editing.id}`, payload);
        toast.success(lang === 'fr' ? 'Utilisateur mis à jour !' : 'User updated!');
      } else {
        if (!form.password) return toast.error(lang === 'fr' ? 'Mot de passe requis' : 'Password required');
        await api.post('/users', form);
        toast.success(lang === 'fr' ? 'Utilisateur créé !' : 'User created!');
      }
      setShowModal(false); load();
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
    toast.success(lang === 'fr' ? 'Statut mis à jour' : 'Status updated');
    load();
  };

  const handleDeleteUser = async (u) => {
    if (!confirm(lang === 'fr' ? `Supprimer définitivement l'utilisateur "${u.name}" ?` : `Permanently delete user "${u.name}"?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success(lang === 'fr' ? 'Utilisateur supprimé' : 'User deleted');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const roleColors = { admin: '#ef4444', agent: '#0ea5e9', accounting: '#8b5cf6' };
  const roleLabels = t.settings.roles;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.settings.title}</h1>
          <p className="page-subtitle">{lang === 'fr' ? 'Gestion des comptes utilisateurs' : 'User account management'}</p>
        </div>
        {me?.email === 'admin@sosdigital.cm' && (
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />{t.settings.newUser}</button>
        )}
      </div>

      {/* Company info card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg,#0EA5E9,#0369A1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'white', fontFamily: 'Inter,sans-serif' }}>SD</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Inter,sans-serif' }}>SOS DIGITAL</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>contact@sosdigital.cm · +237 653 522 435</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Douala, Cameroun</div>
          </div>
        </div>
      </div>

      {/* Users list */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={18} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>{t.settings.users} ({users.length})</h2>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead><tr>
              <th>{t.settings.name}</th><th>{t.settings.email}</th>
              <th>{t.settings.role}</th><th>{t.settings.canView}</th>
              <th>{t.settings.active}</th><th>{t.common.actions}</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${roleColors[u.role]}22`, color: roleColors[u.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                      {u.id === me?.id && <span style={{ fontSize: 10, background: 'var(--primary)', color: 'white', padding: '1px 6px', borderRadius: 99 }}>Moi</span>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className="badge" style={{ background: `${roleColors[u.role]}22`, color: roleColors[u.role] }}>
                      <Shield size={10} />{roleLabels[u.role]}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: u.canViewData ? 'var(--success)' : 'var(--text-muted)' }}>
                      {u.canViewData ? '✓' : '✗'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => u.id !== me?.id && toggleActive(u)}
                      style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, border: 'none', cursor: u.id === me?.id ? 'default' : 'pointer', background: u.isActive ? '#22c55e22' : '#ef444422', color: u.isActive ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {u.isActive ? (lang === 'fr' ? 'Actif' : 'Active') : (lang === 'fr' ? 'Inactif' : 'Inactive')}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" title={t.common.edit} onClick={() => openEdit(u)}><Edit size={13} /></button>
                      {me?.email === 'admin@sosdigital.cm' && u.id !== me?.id && (
                        <button className="btn-icon" title={lang === 'fr' ? 'Supprimer (Admin)' : 'Delete (Admin)'} onClick={() => handleDeleteUser(u)} style={{ color: 'var(--danger)' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? t.common.edit : t.settings.newUser}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">{t.settings.name} *</label><input className="form-control" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">{t.settings.email} *</label><input type="email" className="form-control" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-group">
                <label className="form-label">{t.settings.password} {editing ? `(${lang === 'fr' ? 'laisser vide pour ne pas changer' : 'leave blank to keep'})` : '*'}</label>
                <input type="password" className="form-control" required={!editing} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t.settings.role}</label>
                  <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                  <input type="checkbox" id="canViewData" checked={form.canViewData} onChange={e => setForm(f => ({ ...f, canViewData: e.target.checked }))} />
                  <label htmlFor="canViewData" style={{ fontSize: 13, cursor: 'pointer' }}>{t.settings.canView}</label>
                </div>
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
