import { PALETTES, FONTS, TEMPLATES, WATERMARK_STYLES, WATERMARK_POSITIONS, CURRENCIES, PAYMENT_METHODS, UNITS, EMPTY_SECTION, EMPTY_ITEM } from './editorConstants';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

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
  const set = (k, v) => setCompany(c => ({ ...c, [k]: v }));
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('logo', ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--bg3)', borderRadius: 10, marginBottom: 4 }}>
        <img src={company.logo} alt="Logo" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '2px solid var(--primary)' }} onError={e => e.target.style.display='none'} />
        <div>
          <label className="form-label" style={{ margin: 0 }}>Logo entreprise</label>
          <input type="file" accept="image/*" onChange={handleLogo} style={{ fontSize: 11, marginTop: 4, display: 'block' }} />
        </div>
      </div>
      {[['name','Nom entreprise *'], ['activity','Activité'], ['address','Adresse'], ['city','Ville'], ['country','Pays'], ['phone','Téléphone'], ['email','Email'], ['taxId','N° fiscal / RCCM']].map(([k, lbl]) => (
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
  const set = (k, v) => setClient(c => ({ ...c, [k]: v }));
  const handleSelect = (e) => {
    const c = clients.find(x => x.id === e.target.value);
    if (c) setClient({ name: c.name, address: c.address || '', city: c.city || '', phone: c.phone || '', email: c.email || '' });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Importer depuis CRM</label>
        <select className="form-control" onChange={handleSelect} defaultValue="">
          <option value="">— Choisir un client existant —</option>
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
  const set = (k, v) => setDetails(d => ({ ...d, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Numéro</label>
        <input className="form-control" placeholder="Auto-généré" value={details.number} onChange={e => set('number', e.target.value)} />
      </div>
      <div className="grid-2" style={{ gap: 10 }}>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Date</label><input type="date" className="form-control" value={details.date} onChange={e => set('date', e.target.value)} /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Validité (jours)</label><input type="number" className="form-control" value={details.validity} onChange={e => set('validity', e.target.value)} /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Échéance</label><input type="date" className="form-control" value={details.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Référence</label><input className="form-control" value={details.reference} onChange={e => set('reference', e.target.value)} /></div>
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Mode de paiement</label>
        <select className="form-control" value={details.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
          {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Devise</label>
        <select className="form-control" value={details.currency} onChange={e => set('currency', e.target.value)}>
          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Langue du document</label>
        <select className="form-control" value={details.language} onChange={e => set('language', e.target.value)}>
          <option value="fr">Français</option><option value="en">English</option>
        </select>
      </div>
    </div>
  );
}

// ---------- TAB: Prestations ----------
export function PrestationsTab({ sections, setSections, catalog, extras, setExtras }) {
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
            <input className="form-control" style={{ flex: 1, padding: '4px 8px', fontSize: 13, fontWeight: 600 }} placeholder="Titre de section (optionnel)" value={sec.title} onChange={e => setSectionTitle(si, e.target.value)} />
            <button className="btn-icon" onClick={() => removeSection(si)} style={{ color: 'var(--danger)' }}><Trash2 size={13}/></button>
          </div>
          {!collapsed[si] && (
            <div style={{ padding: '10px 12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 90px 28px', gap: 4, marginBottom: 4 }}>
                {['Description','Unité','Qté','Prix unit.',''].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</div>)}
              </div>
              {sec.items.map((item, ii) => (
                <div key={ii} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 90px 28px', gap: 4, marginBottom: 4, alignItems: 'center' }}>
                  <input className="form-control" style={{ padding: '5px 8px', fontSize: 12 }} value={item.description} onChange={e => setItemField(si, ii, 'description', e.target.value)} placeholder="Prestation..." />
                  <select className="form-control" style={{ padding: '5px 4px', fontSize: 11 }} value={item.unit} onChange={e => setItemField(si, ii, 'unit', e.target.value)}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                  <input type="number" className="form-control" style={{ padding: '5px 6px', fontSize: 12 }} min="0" value={item.qty} onChange={e => setItemField(si, ii, 'qty', e.target.value)} />
                  <input type="number" className="form-control" style={{ padding: '5px 6px', fontSize: 12 }} min="0" value={item.unitPrice} onChange={e => setItemField(si, ii, 'unitPrice', e.target.value)} />
                  <button className="btn-icon" onClick={() => removeItem(si, ii)}><Trash2 size={12} style={{ color: 'var(--danger)' }}/></button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, marginTop: 4 }} onClick={() => addItem(si)}><Plus size={11}/>Ajouter une ligne</button>
            </div>
          )}
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginBottom: 12 }} onClick={addSection}><Plus size={13}/>Ajouter une section</button>

      {catalog.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Catalogue rapide</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {catalog.map(c => (
              <button key={c.id} className="btn btn-ghost btn-sm" style={{ fontSize: 10 }}
                onClick={() => setSections(s => { const copy = [...s]; if (!copy.length) copy.push({ title: '', items: [] }); copy[copy.length-1].items.push({ description: c.name, unit: 'Unité', qty: 1, unitPrice: c.unitPrice }); return copy; })}>
                + {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main-d'oeuvre & frais supplémentaires */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Ajustements</div>
        {[['labour',"Main-d'œuvre (FCFA)"], ['extra','Frais supplémentaires (FCFA)'], ['discount','Remise (FCFA)'], ['taxRate','TVA (%)']].map(([k, lbl]) => (
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Conditions et notes</label>
        <textarea className="form-control" rows={5} placeholder="Conditions de paiement, délais, garanties..." value={notes.conditions} onChange={e => setNotes(n => ({ ...n, conditions: e.target.value }))} />
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Note de bas de page</label>
        <textarea className="form-control" rows={2} placeholder="Merci de votre confiance..." value={notes.footer} onChange={e => setNotes(n => ({ ...n, footer: e.target.value }))} />
      </div>
    </div>
  );
}

// ---------- TAB: Design ----------
export function DesignTab({ design, setDesign }) {
  const set = (k, v) => setDesign(d => ({ ...d, [k]: v }));
  const setWm = (k, v) => setDesign(d => ({ ...d, watermark: { ...d.watermark, [k]: v } }));
  const setStamp = (k, v) => setDesign(d => ({ ...d, stamp: { ...d.stamp, [k]: v } }));

  const handleStampFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setStamp('image', ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Document settings */}
      <Section title="Document">
        <div className="form-group" style={{ margin: '0 0 10px' }}>
          <label className="form-label">Titre principal du document</label>
          <input className="form-control" value={design.docTitle} onChange={e => set('docTitle', e.target.value)} placeholder="FACTURE, DEVIS, PROFORMA..." />
        </div>
        <div className="form-group" style={{ margin: '0 0 10px' }}>
          <label className="form-label">Style de modèle</label>
          <select className="form-control" value={design.template} onChange={e => set('template', e.target.value)}>
            {Object.entries(TEMPLATES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: '0 0 10px' }}>
          <label className="form-label">Police</label>
          <select className="form-control" value={design.font} onChange={e => set('font', e.target.value)}>
            {FONTS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
      </Section>

      {/* Palette */}
      <Section title="🎨 Palette de couleurs">
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
      <Section title="🖼️ Filigrane personnalisé">
        <div className="form-group" style={{ margin: '0 0 10px' }}>
          <label className="form-label">Type</label>
          <select className="form-control" value={design.watermark.type} onChange={e => setWm('type', e.target.value)}>
            <option value="none">Aucun</option>
            <option value="text">Texte</option>
            <option value="image">Image</option>
          </select>
        </div>
        {design.watermark.type === 'text' && <>
          <div className="form-group" style={{ margin: '0 0 10px' }}>
            <label className="form-label">Texte</label>
            <input className="form-control" value={design.watermark.text} onChange={e => setWm('text', e.target.value)} placeholder="ex: BROUILLON, PAYÉ, CONFIDENTIEL..." />
          </div>
          <div className="form-group" style={{ margin: '0 0 10px' }}>
            <label className="form-label">Style</label>
            <select className="form-control" value={design.watermark.style} onChange={e => setWm('style', e.target.value)}>
              {WATERMARK_STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </>}
        {design.watermark.type !== 'none' && <>
          <div className="form-group" style={{ margin: '0 0 10px' }}>
            <label className="form-label">Position</label>
            <select className="form-control" value={design.watermark.position} onChange={e => setWm('position', e.target.value)}>
              {WATERMARK_POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <Slider label="Taille" value={design.watermark.size} onChange={v => setWm('size', v)} min={20} max={200} unit="px" />
          <Slider label="Opacité" value={design.watermark.opacity} onChange={v => setWm('opacity', v)} />
        </>}
      </Section>

      {/* Tampon */}
      <Section title="🖋️ Tampon personnalisé">
        <div className="form-group" style={{ margin: '0 0 10px' }}>
          <label className="form-label">Image du tampon <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(PNG recommandé 150×150px)</span></label>
          <input type="file" accept="image/*" onChange={handleStampFile} />
        </div>
        {design.stamp.image && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <img src={design.stamp.image} alt="Tampon" style={{ width: design.stamp.size * 0.6, height: design.stamp.size * 0.6, objectFit: 'contain', opacity: design.stamp.opacity / 100, border: '1px dashed var(--border)', borderRadius: 8 }} />
          </div>
        )}
        <Slider label="Taille du tampon" value={design.stamp.size} onChange={v => setStamp('size', v)} min={50} max={300} unit="px" />
        <Slider label="Opacité du tampon" value={design.stamp.opacity} onChange={v => setStamp('opacity', v)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${design.stamp.placing ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, fontSize: 11 }}
            onClick={() => setStamp('placing', !design.stamp.placing)}>
            {design.stamp.placing ? '✓ Mode actif (cliquez sur l\'aperçu)' : 'Positionner le tampon'}
          </button>
          {design.stamp.image && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontSize: 11 }}
              onClick={() => setStamp('image', null)}>Supprimer</button>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
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
