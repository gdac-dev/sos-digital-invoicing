import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import InvoiceEditor from './pages/InvoiceEditor';
import Quotes from './pages/Quotes';
import CRM from './pages/CRM';
import Catalog from './pages/Catalog';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loader" style={{ height: '100vh' }}>
      <div className="loader-dot" /><div className="loader-dot" /><div className="loader-dot" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<InvoiceEditor />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="clients" element={<CRM />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="payments" element={<Payments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
