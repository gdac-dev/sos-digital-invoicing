import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Download, Building2, Users, ClipboardList, Package, FileText, Palette, Eye, Settings } from 'lucide-react';
import { INITIAL_DESIGN, INITIAL_COMPANY, INITIAL_CLIENT, INITIAL_DETAILS, EMPTY_ITEM } from '../components/invoices/editorConstants';
import { EntrepriseTab, ClientTab, DetailsTab, PrestationsTab, NotesTab, DesignTab } from '../components/invoices/EditorTabs';
import InvoicePreview from '../components/invoices/InvoicePreview';
import { exportInvoicePDF } from '../utils/pdf';

const useIsMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 900);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
};

const TABS_FR = [
  { id: 'entreprise', label: 'Entreprise', icon: Building2 },
  { id: 'client',     label: 'Client',     icon: Users },
  { id: 'details',    label: 'Détails',    icon: ClipboardList },
  { id: 'prestations',label: 'Prestations',icon: Package },
  { id: 'notes',      label: 'Notes',      icon: FileText },
  { id: 'design',     label: 'Design',     icon: Palette },
];
const TABS_EN = [
  { id: 'entreprise', label: 'Company',   icon: Building2 },
  { id: 'client',     label: 'Client',    icon: Users },
  { id: 'details',    label: 'Details',   icon: ClipboardList },
  { id: 'prestations',label: 'Services',  icon: Package },
  { id: 'notes',      label: 'Notes',     icon: FileText },
  { id: 'design',     label: 'Design',    icon: Palette },
];

