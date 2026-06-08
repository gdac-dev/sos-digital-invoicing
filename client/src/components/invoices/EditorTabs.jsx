import { PALETTES, FONTS, TEMPLATES, WATERMARK_STYLES, WATERMARK_POSITIONS, CURRENCIES, PAYMENT_METHODS, UNITS, EMPTY_SECTION, EMPTY_ITEM } from './editorConstants';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '../../context/LangContext';

// Reusable slider
const Slider = ({ label, value, onChange, min = 0, max = 100, unit = '%' }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <label className="form-label" style={{ margin: 0 }}>{label}</label>
      <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} />
  </div>
);

// ---------- TAB: Entreprise ----------
export function EntrepriseTab({ company, setCompany }) {
  const { lang } = useLang();
  const set = (k, v) => setCompany(c => ({ ...c, [k]: v }));
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 200x200 and compress as JPEG to keep data small
        const MAX = 200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        set('logo', compressed);
      };
      img.onerror = () => {
        // If Image() can't decode it (e.g. some exotic format), use raw base64 anyway
        set('logo', ev.target.result);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--bg3)', borderRadius: 10, marginBottom: 4 }}>
        <img src={company.logo} alt="Logo" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '2px solid var(--primary)' }} onError={e => e.target.style.display='none'} />
        <div>
          <label className="form-label" style={{ margin: 0 }}>{lang === 'fr' ? 'Logo entreprise' : 'Company logo'}</label>
          <input type="file" accept="image/*" onChange={handleLogo} style={{ fontSize: 11, marginTop: 4, display: 'block' }} />
        </div>
      </div>
      {[['name', lang === 'fr' ? 'Nom entreprise *' : 'Company Name *'], ['activity', lang === 'fr' ? 'Activité' : 'Activity'], ['address', lang === 'fr' ? 'Adresse' : 'Address'], ['city', lang === 'fr' ? 'Ville' : 'City'], ['country', lang === 'fr' ? 'Pays' : 'Country'], ['phone', lang === 'fr' ? 'Téléphone' : 'Phone'], ['email', 'Email'], ['taxId', lang === 'fr' ? 'N° fiscal / RCCM' : 'Tax ID / RCCM']].map(([k, lbl]) => (
        <div key={k} className="form-group" style={{ margin: 0 }}>
          <label className="form-label">{lbl}</label>
          <input className="form-control" value={company[k] || ''} onChange={e => set(k, e.target.value)} />
        </div>
      ))}
    </div>
  );
}

// ---------- TAB: Client ----------
export function ClientTab({ client, setClient, clients }) {
  const { lang } = useLang();
  const set = (k, v) => setClient(c => ({ ...c, [k]: v }));
  const handleSelect = (e) => {
    const c = clients.find(x => x.id === e.target.value);
    if (c) setClient({ id: c.id, name: c.name, address: c.address || '', city: c.city || '', phone: c.phone || '', email: c.email || '' });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">{lang === 'fr' ? 'Importer depuis CRM' : 'Import from CRM'}</label>
        <select className="form-control" onChange={handleSelect} defaultValue="">
          <option value="">{lang === 'fr' ? '— Choisir un client existant —' : '— Select existing client —'}</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
        </select>
      </div>
      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
      {[['name','Nom / Raison sociale *'], ['address','Adresse'], ['city','Ville'], ['phone','Téléphone'], ['email','Email']].map(([k, lbl]) => (
        <div key={k} className="form-group" style={{ margin: 0 }}>
          <label className="form-label">{lbl}</label>
          <input className="form-control" value={client[k] || ''} onChange={e => set(k, e.target.value)} />
        </div>
      ))}
    </div>
  );
}

