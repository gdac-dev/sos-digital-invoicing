import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import { formatCurrency, formatDate, statusColors, openWhatsApp } from '../utils/helpers';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Send, MessageCircle, Edit, CreditCard, Printer } from 'lucide-react';
import { exportInvoicePDF } from '../utils/pdf';
import PaymentModal from '../components/payments/PaymentModal';
import InvoicePreview from '../components/invoices/InvoicePreview';

const STATUSES = ['draft','sent','viewed','partial','paid','overdue','canceled'];

export default function InvoiceDetail() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  const load = () => api.get(`/invoices/${id}`).then(r => setInvoice(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    await api.patch(`/invoices/${id}`, { status });
    toast.success('Statut mis à jour');
    load();
  };

  const handleWhatsApp = async () => {
    // 1. Download the PDF first so it's ready to attach
    await handlePDF();
    
    // 2. Open WhatsApp directly with the targeted phone number
    openWhatsApp(
      invoice.number,
      invoice.companyData?.name || 'SOS DIGITAL',
      lang,
      invoice.client?.phone,
      invoice.client?.name,
      invoice.client?.company
    );

    // 3. Update status to sent if it was a draft
    if (invoice.status === 'draft') {
      await api.patch(`/invoices/${id}`, { status: 'sent' });
      load();
    }
  };
  
  const handlePDF = async () => {
    const el = document.getElementById('hidden-invoice-preview');
    if (el) {
      await exportInvoicePDF(el, { number: invoice.number });
    } else {
      toast.error('Erreur lors de la préparation du PDF');
    }
  };

  if (loading) return <div className="loader"><div className="loader-dot"/><div className="loader-dot"/><div className="loader-dot"/></div>;
  if (!invoice) return <div className="empty-state"><h3>{lang === 'fr' ? 'Facture introuvable' : 'Invoice not found'}</h3></div>;

  const paidAmount = invoice.payments?.reduce((s, p) => s + p.amount, 0) || 0;
  const remaining = invoice.total - paidAmount;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => navigate('/invoices')}><ArrowLeft size={18}/></button>
          <div>
            <h1 className="page-title">{invoice.number}</h1>
            <p className="page-subtitle">{invoice.client?.name} {invoice.client?.company && `· ${invoice.client.company}`}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={handleWhatsApp}><MessageCircle size={14}/>{t.invoice.whatsapp}</button>
          <button className="btn btn-ghost btn-sm" onClick={handlePDF}><Download size={14}/>{t.invoice.export}</button>
          {invoice.status !== 'paid' && invoice.status !== 'canceled' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowPayment(true)}><CreditCard size={14}/>{t.payment.add}</button>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Main details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span className="badge" style={{ background: `${statusColors[invoice.status]}22`, color: statusColors[invoice.status], fontSize: 13 }}>
                {t.status[invoice.status]}
              </span>
              <select className="form-control" style={{ width: 'auto', fontSize: 12, padding: '4px 10px' }}
                value={invoice.status} onChange={e => updateStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{t.status[s]}</option>)}
              </select>
            </div>

            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div><div className="form-label">{t.invoice.date}</div><div>{formatDate(invoice.issueDate)}</div></div>
              <div><div className="form-label">{t.invoice.dueDate}</div><div style={{ color: invoice.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>{formatDate(invoice.dueDate) || '—'}</div></div>
              <div><div className="form-label">{t.invoice.template}</div><div>{invoice.templateType === 'classic' ? t.invoice.classic : t.invoice.modern}</div></div>
              <div><div className="form-label">{t.invoice.language}</div><div>{invoice.language?.toUpperCase()}</div></div>
            </div>

            {/* Items */}
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>{t.invoice.description}</th><th>{t.invoice.qty}</th>
                  <th>{t.invoice.unitPrice}</th><th>{t.invoice.lineTotal}</th>
                </tr></thead>
                <tbody>
                  {invoice.items?.map(item => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice, invoice.currency)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(item.total, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              {[
                { label: t.invoice.subtotal, value: formatCurrency(invoice.subtotal, invoice.currency) },
                invoice.discount > 0 && { label: t.invoice.discount, value: `- ${formatCurrency(invoice.discount, invoice.currency)}` },
                invoice.taxRate > 0 && { label: `${t.invoice.tax} (${invoice.taxRate}%)`, value: formatCurrency(invoice.taxAmount, invoice.currency) },
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span><span>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', color: 'var(--primary)' }}>
                <span>{t.invoice.total}</span><span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="card">
              <div className="form-label" style={{ marginBottom: 8 }}>{t.invoice.notes}</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Client */}
          <div className="card">
            <div className="form-label" style={{ marginBottom: 12 }}>{t.invoice.client}</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{invoice.client?.name}</div>
            {invoice.client?.company && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{invoice.client.company}</div>}
            {invoice.client?.email && <div style={{ fontSize: 13, marginTop: 8 }}>{invoice.client.email}</div>}
            {invoice.client?.phone && <div style={{ fontSize: 13 }}>{invoice.client.phone}</div>}
          </div>

          {/* Payment summary */}
          <div className="card">
            <div className="form-label" style={{ marginBottom: 12 }}>{t.payment.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--success)', fontSize: 13 }}>Payé</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(paidAmount, invoice.currency)}</span>
            </div>
            {remaining > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Reste</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(remaining, invoice.currency)}</span>
              </div>
            )}
            {invoice.payments?.map(p => (
              <div key={p.id} style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>{formatDate(p.date)} · {p.method}</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{formatCurrency(p.amount, invoice.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPayment && <PaymentModal invoiceId={id} onClose={() => { setShowPayment(false); load(); }} />}
      
      {/* Hidden preview for PDF export */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        <div id="hidden-invoice-preview">
          <InvoicePreview
            company={invoice.companyData || {}}
            client={invoice.client || {}}
            details={{
              number: invoice.number,
              issueDate: invoice.issueDate,
              dueDate: invoice.dueDate,
              language: invoice.language || 'fr',
              currency: invoice.currency || 'FCFA'
            }}
            sections={[{ id: 's1', title: '', items: invoice.items || [] }]}
            extras={{
              taxRate: invoice.taxRate || 0,
              discount: invoice.discount || 0,
              labour: invoice.labour || 0,
              extra: invoice.extra || 0
            }}
            notes={invoice.notes || ''}
            design={{
              template: invoice.templateType || 'classic',
              palette: invoice.palette || 'blue',
              font: invoice.font || 'Inter',
              watermark: invoice.watermark || null,
              stamp: invoice.stamp || null
            }}
          />
        </div>
      </div>
    </div>
  );
}
