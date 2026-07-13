import { BrowserRouter, HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import InvoiceEditor from './pages/InvoiceEditor';
import Quotes from './pages/Quotes';
import QuoteEditor from './pages/QuoteEditor';
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

const Router = window.electronAPI ? HashRouter : BrowserRouter;

function NavigationListener() {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNavigate((path) => {
        navigate(path);
      });
    }
  }, [navigate]);
  return null;
}

function App() {
  return (
    <Router>
      <NavigationListener />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<InvoiceEditor />} />
          <Route path="invoices/:id/edit" element={<InvoiceEditor />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="quotes/new" element={<QuoteEditor />} />
          <Route path="quotes/:id/edit" element={<QuoteEditor />} />
          <Route path="clients" element={<CRM />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="payments" element={<Payments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
