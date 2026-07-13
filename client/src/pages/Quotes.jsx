import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, statusColors } from '../utils/helpers';
import { Plus, Search, ArrowRight, Trash2, FileText, Eye, Edit, X, Save, Download } from 'lucide-react';
import InvoicePreview from '../components/invoices/InvoicePreview';
import { exportInvoicePDF } from '../utils/pdf';
import { INITIAL_COMPANY } from '../components/invoices/editorConstants';

const STATUSES = ['draft','sent','accepted','declined','expired','converted'];

export default function Quotes() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [viewModal, setViewModal] = useState(null); // quote to view
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/quotes', { params: { status, page, limit: 15 } })
      .then(r => { setQuotes(r.data.quotes); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const openView = (q) => {
    // Fetch full quote data with parsed JSON fields
    api.get(`/quotes/${q.id}`).then(r => setViewModal(r.data)).catch(() => setViewModal(q));
  };

  const convertToInvoice = async (id) => {
    if (!confirm(lang === 'fr' ? 'Convertir ce devis en facture ?' : 'Convert this quote to an invoice?')) return;
    try {
      await api.post(`/quotes/${id}/convert`);
      toast.success(lang === 'fr' ? 'Facture créée !' : 'Invoice created!');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t.common.confirm)) return;
    await api.delete(`/quotes/${id}`); toast.success(lang === 'fr' ? 'Devis supprimé' : 'Quote deleted'); load();
  };

  const handleExportPDF = () => {
    const el = document.getElementById('hidden-quote-preview');
    if (el) {
      exportInvoicePDF(el, { number: viewModal?.number || 'Devis' });
    }
  };

  // Build preview data from viewModal
  const buildPreviewData = (q) => {
    if (!q) return null;
    const sections = [];
    let currentSection = null;
    for (const i of (q.items || [])) {
      const st = i.sectionTitle || '';
      if (!currentSection || currentSection.title !== st) {
        currentSection = { title: st, items: [] };
        sections.push(currentSection);
      }
      currentSection.items.push({
        description: i.description || '',
        unit: i.unit || 'Unité',
        qty: i.quantity ?? 1,
        unitPrice: i.unitPrice ?? 0,
      });
    }
    if (!sections.length) sections.push({ title: '', items: [] });
    return {
      company: q.companyData || INITIAL_COMPANY,
      client: q.client || {},
      details: {
        number: q.number,
        date: q.issueDate ? q.issueDate.split('T')[0] : '',
        dueDate: q.validUntil ? q.validUntil.split('T')[0] : '',
        language: q.language || 'fr',
        currency: q.currency || 'FCFA',
        paymentMethod: q.paymentMethod || 'Virement',
      },
      sections,
      extras: {
        taxRate: q.taxRate || 0,
        discount: q.discount || 0,
        labour: q.labour || 0,
        extra: q.extra || 0,
      },
      notes: { conditions: q.notes || '', footer: q.footer || '' },
      design: {
        docTitle: 'DEVIS',
        template: q.templateType || 'classic',
        palette: q.palette || 'skyblue',
        font: q.font || 'Inter',
        watermark: q.watermark || null,
        stamp: q.stamp || null,
      },
    };
  };

  const previewData = buildPreviewData(viewModal);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.quote.title}</h1>
          <p className="page-subtitle">{total} {lang === 'fr' ? 'devis' : 'quotes'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/quotes/new')}><Plus size={16}/>{t.quote.new}</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select className="form-control" style={{ width: 180 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t.common.all}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t.status[s]}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loader"><div className="loader-dot"/><div className="loader-dot"/><div className="loader-dot"/></div>
        : quotes.length === 0 ? <div className="empty-state"><FileText size={48}/><h3>{t.common.noData}</h3></div>
        : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr>
                <th>{t.quote.number}</th><th>{t.invoice.client}</th>
                <th>{t.invoice.date}</th><th>{t.quote.validity}</th>
                <th>{t.invoice.amount}</th><th>{t.invoice.status}</th><th>{t.common.actions}</th>
              </tr></thead>
              <tbody>
                {quotes.map(q => (
                  <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => openView(q)}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{q.number}</td>
                    <td>{q.client?.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(q.issueDate)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(q.validUntil)}</td>
                    <td style={{ fontWeight: 600 }}>{Number(q.total).toLocaleString('fr-FR')} {q.currency}</td>
                    <td>
                      <span className="badge" style={{ background: `${statusColors[q.status]}22`, color: statusColors[q.status] }}>
                        {t.status[q.status]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" title={t.common.view} onClick={() => openView(q)}><Eye size={13}/></button>
                        <button className="btn-icon" title={t.common.edit} onClick={() => navigate(`/quotes/${q.id}/edit`)}><Edit size={13}/></button>
                        {q.status !== 'converted' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => convertToInvoice(q.id)} title={t.quote.convertToInvoice}>
                            <ArrowRight size={13}/>{lang === 'fr' ? 'Convertir' : 'Convert'}
                          </button>
                        )}
                        <button className="btn-icon" onClick={() => handleDelete(q.id)}><Trash2 size={13} style={{ color: 'var(--danger)' }}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>←</button>
          <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text-muted)' }}>{t.common.page} {page} {t.common.of} {Math.ceil(total/15)}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total/15)}>→</button>
        </div>
      )}

      {/* ===== VIEW MODAL ===== */}
      {viewModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ marginBottom: 2 }}>{viewModal.number}</h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{viewModal.client?.name} · <span className="badge" style={{ background: `${statusColors[viewModal.status]}22`, color: statusColors[viewModal.status], fontSize: 11 }}>{t.status[viewModal.status]}</span></div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-ghost btn-sm" onClick={handleExportPDF}><Download size={13}/>{lang === 'fr' ? 'PDF' : 'PDF'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setViewModal(null); navigate(`/quotes/${viewModal.id}/edit`); }}><Edit size={13}/>{t.common.edit}</button>
                <button className="btn-icon" onClick={() => setViewModal(null)}><X size={16}/></button>
              </div>
            </div>

            {/* Read-only view */}
            <div>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div><div className="form-label">{t.invoice.date}</div><div>{formatDate(viewModal.issueDate)}</div></div>
                <div><div className="form-label">{t.quote.validity}</div><div>{formatDate(viewModal.validUntil) || '—'}</div></div>
                <div><div className="form-label">{t.invoice.client}</div><div style={{ fontWeight: 600 }}>{viewModal.client?.name}</div></div>
                <div><div className="form-label">{t.invoice.amount}</div><div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>{Number(viewModal.total).toLocaleString('fr-FR')} {viewModal.currency}</div></div>
              </div>
              <div className="table-wrap" style={{ marginBottom: 12 }}>
                <table>
                  <thead><tr><th>{t.invoice.description}</th><th>{t.invoice.qty}</th><th>{t.invoice.unitPrice}</th><th>{t.invoice.lineTotal}</th></tr></thead>
                  <tbody>
                    {(viewModal.items || []).map((item, i) => (
                      <tr key={i}>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice, viewModal.currency)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(item.total, viewModal.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {viewModal.notes && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}><strong>{t.invoice.notes}:</strong> {viewModal.notes}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {viewModal.status !== 'converted' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setViewModal(null); convertToInvoice(viewModal.id); }}>
                    <ArrowRight size={13}/>{lang === 'fr' ? 'Convertir en facture' : 'Convert to Invoice'}
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => setViewModal(null)}>{t.common.close}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden preview for PDF export */}
      {viewModal && previewData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
          <div id="hidden-quote-preview">
            <InvoicePreview
              company={previewData.company}
              client={previewData.client}
              details={previewData.details}
              sections={previewData.sections}
              extras={previewData.extras}
              notes={previewData.notes}
              design={previewData.design}
            />
          </div>
        </div>
      )}
    </div>
  );
}
