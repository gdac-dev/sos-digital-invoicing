import { useState, useRef, useEffect } from 'react';
import { useLang } from '../../context/LangContext';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';

const FAQ = {
  fr: [
    { q: 'créer une facture', a: '👉 Cliquez sur **Factures** dans le menu, puis **Nouvelle facture**. Remplissez le client, ajoutez vos prestations et validez. Un PDF est généré automatiquement.' },
    { q: 'ajouter un client', a: '👉 Allez dans **Clients → Nouveau client**, remplissez nom, email, téléphone et enregistrez.' },
    { q: 'générer un devis', a: '👉 Menu **Devis → Nouveau devis**. Vous pourrez ensuite le convertir en facture en un clic.' },
    { q: 'exporter pdf', a: '👉 Ouvrez une facture, cliquez sur **Télécharger PDF**. Deux modèles disponibles : Classique et Moderne.' },
    { q: 'whatsapp', a: '👉 Sur la page d\'une facture, cliquez le bouton **WhatsApp** pour partager directement avec votre client.' },
    { q: 'paiement', a: '👉 Sur la page de facture, cliquez **Enregistrer paiement** pour saisir le montant, la date et le mode de paiement.' },
    { q: 'rapport', a: '👉 Menu **Rapports** : bilan annuel par mois + rapport filtré exportable en CSV.' },
    { q: 'utilisateur', a: '👉 Menu **Paramètres** (admin uniquement) pour créer des comptes Sales ou Comptabilité.' },
  ],
  en: [
    { q: 'create invoice', a: '👉 Click **Invoices** in the menu, then **New Invoice**. Fill in client, add services and save. PDF is generated automatically.' },
    { q: 'add client', a: '👉 Go to **Clients → New Client**, fill in name, email, phone and save.' },
    { q: 'create quote', a: '👉 Menu **Quotes → New Quote**. You can convert it to an invoice in one click.' },
    { q: 'export pdf', a: '👉 Open an invoice and click **Download PDF**. Two templates: Classic and Modern.' },
    { q: 'whatsapp', a: '👉 On the invoice page, click the **WhatsApp** button to share directly with your client.' },
    { q: 'payment', a: '👉 On the invoice page, click **Record Payment** to enter amount, date and payment method.' },
    { q: 'report', a: '👉 Menu **Reports**: annual summary by month + filtered report exportable as CSV.' },
    { q: 'user', a: '👉 Menu **Settings** (admin only) to create Sales or Accounting accounts.' },
  ],
};

const QUICK_CHIPS = {
  fr: ['Créer une facture', 'Ajouter un client', 'Générer un devis', 'Exporter PDF', 'Enregistrer paiement'],
  en: ['Create invoice', 'Add client', 'Create quote', 'Export PDF', 'Record payment'],
};

const BOT_INTRO = {
  fr: 'Bonjour ! Je suis l\'assistant SOS DIGITAL. Comment puis-je vous aider ? 😊',
  en: 'Hello! I\'m the SOS DIGITAL assistant. How can I help you? 😊',
};

export default function ChatbotWidget() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ from: 'bot', text: BOT_INTRO[lang] }]);
  const [typing, setTyping] = useState(false);
  const [msgCount, setMsgCount] = useState(0); // user messages sent
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  // We'll use api from utils/api
  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMsgCount(c => c + 1);
    setMessages(m => [...m, { from: 'user', text: msg }]);
    setTyping(true);
    
    try {
      // Get auth user from localStorage to pass email if available
      let userEmail = null;
      try {
        const auth = JSON.parse(localStorage.getItem('auth'));
        userEmail = auth?.user?.email;
      } catch(e) {}

      // Call backend api for chatbot
      // We need to import api at the top, or just use fetch
      const res = await fetch('http://localhost:3001/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, lang, userEmail })
      });
      const data = await res.json();
      
      setMessages(m => [...m, { from: 'bot', text: data.reply || (lang === 'fr' ? 'Erreur de réponse' : 'Response error') }]);
    } catch (e) {
      setMessages(m => [...m, { from: 'bot', text: lang === 'fr' ? 'Désolé, je suis hors ligne actuellement.' : 'Sorry, I am currently offline.' }]);
    } finally {
      setTyping(false);
    }
  };

  const renderText = (text) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return (
    <>
      {/* Floating button */}
      <button
        className="float-anim"
        onClick={() => { setOpen(o => !o); }}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 54, height: 54, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0EA5E9, #0369A1)',
          boxShadow: '0 6px 24px rgba(14,165,233,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {open ? <ChevronDown size={22} color="white" /> : <MessageCircle size={22} color="white" />}
        {/* Badge */}
        {msgCount > 0 && !open && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, borderRadius: '50%',
            background: '#ef4444', color: 'white',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg)',
            animation: 'pulse 1.5s infinite',
          }}>
            {msgCount > 9 ? '9+' : msgCount}
          </div>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 999,
          width: 340, borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          border: '1px solid rgba(14,165,233,0.2)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.25s ease',
          background: 'var(--bg2)',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0369A1, #0EA5E9)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              <img src="./logo.jpeg" alt="Bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1 }}>Assistant SOS DIGITAL</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#22c55e', marginRight: 4 }} />
                {lang === 'fr' ? 'En ligne' : 'Online'}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', padding: 4, borderRadius: '50%' }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, minHeight: 200 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.from === 'bot' && (
                  <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', marginRight: 6, flexShrink: 0, alignSelf: 'flex-end' }}>
                    <img src="./logo.jpeg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '8px 12px', borderRadius: m.from === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: m.from === 'user' ? '#0EA5E9' : 'var(--bg3)',
                  color: m.from === 'user' ? 'white' : 'var(--text)',
                  fontSize: 12.5, lineHeight: 1.5,
                }} dangerouslySetInnerHTML={{ __html: renderText(m.text) }} />
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <img src="/logo.jpeg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: '14px 14px 14px 2px', padding: '8px 14px', display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', display: 'inline-block', animation: `bounce 0.8s ${i*0.15}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          <div style={{ padding: '6px 10px', display: 'flex', gap: 5, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
            {QUICK_CHIPS[lang].map(chip => (
              <button key={chip} onClick={() => sendMessage(chip)} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', border: '1px solid rgba(14,165,233,0.3)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.target.style.background = '#0EA5E9'; e.target.style.color = 'white'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(14,165,233,0.1)'; e.target.style.color = '#0EA5E9'; }}>
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={lang === 'fr' ? 'Posez votre question...' : 'Ask your question...'}
              style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 14px', fontSize: 12.5, color: 'var(--text)', outline: 'none' }}
            />
            <button onClick={() => sendMessage()} style={{ width: 34, height: 34, borderRadius: '50%', background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <Send size={14} color="white" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