export default function InvoiceEditor() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('entreprise');
  const [mobilePanel, setMobilePanel] = useState('form'); // 'form' | 'preview'
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [saving, setSaving] = useState(false);

  const [company, setCompany] = useState(INITIAL_COMPANY);
  const [client, setClient] = useState(INITIAL_CLIENT);
  const [details, setDetails] = useState(INITIAL_DETAILS);
  const [sections, setSections] = useState([{ title: '', items: [{ ...EMPTY_ITEM }] }]);
  const [extras, setExtras] = useState({ labour: 0, extra: 0, discount: 0, taxRate: 19.25 });
  const [notes, setNotes] = useState({ conditions: '', footer: '' });
  const [design, setDesign] = useState(INITIAL_DESIGN);

  const TABS = lang === 'fr' ? TABS_FR : TABS_EN;

  useEffect(() => {
    api.get('/clients', { params: { limit: 200 } }).then(r => setClients(r.data.clients || []));
    api.get('/catalog').then(r => setCatalog(r.data || []));
  }, []);

  const handleStampClick = (x, y) => {
    setDesign(d => ({ ...d, stamp: { ...d.stamp, x, y, placing: false } }));
    toast.success(lang === 'fr' ? 'Tampon positionné !' : 'Stamp positioned!');
  };

  const handleSave = async () => {
    if (!client.id) return toast.error(lang === 'fr' ? 'Sélectionnez un client depuis le CRM (onglet Client)' : 'Select a client from CRM (Client tab)');
    const allItems = sections.flatMap(s => s.items.filter(i => i.description?.trim()));
    if (!allItems.length) return toast.error(lang === 'fr' ? 'Ajoutez au moins une prestation' : 'Add at least one service');
    setSaving(true);
    try {
      await api.post('/invoices', {
        clientId: client.id,
        templateType: design.template, language: details.language,
        taxRate: Number(extras.taxRate), discount: Number(extras.discount),
        currency: details.currency, dueDate: details.dueDate || null,
        notes: notes.conditions, footer: notes.footer,
        items: allItems.map(i => ({
          description: i.description,
          quantity: Number(parseFloat(i.qty) || 1),
          unitPrice: Number(parseFloat(i.unitPrice) || 0),
        })),
      });
      toast.success(lang === 'fr' ? 'Facture créée !' : 'Invoice created!');
      navigate('/invoices');
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleExportPDF = () => {
    const allItems = sections.flatMap(s => s.items.map(i => ({
      description: i.description || '—', quantity: parseFloat(i.qty) || 1,
      unitPrice: parseFloat(i.unitPrice) || 0,
      total: (parseFloat(i.qty) || 1) * (parseFloat(i.unitPrice) || 0),
    })));
    const sub = allItems.reduce((s, i) => s + i.total, 0);
    const disc = parseFloat(extras.discount) || 0, tax = parseFloat(extras.taxRate) || 0;
    const taxAmt = (sub - disc) * tax / 100;
    exportInvoicePDF({
      number: details.number || `${new Date().getFullYear()}-APERÇU`,
      templateType: design.template, language: details.language, currency: details.currency,
      issueDate: new Date(), dueDate: details.dueDate ? new Date(details.dueDate) : null,
      subtotal: sub, taxRate: tax, taxAmount: taxAmt, discount: disc, total: sub - disc + taxAmt,
      notes: notes.conditions,
      client: { name: client.name || 'Client', email: client.email, phone: client.phone },
      items: allItems,
    }, details.language);
  };

  const previewNode = (
    <div style={{ flex: 1, overflowY: 'auto', background: '#cbd5e1', padding: isMobile ? '12px 8px' : '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {design.stamp.placing && (
        <div style={{ background: '#22c55e', color: 'white', padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
          🖋 {lang === 'fr' ? 'Cliquez pour placer le tampon' : 'Click to place stamp'}
        </div>
      )}
      <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        👁 {lang === 'fr' ? 'Aperçu temps réel' : 'Live Preview'}
      </div>
      {/* Scale down on mobile */}
      <div style={{ transform: isMobile ? `scale(${Math.min(1, (window.innerWidth - 16) / 595)})` : 'none', transformOrigin: 'top center', marginBottom: isMobile ? `-${842 * (1 - Math.min(1, (window.innerWidth - 16) / 595))}px` : 0 }}>
        <InvoicePreview company={company} client={client} details={details} sections={sections} extras={extras} notes={notes} design={design} onStampClick={handleStampClick} />
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', paddingBottom: 16 }}>A4 · {design.font}</div>
    </div>
  );

  const formNode = (
    <div style={{ width: isMobile ? '100%' : 380, display: 'flex', flexDirection: 'column', borderRight: isMobile ? 'none' : '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0, height: isMobile ? '100%' : 'auto' }}>
      {/* Top bar */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button className="btn-icon" onClick={() => navigate('/invoices')}><ArrowLeft size={16} /></button>
        <span style={{ flex: 1, fontWeight: 800, fontSize: isMobile ? 14 : 15, fontFamily: 'Inter,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {design.docTitle}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={handleExportPDF} style={{ padding: '5px 8px' }}><Download size={13} /></button>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{ padding: '5px 10px' }}>
          <Save size={13} />{saving ? '...' : (lang === 'fr' ? 'Créer' : 'Save')}
        </button>
        {isMobile && (
          <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={() => setMobilePanel(p => p === 'form' ? 'preview' : 'form')}>
            <Eye size={13} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: isMobile ? '8px 2px' : '9px 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            fontSize: isMobile ? 8 : 9.5, fontWeight: 600,
            color: tab === id ? 'var(--primary)' : 'var(--text-muted)',
            background: 'transparent', border: 'none', cursor: 'pointer', minWidth: isMobile ? 44 : 52,
            borderBottom: tab === id ? '2px solid var(--primary)' : '2px solid transparent',
            textTransform: 'uppercase', letterSpacing: '0.02em', transition: 'all 0.15s',
          }}>
            <Icon size={isMobile ? 13 : 15} />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {tab === 'entreprise'  && <EntrepriseTab company={company} setCompany={setCompany} />}
        {tab === 'client'      && <ClientTab client={client} setClient={setClient} clients={clients} />}
        {tab === 'details'     && <DetailsTab details={details} setDetails={setDetails} />}
        {tab === 'prestations' && <PrestationsTab sections={sections} setSections={setSections} catalog={catalog} extras={extras} setExtras={setExtras} />}
        {tab === 'notes'       && <NotesTab notes={notes} setNotes={setNotes} />}
        {tab === 'design'      && <DesignTab design={design} setDesign={setDesign} />}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: 'calc(100vh - 64px)', overflow: 'hidden', margin: '-28px', background: 'var(--bg)' }}>
      {isMobile ? (
        mobilePanel === 'form' ? formNode : previewNode
      ) : (
        <>{formNode}{previewNode}</>
      )}
    </div>
  );
}
