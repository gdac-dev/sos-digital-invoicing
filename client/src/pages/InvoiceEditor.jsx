import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Download, Building2, Users, ClipboardList, Package, FileText, Palette, Eye } from 'lucide-react';
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
  const { id } = useParams(); // present when editing
  const isEditing = Boolean(id);
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('entreprise');
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(isEditing);

  const [company, setCompany] = useState(INITIAL_COMPANY);
  const [client, setClient] = useState(INITIAL_CLIENT);
  const [details, setDetails] = useState(INITIAL_DETAILS);
  const [sections, setSections] = useState([{ title: '', items: [{ ...EMPTY_ITEM }] }]);
  const [extras, setExtras] = useState({ labour: 0, extra: 0, discount: 0, taxRate: 19.25 });
  const [notes, setNotes] = useState({ conditions: '', footer: '' });
  const [design, setDesign] = useState(INITIAL_DESIGN);

  const TABS = lang === 'fr' ? TABS_FR : TABS_EN;
  const draftKey = `invoice_draft_${id || 'new'}`;

  // Auto-save to localStorage (debounced, safe)
  const saveTimer = useRef(null);
  useEffect(() => {
    if (loadingInvoice) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        // Exclude large base64 blobs (logo, stamp image) to avoid localStorage quota errors
        const safeCompany = { ...company, logo: company.logo?.startsWith('data:') ? '__b64__' : company.logo };
        const safeDesign = { ...design, stamp: { ...design.stamp, image: design.stamp?.image?.startsWith('data:') ? '__b64__' : design.stamp?.image } };
        const draft = { company: safeCompany, client, details, sections, extras, notes, design: safeDesign };
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch (e) {
        // localStorage quota exceeded – silently ignore
        console.warn('Draft auto-save skipped (storage full):', e.message);
      }
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [company, client, details, sections, extras, notes, design, loadingInvoice, draftKey]);

  // Load draft or reset if new
  useEffect(() => {
    api.get('/clients', { params: { limit: 200 } }).then(r => setClients(r.data.clients || []));
    api.get('/catalog').then(r => setCatalog(r.data || []));

    if (!isEditing) {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.company) {
            // Don't restore the '__b64__' placeholder - keep default logo
            if (parsed.company.logo === '__b64__') delete parsed.company.logo;
            setCompany(c => ({ ...c, ...parsed.company }));
          }
          if (parsed.client) setClient(parsed.client);
          if (parsed.details) setDetails(parsed.details);
          if (parsed.sections) setSections(parsed.sections);
          if (parsed.extras) setExtras(parsed.extras);
          if (parsed.notes) setNotes(parsed.notes);
          if (parsed.design) {
            // Don't restore the '__b64__' placeholder for stamp image
            if (parsed.design.stamp?.image === '__b64__') delete parsed.design.stamp.image;
            setDesign(d => ({ ...d, ...parsed.design }));
          }
        } catch (e) { console.error('Failed to parse draft', e); }
      }
    }
  }, [isEditing, draftKey]);

  // Load existing invoice when editing
  useEffect(() => {
    if (!isEditing) return;
    api.get(`/invoices/${id}`)
      .then(r => {
        const inv = r.data;
        setClient({ id: inv.clientId, name: inv.client?.name || '', email: inv.client?.email || '', phone: inv.client?.phone || '', address: inv.client?.address || '', city: inv.client?.city || '' });
        if (inv.companyData) setCompany(c => ({ ...c, ...inv.companyData }));
        setDetails(d => ({
          ...d,
          number: inv.number || '',
          date: inv.issueDate ? inv.issueDate.split('T')[0] : d.date,
          dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : '',
          currency: inv.currency || 'FCFA',
          language: inv.language || 'fr',
        }));
        setExtras(e => ({
          ...e,
          taxRate: inv.taxRate ?? 19.25,
          discount: inv.discount ?? 0,
          labour: inv.labour ?? 0,
          extra: inv.extra ?? 0,
        }));
        setNotes({ conditions: inv.notes || '', footer: inv.footer || '' });
        setDesign(d => ({ 
          ...d, 
          template: inv.templateType || 'elegant', 
          palette: inv.palette || 'skyblue',
          font: inv.font || 'Inter',
          watermark: inv.watermark || d.watermark,
          stamp: inv.stamp || d.stamp
        }));
        // Group flat items back into sections based on sectionTitle
        const loadedSections = [];
        let currentSection = null;
        for (const i of (inv.items || [])) {
          const st = i.sectionTitle || '';
          if (!currentSection || currentSection.title !== st) {
            currentSection = { title: st, items: [] };
            loadedSections.push(currentSection);
          }
          currentSection.items.push({
            description: i.description || '',
            unit: i.unit || 'Unité',
            qty: i.quantity ?? 1,
            unitPrice: i.unitPrice ?? 0,
          });
        }
        if (!loadedSections.length) loadedSections.push({ title: '', items: [{ ...EMPTY_ITEM }] });
        setSections(loadedSections);
      })
      .catch(() => toast.error(lang === 'fr' ? 'Facture introuvable' : 'Invoice not found'))
      .finally(() => setLoadingInvoice(false));
  }, [id, isEditing]);

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
      const payload = {
        clientId: client.id,
        companyData: company,
        templateType: design.template, palette: design.palette, language: details.language,
        font: design.font, watermark: design.watermark, stamp: design.stamp,
        taxRate: Number(extras.taxRate), discount: Number(extras.discount),
        labour: Number(extras.labour), extra: Number(extras.extra),
        currency: details.currency, dueDate: details.dueDate || null,
        notes: notes.conditions, footer: notes.footer,
        items: sections.flatMap(s => 
          s.items
            .filter(i => i.description?.trim())
            .map(i => ({
              sectionTitle: s.title || '',
              description: i.description,
              quantity: Number(parseFloat(i.qty) || 1),
              unitPrice: Number(parseFloat(i.unitPrice) || 0),
            }))
        ),
      };
      if (isEditing) {
        await api.patch(`/invoices/${id}`, payload);
        toast.success(lang === 'fr' ? 'Facture mise à jour !' : 'Invoice updated!');
      } else {
        await api.post('/invoices', payload);
        toast.success(lang === 'fr' ? 'Facture créée !' : 'Invoice created!');
      }
      localStorage.removeItem(draftKey);
      navigate('/invoices');
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleExportPDF = () => {
    exportInvoicePDF(document.getElementById('invoice-preview-container'), {
      number: details.number || `${new Date().getFullYear()}-XXXX`,
    });
  };

  if (loadingInvoice) return (
    <div className="loader" style={{ height: '60vh' }}>
      <div className="loader-dot"/><div className="loader-dot"/><div className="loader-dot"/>
    </div>
  );

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
      <div id="invoice-preview-container" style={{ transform: isMobile ? `scale(${Math.min(1, (window.innerWidth - 16) / 595)})` : 'none', transformOrigin: 'top center', marginBottom: isMobile ? `-${842 * (1 - Math.min(1, (window.innerWidth - 16) / 595))}px` : 0 }}>
        <InvoicePreview company={company} client={client} details={details} sections={sections} extras={extras} notes={notes} design={design} onStampClick={handleStampClick} />
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', paddingBottom: 16 }}>A4 · {design.font}</div>
    </div>
  );

  const formNode = (
    <div style={{ width: isMobile ? '100%' : 380, display: 'flex', flexDirection: 'column', borderRight: isMobile ? 'none' : '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 }}>
      {/* Top bar */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button className="btn-icon" onClick={() => navigate('/invoices')}><ArrowLeft size={16} /></button>
        <span style={{ flex: 1, fontWeight: 800, fontSize: isMobile ? 14 : 15, fontFamily: 'Inter,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isEditing ? (lang === 'fr' ? `Modifier ${details.number || ''}` : `Edit ${details.number || ''}`) : design.docTitle}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={handleExportPDF} style={{ padding: '5px 8px' }}><Download size={13} /></button>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{ padding: '5px 10px' }}>
          <Save size={13} />{saving ? '...' : (isEditing ? (lang === 'fr' ? 'Mettre à jour' : 'Update') : (lang === 'fr' ? 'Créer' : 'Save'))}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setTab(tabId)} style={{
            flex: 1, padding: isMobile ? '8px 2px' : '9px 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            fontSize: isMobile ? 8 : 9.5, fontWeight: 600,
            color: tab === tabId ? 'var(--primary)' : 'var(--text-muted)',
            background: 'transparent', border: 'none', cursor: 'pointer', minWidth: isMobile ? 44 : 52,
            borderBottom: tab === tabId ? '2px solid var(--primary)' : '2px solid transparent',
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
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : 'calc(100vh - 64px)', minHeight: 'calc(100vh - 64px)', overflow: isMobile ? 'visible' : 'hidden', margin: isMobile ? '-16px' : '-28px', background: 'var(--bg)' }}>
      {formNode}
      {previewNode}
    </div>
  );
}
