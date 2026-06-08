import { useState, useRef, useEffect } from 'react';
import { useLang } from '../../context/LangContext';
import { MessageCircle, X, Send, ChevronDown, Mail, Phone } from 'lucide-react';
import logoImg from '../../assets/logo.jpeg';

const ADMIN_EMAIL = 'arsenedemenou@gmail.com';
const ADMIN_PHONE = '237683091628';
const ADMIN_PHONE_DISPLAY = '+237 6 83 09 16 28';

const FAQ = {
  fr: [
    { q: ['créer facture', 'nouvelle facture', 'faire une facture'], a: '👉 Cliquez sur **Factures** dans le menu, puis **Nouvelle facture**. Remplissez le client, ajoutez vos prestations et validez. Un PDF est généré automatiquement.' },
    { q: ['ajouter client', 'nouveau client', 'créer client'], a: '👉 Allez dans **Clients → Nouveau client**, remplissez nom, email, téléphone et enregistrez.' },
    { q: ['devis', 'créer devis', 'nouveau devis'], a: '👉 Menu **Devis → Nouveau devis**. Vous pourrez ensuite le convertir en facture en un clic.' },
    { q: ['pdf', 'exporter', 'télécharger'], a: '👉 Ouvrez une facture, cliquez sur **Télécharger PDF**. Plusieurs modèles disponibles.' },
    { q: ['whatsapp', 'partager', 'envoyer'], a: '👉 Sur la page d\'une facture, cliquez le bouton **WhatsApp** pour partager directement avec votre client.' },
    { q: ['paiement', 'enregistrer paiement', 'payer'], a: '👉 Sur la page de facture, cliquez **Enregistrer paiement** pour saisir le montant, la date et le mode de paiement.' },
    { q: ['rapport', 'statistique', 'bilan'], a: '👉 Menu **Rapports** : bilan annuel par mois + rapport filtré exportable en CSV.' },
    { q: ['utilisateur', 'compte', 'paramètre', 'paramètres'], a: '👉 Menu **Paramètres** (admin uniquement) pour créer des comptes Agent ou Comptabilité.' },
    { q: ['catalogue', 'produit', 'service', 'prestation'], a: '👉 Menu **Catalogue** pour ajouter vos services et produits avec les prix par défaut.' },
    { q: ['mot de passe', 'connexion', 'login'], a: '👉 Utilisez votre email et mot de passe. Si vous avez oublié vos identifiants, contactez l\'administrateur.' },
  ],
  en: [
    { q: ['create invoice', 'new invoice', 'make invoice'], a: '👉 Click **Invoices** in the menu, then **New Invoice**. Fill in client, add services and save. PDF is generated automatically.' },
    { q: ['add client', 'new client', 'create client'], a: '👉 Go to **Clients → New Client**, fill in name, email, phone and save.' },
    { q: ['quote', 'create quote', 'new quote'], a: '👉 Menu **Quotes → New Quote**. You can convert it to an invoice in one click.' },
    { q: ['pdf', 'export', 'download'], a: '👉 Open an invoice and click **Download PDF**. Multiple templates available.' },
    { q: ['whatsapp', 'share', 'send'], a: '👉 On the invoice page, click the **WhatsApp** button to share directly with your client.' },
    { q: ['payment', 'record payment', 'pay'], a: '👉 On the invoice page, click **Record Payment** to enter amount, date and payment method.' },
    { q: ['report', 'statistics', 'summary'], a: '👉 Menu **Reports**: annual summary by month + filtered report exportable as CSV.' },
    { q: ['user', 'account', 'settings'], a: '👉 Menu **Settings** (admin only) to create Agent or Accounting accounts.' },
    { q: ['catalog', 'product', 'service'], a: '👉 Menu **Catalog** to add your services and products with default prices.' },
    { q: ['password', 'login', 'connection'], a: '👉 Use your email and password. If you forgot your credentials, contact the administrator.' },
  ],
};

const CONTACT_KEYWORDS = {
  fr: ['admin', 'administrateur', 'contacter', 'parler', 'aide', 'problème', 'probleme', 'bug', 'erreur', 'support', 'humain', 'personne'],
  en: ['admin', 'administrator', 'contact', 'talk', 'help', 'problem', 'issue', 'bug', 'error', 'support', 'human', 'person'],
};

const QUICK_CHIPS = {
  fr: ['Créer une facture', 'Ajouter un client', 'Générer un devis', 'Exporter PDF', 'Contacter l\'admin'],
  en: ['Create invoice', 'Add client', 'Create quote', 'Export PDF', 'Contact admin'],
};

const BOT_INTRO = {
  fr: 'Bonjour ! Je suis l\'assistant SOS DIGITAL. Posez-moi une question ou cliquez sur un sujet rapide ci-dessous. 😊',
  en: 'Hello! I\'m the SOS DIGITAL assistant. Ask me a question or click a quick topic below. 😊',
};

