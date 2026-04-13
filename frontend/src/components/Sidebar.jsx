import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Bell,
  User,
  Users,
  Truck,
  ShoppingCart,
  Package,
  FileText,
  Settings,
  CreditCard,
  ClipboardList,
  Factory,
  TrendingUp,
  FileBarChart,
  Send,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Sidebar = ({ className = '', collapsed: externalCollapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setInternalCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const menuItems = {
    admin: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Profile', path: '/profile', icon: User },
      { name: 'User Management', path: '/users', icon: Users },
      { name: 'Dealers', path: '/dealers', icon: Truck },
      { name: 'Suppliers', path: '/suppliers', icon: Send },
      { name: 'Products', path: '/products', icon: Package },
      { name: 'Raw Materials', path: '/materials', icon: FileText },
      { name: 'Orders', path: '/orders', icon: ShoppingCart },
      { name: 'Quotations', path: '/quotations', icon: ClipboardList },
      { name: 'Manufacturing', path: '/manufacturing', icon: Factory },
      { name: 'Bills', path: '/bills', icon: CreditCard },
      { name: 'Reports', path: '/reports', icon: TrendingUp },
    ],
    dealer: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Profile', path: '/profile', icon: User },
      { name: 'Place Order', path: '/place-order', icon: ShoppingCart },
      { name: 'My Orders', path: '/orders', icon: ClipboardList },
      { name: 'My Bills', path: '/bills', icon: CreditCard },
    ],
    supplier: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Profile', path: '/profile', icon: User },
      { name: 'My Quotations', path: '/my-quotations', icon: FileText },
      { name: 'My Bills', path: '/my-bills', icon: CreditCard },
    ],
    manager: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Profile', path: '/profile', icon: User },
      { name: 'Orders', path: '/orders', icon: ShoppingCart },
      { name: 'Products', path: '/products', icon: Package },
      { name: 'Manufacturing', path: '/manufacturing', icon: Factory },
      { name: 'Reports', path: '/reports', icon: TrendingUp },
    ],
  };

  const items = menuItems[user?.role] || menuItems.admin;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside 
      className={`bg-slate-900 h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-60'
      } ${className}`}
    >
      <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">WAMS</h1>
              <p className="text-slate-400 text-xs">Manufacturing</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-lg">W</span>
          </div>
        )}
        <button
          onClick={handleToggle}
          className={`p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all ${isMobile ? 'hidden' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {items.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {!collapsed && (
                <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                  {item.name}
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700/50">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || user?.username}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full p-3 rounded-xl text-slate-400 hover:text-danger hover:bg-red-500/10 transition-all flex items-center justify-center"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;