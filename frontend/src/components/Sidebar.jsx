import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../utils/api';
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
} from 'lucide-react';

const Sidebar = ({ className = '' }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <aside className={`w-64 bg-secondary text-white h-screen fixed left-0 top-0 p-4 overflow-y-auto ${className}`}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-accent">WAMS</h1>
        <p className="text-sm text-gray-400">Manufacturing System</p>
      </div>
      <nav className="space-y-2">
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-accent text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;