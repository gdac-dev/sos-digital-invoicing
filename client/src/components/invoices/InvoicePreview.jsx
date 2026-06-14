import { PALETTES } from './editorConstants';
import { QRCodeSVG } from 'qrcode.react';

const fmt = (n, currency = 'FCFA', locale = 'fr-FR') => `${Number(n || 0).toLocaleString(locale)} ${currency}`;
const fmtN = (n, locale = 'fr-FR') => Number(n || 0).toLocaleString(locale);

const TRANSLATIONS = {
  fr: {
    invoice: 'FACTURE',
    quote: 'DEVIS',
    no: 'N°',
    date: 'Date',
    validity: 'Validité',
    days: 'jours',
    dueDate: 'Échéance',
    billedTo: 'Facturé à',
    reference: 'Référence',
    payment: 'Paiement',
    currency: 'Devise',
    colNo: 'N°',
    colDesc: 'Description',
    colUnit: 'Unité',
    colQty: 'Qté',
    colPrice: 'P.U.',
    colTotal: 'Total',
    subtotal: 'Sous-total',
    totalHT: 'Total HT',
    labour: "Main-d'œuvre",
    extra: 'Frais supplémentaires',
    discount: 'Remise',
    tax: 'TVA',
    totalTTC: 'TOTAL TTC',
    conditions: 'Conditions et notes',
    clientSig: 'Signature client',
    for: 'Pour',
    taxId: 'N° fiscal:',
    contact: 'Contactez-nous'
  },
  en: {
    invoice: 'INVOICE',
    quote: 'QUOTE',
    no: 'No.',
    date: 'Date',
    validity: 'Validity',
    days: 'days',
    dueDate: 'Due Date',
    billedTo: 'Billed to',
    reference: 'Reference',
    payment: 'Payment',
    currency: 'Currency',
    colNo: 'No.',
    colDesc: 'Description',
    colUnit: 'Unit',
    colQty: 'Qty',
    colPrice: 'Price',
    colTotal: 'Total',
    subtotal: 'Subtotal',
    totalHT: 'Subtotal (excl. tax)',
    labour: 'Labour',
    extra: 'Extra charges',
    discount: 'Discount',
    tax: 'Tax',
    totalTTC: 'TOTAL',
    conditions: 'Terms and conditions',
    clientSig: 'Client signature',
    for: 'For',
    taxId: 'Tax ID:',
    contact: 'Contact us'
  }
};

