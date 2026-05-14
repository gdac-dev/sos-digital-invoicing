import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import { formatCurrency, formatDate, statusColors } from '../utils/helpers';
import { BarChart2, FileText, Clock, AlertTriangle, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Dashboard() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/monthly-revenue'),
      api.get('/dashboard/top-clients'),
      api.get('/dashboard/recent-invoices'),
    ]).then(([s, m, c, r]) => {
      setStats(s.data); setMonthly(m.data); setTopClients(c.data); setRecent(r.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader"><div className="loader-dot"/><div className="loader-dot"/><div className="loader-dot"/></div>;

  const metrics = [
    { label: t.dashboard.monthRevenue, value: formatCurrency(stats?.monthRevenue), icon: TrendingUp, color: '#0EA5E9', rgb: '14,165,233' },
    { label: t.dashboard.paidInvoices, value: stats?.paidInvoices, icon: FileText, color: '#22c55e', rgb: '34,197,94' },
    { label: t.dashboard.pendingInvoices, value: stats?.pendingInvoices, icon: Clock, color: '#f59e0b', rgb: '245,158,11' },
    { label: t.dashboard.overdueInvoices, value: stats?.overdueInvoices, icon: AlertTriangle, color: '#ef4444', rgb: '239,68,68' },
    { label: t.dashboard.activeClients, value: stats?.totalClients, icon: Users, color: '#8b5cf6', rgb: '139,92,246' },
    { label: t.dashboard.conversionRate, value: `${stats?.quoteConversionRate}%`, icon: BarChart2, color: '#f97316', rgb: '249,115,22' },
  ];

  const chartData = {
    labels: monthly.map(m => m.month),
    datasets: [{
      label: t.dashboard.monthlyChart,
      data: monthly.map(m => m.revenue),
      backgroundColor: 'rgba(14,165,233,0.7)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => formatCurrency(ctx.raw) } } },
    scales: {
      x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => formatCurrency(v) } },
    },
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.dashboard.title}</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button id="new-invoice-btn" className="btn btn-primary" onClick={() => navigate('/invoices?new=1')}>
          <Plus size={16} /> {t.invoice.new}
        </button>
      </div>

      {/* Metric cards */}
      <div className="metrics-grid">
        {metrics.map(({ label, value, icon: Icon, color, rgb }) => (
          <div key={label} className="metric-card" style={{ '--metric-color': color, '--metric-rgb': rgb }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div className="metric-icon"><Icon size={20} /></div>
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Revenue Chart */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>{t.dashboard.monthlyChart}</h3>
          <div style={{ height: 220 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Clients */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>{t.dashboard.topClients}</h3>
          {topClients.length === 0 ? (
            <div className="empty-state"><p>{t.common.noData}</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topClients.map(({ client, total, count }, i) => (
                <div key={client.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `rgba(14,165,233,${0.9 - i * 0.15})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count} facture{count > 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{formatCurrency(total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>{t.dashboard.recentInvoices}</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/invoices')}>
            {t.common.view} <ArrowRight size={13} />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state"><FileText size={40} /><h3>{t.common.noData}</h3></div>
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr>
                <th>{t.invoice.number}</th><th>{t.invoice.client}</th>
                <th>{t.invoice.date}</th><th>{t.invoice.amount}</th><th>{t.invoice.status}</th>
              </tr></thead>
              <tbody>
                {recent.map(inv => (
                  <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.number}</td>
                    <td>{inv.client?.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(inv.issueDate)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total, inv.currency)}</td>
                    <td>
                      <span className="badge" style={{ background: `${statusColors[inv.status]}22`, color: statusColors[inv.status] }}>
                        {t.status[inv.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