// ---------- TAB: Détails ----------
export function DetailsTab({ details, setDetails }) {
  const { lang } = useLang();
  const set = (k, v) => setDetails(d => ({ ...d, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">{lang === 'fr' ? 'Numéro' : 'Number'}</label>
        <input className="form-control" placeholder={lang === 'fr' ? 'Auto-généré' : 'Auto-generated'} value={details.number} onChange={e => set('number', e.target.value)} />
      </div>
      <div className="grid-2" style={{ gap: 10 }}>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">{lang === 'fr' ? 'Date' : 'Date'}</label><input type="date" className="form-control" value={details.date} onChange={e => set('date', e.target.value)} /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">{lang === 'fr' ? 'Validité (jours)' : 'Validity (days)'}</label><input type="number" className="form-control" value={details.validity} onChange={e => set('validity', e.target.value)} /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">{lang === 'fr' ? 'Échéance' : 'Due Date'}</label><input type="date" className="form-control" value={details.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">{lang === 'fr' ? 'Référence' : 'Reference'}</label><input className="form-control" value={details.reference} onChange={e => set('reference', e.target.value)} /></div>
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">{lang === 'fr' ? 'Mode de paiement' : 'Payment Method'}</label>
        <select className="form-control" value={details.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
          {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">{lang === 'fr' ? 'Devise' : 'Currency'}</label>
        <select className="form-control" value={details.currency} onChange={e => set('currency', e.target.value)}>
          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">{lang === 'fr' ? 'Langue du document' : 'Document Language'}</label>
        <select className="form-control" value={details.language} onChange={e => set('language', e.target.value)}>
          <option value="fr">Français</option><option value="en">English</option>
        </select>
      </div>
    </div>
  );
}

// ---------- TAB: Prestations ----------
export function PrestationsTab({ sections, setSections, catalog, extras, setExtras }) {
  const { lang } = useLang();
  const [collapsed, setCollapsed] = useState({});

  const addSection = () => setSections(s => [...s, { ...EMPTY_SECTION, title: `Section ${s.length + 1}`, items: [{ ...EMPTY_ITEM }] }]);
  const removeSection = i => setSections(s => s.filter((_, j) => j !== i));
  const setSectionTitle = (i, v) => setSections(s => s.map((sec, j) => j === i ? { ...sec, title: v } : sec));
  const addItem = i => setSections(s => s.map((sec, j) => j === i ? { ...sec, items: [...sec.items, { ...EMPTY_ITEM }] } : sec));
  const removeItem = (si, ii) => setSections(s => s.map((sec, j) => j === si ? { ...sec, items: sec.items.filter((_, k) => k !== ii) } : sec));
  const setItemField = (si, ii, k, v) => setSections(s => s.map((sec, j) => j === si ? { ...sec, items: sec.items.map((it, k2) => k2 === ii ? { ...it, [k]: v } : it) } : sec));

  return (
    <div>
      {sections.map((sec, si) => (
        <div key={si} style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
            <button className="btn-icon" onClick={() => setCollapsed(c => ({ ...c, [si]: !c[si] }))}>
              {collapsed[si] ? <ChevronRight size={14}/> : <ChevronDown size={14}/>}
            </button>
            <input className="form-control" style={{ flex: 1, padding: '4px 8px', fontSize: 13, fontWeight: 600 }} placeholder={lang === 'fr' ? 'Titre de section (optionnel)' : 'Section title (optional)'} value={sec.title} onChange={e => setSectionTitle(si, e.target.value)} />
            <button className="btn-icon" onClick={() => removeSection(si)} style={{ color: 'var(--danger)' }}><Trash2 size={13}/></button>
          </div>
          {!collapsed[si] && (
            <div style={{ padding: '10px 12px' }}>
              {sec.items.map((item, ii) => (
                <div key={ii} style={{ marginBottom: 8, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  {/* Description – full width, multiline */}
                  <textarea
                    className="form-control"
                    rows={2}
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12, resize: 'vertical', marginBottom: 6, boxSizing: 'border-box' }}
                    value={item.description}
                    onChange={e => setItemField(si, ii, 'description', e.target.value)}
                    placeholder={lang === 'fr' ? 'Description de la prestation...' : 'Service description...'}
                  />
                  {/* Unit / Qty / Price / Delete row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 28px', gap: 6, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{lang === 'fr' ? 'Unité' : 'Unit'}</div>
                      <select className="form-control" style={{ padding: '5px 4px', fontSize: 11 }} value={item.unit} onChange={e => setItemField(si, ii, 'unit', e.target.value)}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{lang === 'fr' ? 'Qté' : 'Qty'}</div>
                      <input type="number" className="form-control" style={{ padding: '5px 6px', fontSize: 12 }} min="0" value={item.qty} onChange={e => setItemField(si, ii, 'qty', e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{lang === 'fr' ? 'Prix unit.' : 'Unit price'}</div>
                      <input type="number" className="form-control" style={{ padding: '5px 6px', fontSize: 12 }} min="0" value={item.unitPrice} onChange={e => setItemField(si, ii, 'unitPrice', e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                      <button className="btn-icon" onClick={() => removeItem(si, ii)}><Trash2 size={12} style={{ color: 'var(--danger)' }}/></button>
                    </div>
                  </div>
                  {/* Line total */}
                  <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
                    = {((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString('fr-FR')} {lang === 'fr' ? 'FCFA' : 'FCFA'}
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, marginTop: 4, width: '100%' }} onClick={() => addItem(si)}><Plus size={11}/>{lang === 'fr' ? '+ Ajouter une ligne' : '+ Add line'}</button>
            </div>
          )}
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginBottom: 12 }} onClick={addSection}><Plus size={13}/>{lang === 'fr' ? 'Ajouter une section' : 'Add section'}</button>

      {catalog.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{lang === 'fr' ? 'Catalogue rapide' : 'Quick catalog'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {catalog.map(c => (
              <button key={c.id} className="btn btn-ghost btn-sm" style={{ fontSize: 10 }}
                onClick={() => setSections(s => {
                  const copy = [...s];
                  if (!copy.length) {
                    copy.push({ title: '', items: [{ description: c.name, unit: 'Unité', qty: 1, unitPrice: c.unitPrice }] });
                  } else {
                    const lastIdx = copy.length - 1;
                    copy[lastIdx] = { 
                      ...copy[lastIdx], 
                      items: [...copy[lastIdx].items, { description: c.name, unit: 'Unité', qty: 1, unitPrice: c.unitPrice }] 
                    };
                  }
                  return copy;
                })}>
                + {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Adjustments */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{lang === 'fr' ? 'Ajustements' : 'Adjustments'}</div>
        {(lang === 'fr' ? [['labour',"Main-d'œuvre (FCFA)"],['extra','Frais supplémentaires (FCFA)'],['discount','Remise (FCFA)'],['taxRate','TVA (%)']] : [['labour','Labour (FCFA)'],['extra','Extra charges (FCFA)'],['discount','Discount (FCFA)'],['taxRate','VAT (%)']]).map(([k, lbl]) => (
          <div key={k} className="form-group" style={{ margin: '0 0 8px' }}>
            <label className="form-label">{lbl}</label>
            <input type="number" className="form-control" min="0" value={extras[k] || 0} onChange={e => setExtras(ex => ({ ...ex, [k]: parseFloat(e.target.value) || 0 }))} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- TAB: Notes ----------
export function NotesTab({ notes, setNotes }) {
  const { lang } = useLang();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">{lang === 'fr' ? 'Conditions et notes' : 'Terms and notes'}</label>
        <textarea className="form-control" rows={5} placeholder={lang === 'fr' ? 'Conditions de paiement, délais, garanties...' : 'Payment terms, deadlines, warranties...'} value={notes.conditions} onChange={e => setNotes(n => ({ ...n, conditions: e.target.value }))} />
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">{lang === 'fr' ? 'Note de bas de page' : 'Footer note'}</label>
        <textarea className="form-control" rows={2} placeholder={lang === 'fr' ? 'Merci de votre confiance...' : 'Thank you for your business...'} value={notes.footer} onChange={e => setNotes(n => ({ ...n, footer: e.target.value }))} />
      </div>
    </div>
  );
}

// ---------- TAB: Design ----------
export function DesignTab({ design, setDesign }) {
  const { lang } = useLang();
  const set = (k, v) => setDesign(d => ({ ...d, [k]: v }));
  const setWm = (k, v) => setDesign(d => ({ ...d, watermark: { ...d.watermark, [k]: v } }));
  const setStamp = (k, v) => setDesign(d => ({ ...d, stamp: { ...d.stamp, [k]: v } }));

  const handleStampFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        setStamp('image', canvas.toDataURL('image/png', 0.9));
      };
      img.onerror = () => setStamp('image', ev.target.result);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Document settings */}
      <Section title="Document">
        <div className="form-group" style={{ margin: '0 0 10px' }}>
          <label className="form-label">{lang === 'fr' ? 'Titre principal du document' : 'Document main title'}</label>
          <input className="form-control" value={design.docTitle} onChange={e => set('docTitle', e.target.value)} placeholder="FACTURE, DEVIS, PROFORMA..." />
        </div>
        <div className="form-group" style={{ margin: '0 0 10px' }}>
          <label className="form-label">{lang === 'fr' ? 'Style de modèle' : 'Template style'}</label>
          <select className="form-control" value={design.template} onChange={e => set('template', e.target.value)}>
            {Object.entries(TEMPLATES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: '0 0 10px' }}>
          <label className="form-label">{lang === 'fr' ? 'Police' : 'Font'}</label>
          <select className="form-control" value={design.font} onChange={e => set('font', e.target.value)}>
            {FONTS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
      </Section>

      {/* Palette */}
      <Section title={lang === 'fr' ? '🎨 Palette de couleurs' : '🎨 Color palette'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {Object.entries(PALETTES).map(([k, p]) => (
            <button key={k} onClick={() => set('palette', k)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px',
              borderRadius: 8, border: `2px solid ${design.palette === k ? p.primary : 'var(--border)'}`,
              background: design.palette === k ? `${p.primary}15` : 'transparent', cursor: 'pointer',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.primary, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: design.palette === k ? p.primary : 'var(--text-muted)' }}>{p.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Filigrane */}
      <Section title={lang === 'fr' ? '🖼️ Filigrane personnalisé' : '🖼️ Custom watermark'}>
        <div className="form-group" style={{ margin: '0 0 10px' }}>
          <label className="form-label">{lang === 'fr' ? 'Type' : 'Type'}</label>
          <select className="form-control" value={design.watermark.type} onChange={e => setWm('type', e.target.value)}>
            <option value="none">{lang === 'fr' ? 'Aucun' : 'None'}</option>
            <option value="text">{lang === 'fr' ? 'Texte' : 'Text'}</option>
            <option value="image">Image</option>
          </select>
        </div>
        {design.watermark.type === 'text' && <>
          <div className="form-group" style={{ margin: '0 0 10px' }}>
            <label className="form-label">{lang === 'fr' ? 'Texte' : 'Text'}</label>
            <input className="form-control" value={design.watermark.text} onChange={e => setWm('text', e.target.value)} placeholder={lang === 'fr' ? 'ex: BROUILLON, PAYÉ, CONFIDENTIEL...' : 'ex: DRAFT, PAID, CONFIDENTIAL...'} />
          </div>
          <div className="form-group" style={{ margin: '0 0 10px' }}>
            <label className="form-label">{lang === 'fr' ? 'Style' : 'Style'}</label>
            <select className="form-control" value={design.watermark.style} onChange={e => setWm('style', e.target.value)}>
              {WATERMARK_STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </>}
        {design.watermark.type !== 'none' && <>
          <div className="form-group" style={{ margin: '0 0 10px' }}>
            <label className="form-label">{lang === 'fr' ? 'Position' : 'Position'}</label>
            <select className="form-control" value={design.watermark.position} onChange={e => setWm('position', e.target.value)}>
              {WATERMARK_POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <Slider label={lang === 'fr' ? 'Taille' : 'Size'} value={design.watermark.size} onChange={v => setWm('size', v)} min={20} max={200} unit="px" />
          <Slider label={lang === 'fr' ? 'Opacité' : 'Opacity'} value={design.watermark.opacity} onChange={v => setWm('opacity', v)} />
        </>}
      </Section>

      {/* Tampon */}
      <Section title={lang === 'fr' ? '🖋️ Tampon personnalisé' : '🖋️ Custom stamp'}>
        <div className="form-group" style={{ margin: '0 0 10px' }}>
          <label className="form-label">{lang === 'fr' ? 'Image du tampon' : 'Stamp image'} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(PNG 150×150px)</span></label>
          <input type="file" accept="image/*" onChange={handleStampFile} />
        </div>
        {design.stamp.image && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <img src={design.stamp.image} alt="Tampon" style={{ width: design.stamp.size * 0.6, height: design.stamp.size * 0.6, objectFit: 'contain', opacity: design.stamp.opacity / 100, border: '1px dashed var(--border)', borderRadius: 8 }} />
          </div>
        )}
        <Slider label={lang === 'fr' ? 'Taille du tampon' : 'Stamp size'} value={design.stamp.size} onChange={v => setStamp('size', v)} min={50} max={300} unit="px" />
        <Slider label={lang === 'fr' ? 'Opacité du tampon' : 'Stamp opacity'} value={design.stamp.opacity} onChange={v => setStamp('opacity', v)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${design.stamp.placing ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, fontSize: 11 }}
            onClick={() => setStamp('placing', !design.stamp.placing)}>
            {design.stamp.placing ? (lang === 'fr' ? '✓ Mode actif (cliquez sur l\'aperçu)' : '✓ Active (click on preview)') : (lang === 'fr' ? 'Positionner le tampon' : 'Position stamp')}
          </button>
          {design.stamp.image && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontSize: 11 }}
              onClick={() => setStamp('image', null)}>{lang === 'fr' ? 'Supprimer' : 'Remove'}</button>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', background: 'transparent', color: 'var(--text)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', border: 'none' }}>
        {title}{open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
      </button>
      {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
    </div>
  );
}