export default function InvoicePreview({ company, client, details, sections, extras, notes, design, onStampClick }) {
  const palette = PALETTES[design.palette] || PALETTES.skyblue;
  const font = design.font || 'Inter';
  const lang = details.language === 'en' ? 'en' : 'fr';
  const t = TRANSLATIONS[lang];
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';

  // Translate default docTitle if matched
  let displayTitle = design.docTitle;
  if (displayTitle === 'FACTURE' && lang === 'en') displayTitle = 'INVOICE';
  if (displayTitle === 'INVOICE' && lang === 'fr') displayTitle = 'FACTURE';
  if (displayTitle === 'DEVIS' && lang === 'en') displayTitle = 'QUOTE';
  if (displayTitle === 'QUOTE' && lang === 'fr') displayTitle = 'DEVIS';

  // Helper: handle both 'qty' (editor) and 'quantity' (database) field names
  const getQty = (item) => parseFloat(item.qty ?? item.quantity) || 0;

  // Compute totals
  const sectionTotals = sections.map(sec =>
    sec.items.reduce((s, i) => s + getQty(i) * (parseFloat(i.unitPrice) || 0), 0)
  );
  const subtotal = sectionTotals.reduce((s, t) => s + t, 0);
  const labour = parseFloat(extras.labour) || 0;
  const extra = parseFloat(extras.extra) || 0;
  const discount = parseFloat(extras.discount) || 0;
  const taxRate = parseFloat(extras.taxRate) || 0;
  const taxBase = subtotal + labour + extra - discount;
  const taxAmount = taxBase * taxRate / 100;
  const total = taxBase + taxAmount;

  // Watermark
  const wm = design?.watermark || { type: 'none', text: '', style: '', position: '', size: 80, opacity: 30 };
  const wmVisible = wm.type !== 'none' && (wm.type === 'image' ? false : wm.text);
  const wmStyle = {
    position: 'absolute', pointerEvents: 'none', zIndex: 10,
    fontSize: wm.size, opacity: wm.opacity / 100,
    color: palette.primary,
    fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
    transform: 'rotate(-35deg)',
    whiteSpace: 'nowrap',
    ...(wm.position === 'Centre de la page' ? { top: '40%', left: '50%', transform: 'translateX(-50%) rotate(-35deg)' } : {}),
    ...(wm.position === 'Haut gauche' ? { top: '10%', left: '5%' } : {}),
    ...(wm.position === 'Bas droite' ? { bottom: '10%', right: '5%' } : {}),
    ...(wm.style === 'Contour' ? { WebkitTextStroke: `2px ${palette.primary}`, color: 'transparent' } : {}),
  };

  const stamp = design?.stamp || { image: null, size: 150, opacity: 100, x: 70, y: 75, placing: false };

  // Template header style
  const isModern = design.template === 'modern';
  const isMinimal = design.template === 'minimal' || design.template === 'minimalist';
  const isClassic = design.template === 'classic';
  const isCorporate = design.template === 'corporate';
  const isElegant = design.template === 'elegant';

  return (
    <div
      onClick={(e) => {
        if (stamp.placing && stamp.image) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          onStampClick(x, y);
        }
      }}
      style={{
        width: 595, maxWidth: '100%', minHeight: 842, background: 'white', position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 48px rgba(0,0,0,0.18)', borderRadius: 3,
        fontFamily: font + ', sans-serif', color: '#0f172a', fontSize: 10.5,
        cursor: stamp.placing ? 'crosshair' : 'default',
      }}
    >
      {/* Watermark */}
      {wmVisible && <div style={wmStyle}>{wm.text}</div>}

      {/* Stamp */}
      {stamp.image && (
        <img src={stamp.image} alt="Tampon" style={{
          position: 'absolute', zIndex: 20, pointerEvents: 'none',
          width: stamp.size, height: stamp.size, objectFit: 'contain',
          opacity: stamp.opacity / 100,
          left: `${stamp.x}%`, top: `${stamp.y}%`,
          transform: 'translate(-50%, -50%)',
        }} />
      )}

      {/* ===== HEADER ===== */}
      {isCorporate ? (
        <div style={{ paddingBottom: 16 }}>
          <div style={{ height: 16, background: palette.primary }} />
          <div style={{ padding: '28px 32px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {company.logo && <img src={company.logo} alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />}
              <div>
                <div style={{ fontWeight: 900, fontSize: 24, color: palette.dark, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{company.name}</div>
                <div style={{ fontSize: 9, color: palette.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>{company.activity}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontSize: 32, color: palette.primary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{displayTitle}</div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>
                {t.no} <span style={{ color: palette.dark }}>{details.number || `${new Date().getFullYear()}-XXXX`}</span>
              </div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                {t.date} : {details.date ? new Date(details.date).toLocaleDateString(locale) : '—'}
              </div>
            </div>
          </div>
          <div style={{ margin: '0 32px', borderBottom: `2px solid #f1f5f9` }} />
        </div>
      ) : isModern ? (
        <div style={{ background: palette.primary, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {company.logo && <img src={company.logo} alt="Logo" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} onError={e => e.target.style.display='none'} />}
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>{company.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9 }}>{company.activity}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px' }}>{displayTitle}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9 }}>{t.no} {details.number || `${new Date().getFullYear()}-XXXX`}</div>
          </div>
        </div>
      ) : isMinimal ? (
        <div style={{ padding: '28px 36px 16px', borderBottom: `2px solid ${palette.primary}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: palette.primary }}>{company.name}</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>{company.activity}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: palette.dark }}>{displayTitle}</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>{t.no} {details.number || `${new Date().getFullYear()}-XXXX`}</div>
            </div>
          </div>
        </div>
      ) : isElegant ? (
        <div style={{ padding: '32px 36px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid #e2e8f0` }}>
          <div>
            <div style={{ fontWeight: 300, fontSize: 32, color: palette.primary, letterSpacing: '2px', textTransform: 'uppercase' }}>{displayTitle}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 8, letterSpacing: '0.5px' }}>{t.no} <strong style={{color: palette.dark}}>{details.number || `${new Date().getFullYear()}-XXXX`}</strong></div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 2, letterSpacing: '0.5px' }}>{t.date} : {details.date ? new Date(details.date).toLocaleDateString(locale) : '—'}</div>
            {details.validity && <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{t.validity} : {details.validity} {t.days}</div>}
            {details.dueDate && <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 600, marginTop: 2 }}>{t.dueDate} : {new Date(details.dueDate).toLocaleDateString(locale)}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
            {company.logo && <img src={company.logo} alt="Logo" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 12 }} onError={e => e.target.style.display='none'} />}
            <div style={{ fontWeight: 700, fontSize: 14, color: palette.dark, letterSpacing: '1px' }}>{company.name}</div>
            <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>{company.activity}</div>
            <div style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>{company.address}{company.city ? `, ${company.city}` : ''}</div>
            <div style={{ fontSize: 8, color: '#64748b' }}>{company.phone} · {company.email}</div>
            {company.taxId && <div style={{ fontSize: 8, color: '#64748b' }}>{t.taxId} {company.taxId}</div>}
          </div>
        </div>
      ) : (
        // Classic
        <div style={{ padding: '24px 32px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {company.logo && (
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${palette.primary}`, flexShrink: 0 }}>
                <img src={company.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: palette.primary }}>{company.name}</div>
              <div style={{ fontSize: 9, color: '#475569' }}>{company.activity}</div>
              <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>{company.address}{company.city ? `, ${company.city}` : ''}</div>
              <div style={{ fontSize: 8.5, color: '#64748b' }}>{company.phone} · {company.email}</div>
              {company.taxId && <div style={{ fontSize: 8.5, color: '#64748b' }}>{t.taxId} {company.taxId}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: palette.dark, letterSpacing: '-0.3px' }}>{displayTitle}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{t.no} {details.number || `${new Date().getFullYear()}-XXXX`}</div>
            <div style={{ fontSize: 9, color: '#475569' }}>{t.date} : {details.date ? new Date(details.date).toLocaleDateString(locale) : '—'}</div>
            {details.validity && <div style={{ fontSize: 9, color: '#475569' }}>{t.validity} : {details.validity} {t.days}</div>}
            {details.dueDate && <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>{t.dueDate} : {new Date(details.dueDate).toLocaleDateString(locale)}</div>}
          </div>
        </div>
      )}

      {/* Color bar (elegant/classic only) */}
      {!isModern && !isMinimal && !isCorporate && <div style={{ height: 4, background: palette.primary, margin: '0 32px' }} />}

      <div style={{ padding: '14px 32px 28px' }}>
        {/* Client + Details row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {/* Client block */}
          <div style={{ flex: 1, background: isCorporate ? '#ffffff' : palette.accent + '44', borderLeft: `3px solid ${palette.primary}`, padding: '12px 16px', borderRadius: isCorporate ? 8 : '0 6px 6px 0', boxShadow: isCorporate ? '0 4px 20px rgba(0,0,0,0.05)' : 'none', border: isCorporate ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ fontSize: 8, fontWeight: 800, color: palette.primary, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>{t.billedTo}</div>
            <div style={{ fontWeight: 800, fontSize: 12, color: palette.dark, marginBottom: 4 }}>{client.name || '...'}</div>
            {client.address && <div style={{ fontSize: 9, color: '#475569' }}>{client.address}</div>}
            {client.city && <div style={{ fontSize: 9, color: '#475569' }}>{client.city}</div>}
            {client.phone && <div style={{ fontSize: 9, color: '#475569' }}>{client.phone}</div>}
            {client.email && <div style={{ fontSize: 9, color: '#475569' }}>{client.email}</div>}
          </div>
          {/* Details block */}
          <div style={{ width: 160, fontSize: 9, color: '#475569' }}>
            {details.reference && <div style={{ marginBottom: 2 }}><strong>{t.reference}:</strong> {details.reference}</div>}
            {details.paymentMethod && <div style={{ marginBottom: 2 }}><strong>{t.payment}:</strong> {details.paymentMethod}</div>}
            <div><strong>{t.currency}:</strong> {details.currency}</div>
            {isModern && <div style={{ marginTop: 4 }}><strong>{t.date}:</strong> {details.date ? new Date(details.date).toLocaleDateString(locale) : '—'}</div>}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: isCorporate ? palette.primary : palette.dark }}>
              {[t.colNo, t.colDesc, t.colUnit, t.colQty, t.colPrice, t.colTotal].map((h, i) => (
                <th key={h} style={{ padding: '6px 4px', color: 'white', fontSize: 8, fontWeight: 700, textAlign: i <= 1 ? 'left' : 'right', textTransform: 'uppercase', overflow: 'hidden' }}>{h}</th>
              ))}
            </tr>
          </thead>
          {sections.map((sec, si) => (
            <tbody key={`sec-body-${si}`}>
              {sec.title && (
                <tr key={`sec-title-${si}`} style={{ background: palette.accent + '66' }}>
                  <td colSpan={6} style={{ padding: '5px 8px', fontWeight: 700, fontSize: 9.5, color: palette.dark }}>{sec.title}</td>
                </tr>
              )}
              {sec.items.map((item, ii) => {
                const itemQty = getQty(item);
                const lineTotal = itemQty * (parseFloat(item.unitPrice) || 0);
                return (
                  <tr key={`item-${si}-${ii}`} style={{ background: ii % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '5px 4px', color: '#000000', fontSize: 8.5 }}>{ii + 1}</td>
                    <td style={{ padding: '5px 4px', color: '#000000', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>{item.description || <span style={{ color: '#cbd5e1' }}>...</span>}</td>
                    <td style={{ padding: '5px 4px', color: '#000000', textAlign: 'right', fontSize: 8.5, overflow: 'hidden' }}>{item.unit}</td>
                    <td style={{ padding: '5px 4px', color: '#000000', textAlign: 'right', fontSize: 9 }}>{itemQty}</td>
                    <td style={{ padding: '5px 4px', color: '#000000', textAlign: 'right', fontSize: 8.5, whiteSpace: 'nowrap' }}>{fmtN(item.unitPrice, locale)}</td>
                    <td style={{ padding: '5px 4px', color: '#000000', textAlign: 'right', fontWeight: 600, fontSize: 9, whiteSpace: 'nowrap' }}>{fmtN(lineTotal, locale)}</td>
                  </tr>
                );
              })}
              {sec.title && sections.length > 1 && (
                <tr key={`sub-${si}`} style={{ background: palette.accent + '88' }}>
                  <td colSpan={5} style={{ padding: '4px 4px', fontSize: 8.5, color: palette.dark, fontWeight: 700, textAlign: 'right' }}>{t.subtotal} {sec.title}</td>
                  <td style={{ padding: '4px 4px', textAlign: 'right', fontWeight: 700, fontSize: 9, color: palette.dark }}>{fmtN(sectionTotals[si], locale)}</td>
                </tr>
              )}
            </tbody>
          ))}
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ width: 240, background: '#f1f5f9', borderRadius: 8, padding: '12px 14px' }}>
            {[
              { label: t.totalHT, value: fmt(subtotal, details.currency, locale) },
              labour > 0 && { label: t.labour, value: fmt(labour, details.currency, locale) },
              extra > 0 && { label: t.extra, value: fmt(extra, details.currency, locale) },
              discount > 0 && { label: t.discount, value: `- ${fmt(discount, details.currency, locale)}` },
              taxRate > 0 && { label: `${t.tax} (${taxRate}%)`, value: fmt(taxAmount, details.currency, locale) },
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 4 }}>
                <span>{label}</span><span>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13, padding: '7px 10px', marginTop: 6, background: palette.primary, color: 'white', borderRadius: 6 }}>
              <span>{t.totalTTC}</span><span>{fmt(total, details.currency, locale)}</span>
            </div>
          </div>
        </div>

        {(notes.conditions || notes.footer) && (
          <div style={{ borderTop: `1px solid ${palette.accent}`, paddingTop: 10, marginBottom: 12 }}>
            {notes.conditions && <>
              <div style={{ fontSize: 8, fontWeight: 700, color: palette.primary, textTransform: 'uppercase', marginBottom: 3 }}>{t.conditions}</div>
              <div style={{ fontSize: 8.5, color: '#475569', lineHeight: 1.5 }}>{notes.conditions}</div>
            </>}
            {notes.footer && <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>{notes.footer}</div>}
          </div>
        )}

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 12, borderTop: `1px solid #e2e8f0` }}>
          {[t.clientSig, `${t.for} ${company.name}`].map(lbl => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ borderTop: `1px solid #94a3b8`, width: 110, margin: '0 auto 4px' }} />
              <div style={{ fontSize: 8, color: '#94a3b8' }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Footer with QR Code */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 8, borderTop: `2px solid ${palette.primary}` }}>
          <div style={{ fontSize: 7.5, color: '#94a3b8', flex: 1, paddingRight: 10 }}>
            {company.name} · {company.phone} · {company.email}{company.taxId ? ` · ${t.taxId} ${company.taxId}` : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <QRCodeSVG value="https://wa.me/237683091628" size={40} level="M" />
            <span style={{ fontSize: 6, color: '#94a3b8' }}>{t.contact}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
