import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (isRegister) {
      if (form.password.length < 6) {
        const msg = lang === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères' : 'Password must be at least 6 characters';
        setErrors({ password: msg });
        toast.error(msg);
        return;
      }
      if (form.password !== form.confirmPassword) {
        setErrors({ confirmPassword: t.auth.registerError || 'Passwords do not match' });
        toast.error(t.auth.registerError || 'Passwords do not match');
        return;
      }
    }
    
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error;
      
      if (!err.response) {
        // Network error (server offline)
        const offlineMsg = lang === 'fr' ? "Erreur réseau : Serveur injoignable" : "Network error: Server unreachable";
        setErrors({ form: offlineMsg });
        toast.error(offlineMsg);
      } else if (err.response.status === 500) {
        // Database offline or server error
        const serverMsg = lang === 'fr' ? "Erreur serveur : Base de données hors ligne ?" : "Server error: Database offline?";
        setErrors({ form: msg || serverMsg });
        toast.error(msg || serverMsg);
      } else if (msg === 'USER_DELETED') {
        const errorText = lang === 'fr' ? "L'utilisateur n'existe pas" : "User does not exist";
        setErrors({ email: errorText });
        toast.error(errorText);
      } else if (msg && msg.toLowerCase().includes('email')) {
        setErrors({ email: msg });
        toast.error(msg);
      } else {
        setErrors({ form: isRegister ? t.auth.registerError : t.auth.loginError });
        toast.error(msg || (isRegister ? t.auth.registerError : t.auth.loginError));
      }
    } finally {
      setLoading(false);
    }
  };

  const getErrorStyle = (field) => errors[field] ? { borderColor: 'var(--danger)', background: '#fef2f2' } : {};

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
          
          <div style={{ display: 'flex', marginBottom: 24, gap: 8, background: 'var(--bg-card-hover)', padding: 4, borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrors({}); }}
              style={{
                flex: 1, padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 14,
                background: !isRegister ? 'var(--primary)' : 'transparent',
                color: !isRegister ? 'white' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {t.auth.login}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrors({}); }}
              style={{
                flex: 1, padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 14,
                background: isRegister ? 'var(--primary)' : 'transparent',
                color: isRegister ? 'white' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {t.auth.register}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {errors.form && <div style={{ color: 'var(--danger)', fontSize: 13, background: '#fef2f2', padding: '8px 12px', borderRadius: 6, marginBottom: 16, border: '1px solid var(--danger)' }}>{errors.form}</div>}
            {isRegister && (
              <div className="form-group">
                <label className="form-label">{t.auth.name}</label>
                <input
                  id="name" type="text" className="form-control" required
                  placeholder="Jean Dupont"
                  style={getErrorStyle('name')}
                  value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(e => ({...e, name: null})); }}
                />
                {errors.name && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">{t.auth.email}</label>
              <input
                id="email" type="email" className="form-control" required
                placeholder="admin@sosdigital.cm"
                style={getErrorStyle('email')}
                value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(e => ({...e, email: null})); }}
              />
              {errors.email && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">{t.auth.password}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password" type={showPw ? 'text' : 'password'} className="form-control" required
                  placeholder="••••••••" style={{ paddingRight: 44, ...getErrorStyle('password') }}
                  value={form.password} onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(e => ({...e, password: null})); }}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', color: 'var(--text-muted)', padding: 4, border: 'none', cursor: 'pointer'
                }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.password}</div>}
            </div>

            {isRegister && (
              <div className="form-group">
                <label className="form-label">{t.auth.confirmPassword}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword" type={showPw ? 'text' : 'password'} className="form-control" required
                    placeholder="••••••••" style={{ paddingRight: 44, ...getErrorStyle('confirmPassword') }}
                    value={form.confirmPassword} onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setErrors(e => ({...e, confirmPassword: null})); }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', color: 'var(--text-muted)', padding: 4, border: 'none', cursor: 'pointer'
                  }}>
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.confirmPassword && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.confirmPassword}</div>}
              </div>
            )}

            <button id="login-btn" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, padding: '12px', fontSize: 15 }} disabled={loading}>
              {loading ? (
                <><span className="spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }} /> {lang === 'fr' ? 'Chargement...' : 'Loading...'}</>
              ) : (isRegister ? t.auth.registerBtn : t.auth.loginBtn)}
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
