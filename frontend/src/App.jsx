import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DealerDashboard from './pages/DealerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import PlaceOrder from './pages/PlaceOrder';
import SupplierQuotations from './pages/SupplierQuotations';
import UserManagement from './pages/UserManagement';
import Dealers from './pages/Dealers';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import Materials from './pages/Materials';
import Orders from './pages/Orders';
import Quotations from './pages/Quotations';
import Manufacturing from './pages/Manufacturing';
import Bills from './pages/Bills';
import DealerBills from './pages/DealerBills';
import SupplierBills from './pages/SupplierBills';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const RoleBasedDashboard = () => {
  const { user } = useAuth();
  
  if (user?.role === 'dealer') {
    return <DealerDashboard />;
  } else if (user?.role === 'supplier') {
    return <SupplierDashboard />;
  } else {
    return <Dashboard />;
  }
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<RoleBasedDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        {user?.role === 'supplier' && (
          <Route path="my-quotations" element={<SupplierQuotations />} />
        )}
        {user?.role === 'supplier' && (
          <Route path="my-bills" element={<SupplierBills />} />
        )}
        {user?.role === 'dealer' && (
          <Route path="place-order" element={<PlaceOrder />} />
        )}
        {user?.role === 'dealer' && (
          <Route path="bills" element={<DealerBills />} />
        )}
        {user?.role === 'supplier' && (
          <Route path="my-bills" element={<SupplierBills />} />
        )}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Route path="bills" element={<Bills />} />
        )}
        <Route path="users" element={<UserManagement />} />
        <Route path="dealers" element={<Dealers />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="products" element={<Products />} />
        <Route path="materials" element={<Materials />} />
        <Route path="orders" element={<Orders />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="manufacturing" element={<Manufacturing />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;