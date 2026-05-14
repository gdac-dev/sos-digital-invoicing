import { PALETTES } from './editorConstants';

// Format number with locale
const fmt = (n, currency = 'FCFA') => `${Number(n || 0).toLocaleString('fr-FR')} ${currency}`;
const fmtN = (n) => Number(n || 0).toLocaleString('fr-FR');

export default function InvoicePreview({ company, client, details, sections, extras, notes, design, onStampClick }) {
  const palette = PALETTES[design.palette] || PALETTES.skyblue;
  const font = design.font || 'Inter';

  // Compute totals
  const sectionTotals = sections.map(sec =>
    sec.items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0), 0)
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
  const wm = design.watermark;
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

  const stamp = design.stamp;

  // Template header style
  const isModern = design.template === 'modern';
  const isMinimal = design.template === 'minimal';
  const isClassic = design.template === 'classic';

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
        width: 595, minHeight: 842, background: 'white', position: 'relative', overflow: 'hidden',
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
      {isModern ? (
        <div style={{ background: palette.primary, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {company.logo && <img src={company.logo} alt="Logo" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} onError={e => e.target.style.display='none'} />}
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>{company.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9 }}>{company.activity}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px' }}>{design.docTitle}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9 }}>N° {details.number || `${new Date().getFullYear()}-XXXX`}</div>
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
              <div style={{ fontWeight: 900, fontSize: 20, color: palette.dark }}>{design.docTitle}</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>N° {details.number || `${new Date().getFullYear()}-XXXX`}</div>
            </div>
          </div>
        </div>
      ) : (
        // Elegant + Classic
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
              {company.taxId && <div style={{ fontSize: 8.5, color: '#64748b' }}>N° fiscal: {company.taxId}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: palette.dark, letterSpacing: '-0.3px' }}>{design.docTitle}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>N° {details.number || `${new Date().getFullYear()}-XXXX`}</div>
            <div style={{ fontSize: 9, color: '#475569' }}>Date : {details.date ? new Date(details.date).toLocaleDateString('fr-FR') : '—'}</div>
            {details.validity && <div style={{ fontSize: 9, color: '#475569' }}>Validité : {details.validity} jours</div>}
            {details.dueDate && <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>Échéance : {new Date(details.dueDate).toLocaleDateString('fr-FR')}</div>}
          </div>
        </div>
      )}

      {/* Color bar (elegant/classic only) */}
      {!isModern && !isMinimal && <div style={{ height: 4, background: palette.primary, margin: '0 32px' }} />}

      <div style={{ padding: '14px 32px 28px' }}>
        {/* Client + Details row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {/* Client block */}
          <div style={{ flex: 1, background: palette.accent + '44', borderLeft: `3px solid ${palette.primary}`, padding: '10px 12px', borderRadius: '0 6px 6px 0' }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: palette.primary, textTransform: 'uppercase', marginBottom: 4 }}>Facturé à</div>
            <div style={{ fontWeight: 700, fontSize: 11 }}>{client.name || 'Nom du client'}</div>
            {client.address && <div style={{ fontSize: 9, color: '#475569' }}>{client.address}</div>}
            {client.city && <div style={{ fontSize: 9, color: '#475569' }}>{client.city}</div>}
            {client.phone && <div style={{ fontSize: 9, color: '#475569' }}>{client.phone}</div>}
            {client.email && <div style={{ fontSize: 9, color: '#475569' }}>{client.email}</div>}
          </div>
          {/* Details block */}
          <div style={{ width: 160, fontSize: 9, color: '#475569' }}>
            {details.reference && <div style={{ marginBottom: 2 }}><strong>Référence:</strong> {details.reference}</div>}
            {details.paymentMethod && <div style={{ marginBottom: 2 }}><strong>Paiement:</strong> {details.paymentMethod}</div>}
            <div><strong>Devise:</strong> {details.currency}</div>
            {isModern && <div style={{ marginTop: 4 }}><strong>Date:</strong> {details.date ? new Date(details.date).toLocaleDateString('fr-FR') : '—'}</div>}
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr style={{ background: palette.dark }}>
              {['N°', 'Description', 'Unité', 'Qté', 'P.U.', 'Total'].map((h, i) => (
                <th key={h} style={{ padding: '6px 8px', color: 'white', fontSize: 8.5, fontWeight: 700, textAlign: i <= 1 ? 'left' : 'right', textTransform: 'uppercase' }}>{h}</th>
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
                const lineTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
                return (
                  <tr key={`item-${si}-${ii}`} style={{ background: ii % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '5px 8px', color: '#94a3b8', fontSize: 8.5 }}>{ii + 1}</td>
                    <td style={{ padding: '5px 8px', fontSize: 9.5 }}>{item.description || <span style={{ color: '#cbd5e1' }}>Description...</span>}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontSize: 9 }}>{item.unit}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontSize: 9 }}>{item.qty}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontSize: 9 }}>{fmtN(item.unitPrice)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, fontSize: 9 }}>{fmtN(lineTotal)}</td>
                  </tr>
                );
              })}
              {sec.title && sections.length > 1 && (
                <tr key={`sub-${si}`} style={{ background: palette.accent + '88' }}>
                  <td colSpan={5} style={{ padding: '4px 8px', fontSize: 8.5, color: palette.dark, fontWeight: 700, textAlign: 'right' }}>Sous-total {sec.title}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontSize: 9, color: palette.dark }}>{fmtN(sectionTotals[si])}</td>
                </tr>
              )}
            </tbody>
          ))}
        </table>

        {/* Totals box */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ width: 240, background: '#f1f5f9', borderRadius: 8, padding: '12px 14px' }}>
            {[
              { label: 'Total HT', value: fmt(subtotal, details.currency) },
              labour > 0 && { label: "Main-d'œuvre", value: fmt(labour, details.currency) },
              extra > 0 && { label: 'Frais supplémentaires', value: fmt(extra, details.currency) },
              discount > 0 && { label: 'Remise', value: `- ${fmt(discount, details.currency)}` },
              taxRate > 0 && { label: `TVA (${taxRate}%)`, value: fmt(taxAmount, details.currency) },
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 4 }}>
                <span>{label}</span><span>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13, padding: '7px 10px', marginTop: 6, background: palette.primary, color: 'white', borderRadius: 6 }}>
              <span>TOTAL TTC</span><span>{fmt(total, details.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(notes.conditions || notes.footer) && (
          <div style={{ borderTop: `1px solid ${palette.accent}`, paddingTop: 10, marginBottom: 12 }}>
            {notes.conditions && <>
              <div style={{ fontSize: 8, fontWeight: 700, color: palette.primary, textTransform: 'uppercase', marginBottom: 3 }}>Conditions et notes</div>
              <div style={{ fontSize: 8.5, color: '#475569', lineHeight: 1.5 }}>{notes.conditions}</div>
            </>}
            {notes.footer && <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>{notes.footer}</div>}
          </div>
        )}

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 12, borderTop: `1px solid #e2e8f0` }}>
          {['Signature client', `Pour ${company.name}`].map(lbl => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ borderTop: `1px solid #94a3b8`, width: 110, margin: '0 auto 4px' }} />
              <div style={{ fontSize: 8, color: '#94a3b8' }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 14, paddingTop: 8, borderTop: `2px solid ${palette.primary}` }}>
          <div style={{ fontSize: 7.5, color: '#94a3b8' }}>
            {company.name} · {company.phone} · {company.email}{company.taxId ? ` · N° fiscal: ${company.taxId}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
