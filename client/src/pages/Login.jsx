import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch {
      toast.error(t.auth.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(14,165,233,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(120,53,15,0.06) 0%, transparent 50%)',
      padding: '20px',
    }}>
      {/* Lang toggle */}
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <div className="lang-toggle">
          <button className={`lang-btn${lang==='fr'?' active':''}`} onClick={() => lang!=='fr'&&toggle()}>FR</button>
          <button className={`lang-btn${lang==='en'?' active':''}`} onClick={() => lang!=='en'&&toggle()}>EN</button>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 420, animation: 'slideUp 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, overflow: 'hidden', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(14,165,233,0.3)' }}>
            <img src="./logo.jpeg" alt="SOS DIGITAL" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Inter,sans-serif', color: 'var(--text)', marginBottom: 6 }}>
            SOS DIGITAL
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t.auth.loginSubtitle}</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{t.auth.welcome}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t.auth.email}</label>
              <input
                id="email" type="email" className="form-control" required
                placeholder="admin@sosdigital.cm"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.auth.password}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password" type={showPw ? 'text' : 'password'} className="form-control" required
                  placeholder="••••••••" style={{ paddingRight: 44 }}
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', color: 'var(--text-muted)', padding: 4,
                }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button id="login-btn" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, padding: '12px', fontSize: 15 }} disabled={loading}>
              {loading ? (
                <><span className="spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }} /> {lang === 'fr' ? 'Connexion...' : 'Signing in...'}</>
              ) : t.auth.loginBtn}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, marginTop: 24 }}>
          SOS DIGITAL © {new Date().getFullYear()} — {lang === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}
        </p>
      </div>
    </div>
  );
}