const CONTACT_REPLY = {
  fr: `📬 Pour contacter l'administrateur directement, vous avez deux options :\n\n📧 **Email** : ${ADMIN_EMAIL}\n📱 **WhatsApp** : ${ADMIN_PHONE_DISPLAY}\n\nVotre message sera reçu instantanément. Veuillez patienter, l'admin vous répondra dans les plus brefs délais. 🙏`,
  en: `📬 To contact the administrator directly, you have two options:\n\n📧 **Email**: ${ADMIN_EMAIL}\n📱 **WhatsApp**: ${ADMIN_PHONE_DISPLAY}\n\nYour message will be received instantly. Please be patient, the admin will respond as soon as possible. 🙏`,
};

const NO_MATCH = {
  fr: 'Je n\'ai pas trouvé de réponse à votre question. Souhaitez-vous **contacter l\'administrateur** directement par email ou WhatsApp ?',
  en: 'I couldn\'t find an answer to your question. Would you like to **contact the administrator** directly via email or WhatsApp?',
};

function findAnswer(message, lang) {
  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Check if user wants to contact admin
  const contactMatch = CONTACT_KEYWORDS[lang].some(kw => lower.includes(kw));
  if (contactMatch) return { type: 'contact' };
  
  // Search FAQ
  const faqs = FAQ[lang];
  let bestMatch = null;
  let bestScore = 0;
  
  for (const faq of faqs) {
    for (const keyword of faq.q) {
      const kw = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      // Check if any keyword matches
      const words = kw.split(' ');
      const matchCount = words.filter(w => lower.includes(w)).length;
      const score = matchCount / words.length;
      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestMatch = faq;
      }
    }
  }
  
  if (bestMatch) return { type: 'faq', answer: bestMatch.a };
  return { type: 'none' };
}

export default function ChatbotWidget() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ from: 'bot', text: BOT_INTRO[lang] }]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(m => [...m, { from: 'user', text: msg }]);
    setTyping(true);
    
    // Simulate a brief typing delay for natural feel
    setTimeout(() => {
      const result = findAnswer(msg, lang);
      let reply;
      
      if (result.type === 'contact') {
        reply = CONTACT_REPLY[lang];
      } else if (result.type === 'faq') {
        reply = result.answer;
      } else {
        reply = NO_MATCH[lang];
      }
      
      setMessages(m => [...m, { from: 'bot', text: reply, showActions: result.type === 'contact' || result.type === 'none' }]);
      setTyping(false);
    }, 600);
  };

  const openWhatsApp = () => {
    const msg = lang === 'fr'
      ? 'Bonjour Admin, je vous contacte depuis l\'application SOS DIGITAL.'
      : 'Hello Admin, I\'m contacting you from the SOS DIGITAL app.';
    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`;
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const openEmail = () => {
    const subject = lang === 'fr' ? 'Contact depuis SOS DIGITAL' : 'Contact from SOS DIGITAL';
    const body = lang === 'fr'
      ? 'Bonjour Admin,\n\nJe vous contacte depuis l\'application SOS DIGITAL.\n\n'
      : 'Hello Admin,\n\nI\'m contacting you from the SOS DIGITAL app.\n\n';
    const url = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const renderText = (text) => text
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

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
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 999,
          width: 360, borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          border: '1px solid rgba(14,165,233,0.2)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.25s ease',
          background: 'var(--bg2)',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0369A1, #0EA5E9)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              <img src={logoImg} alt="Bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1 }}>Assistant SOS DIGITAL</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#22c55e', marginRight: 4 }} />
                {lang === 'fr' ? 'En ligne' : 'Online'}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', padding: 4, borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, minHeight: 200 }}>
            {messages.map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.from === 'bot' && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', marginRight: 6, flexShrink: 0, alignSelf: 'flex-end' }}>
                      <img src={logoImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '78%', padding: '8px 12px', borderRadius: m.from === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: m.from === 'user' ? '#0EA5E9' : 'var(--bg3)',
                    color: m.from === 'user' ? 'white' : 'var(--text)',
                    fontSize: 12.5, lineHeight: 1.5,
                  }} dangerouslySetInnerHTML={{ __html: renderText(m.text) }} />
                </div>
                {/* Contact action buttons */}
                {m.from === 'bot' && m.showActions && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, marginLeft: 32 }}>
                    <button onClick={openWhatsApp} style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20,
                      background: '#25D366', color: 'white', border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 700, transition: 'transform 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Phone size={12} /> WhatsApp
                    </button>
                    <button onClick={openEmail} style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20,
                      background: '#EA4335', color: 'white', border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 700, transition: 'transform 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Mail size={12} /> Email
                    </button>
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={logoImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
