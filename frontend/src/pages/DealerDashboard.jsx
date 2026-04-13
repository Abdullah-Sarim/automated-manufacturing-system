import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrders, getBills, getMyDealerProfile, updateMyDealerProfile, deleteMyDealerAccount, changePassword } from '../utils/api';
import toast from 'react-hot-toast';

const DealerDashboard = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profile, setProfile] = useState({});
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, billsRes] = await Promise.all([getOrders(), getBills()]);
      
      const myOrders = ordersRes.data || [];
      const myBills = billsRes.data || [];
      
      setOrders(myOrders);
      setBills(myBills);
      
      if (myOrders.length > 0) {
        const firstOrder = myOrders[0];
        setProfile({
          companyName: firstOrder.companyName || '',
          contactPerson: '',
          phone: '',
          address: '',
          name: user?.name || '',
          email: ''
        });
        setFormData({
          companyName: firstOrder.companyName || '',
          contactPerson: '',
          phone: '',
          address: '',
          name: user?.name || '',
          email: ''
        });
      } else {
        setProfile({ name: user?.name || '' });
        setFormData({ name: user?.name || '' });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyDealerProfile(formData);
      setShowProfileModal(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await deleteMyDealerAccount();
      toast.success('Account deleted successfully');
      logout();
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error deleting account');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error changing password');
    } finally {
      setSaving(false);
    }
  };

  const getWorkflowStepLabel = (step) => {
    const steps = {
      'received': 'Order Received',
      'stock_verified': 'Stock Available - Processing',
      'stock_partial': 'Partial Stock',
      'stock_unavailable': 'Awaiting Manufacturing',
      'stock_available': 'Stock Now Available',
      'manufacturing': 'Being Manufactured',
      'billing': 'Billing',
      'processing': 'Processing',
      'completed': 'Completed - Delivered'
    };
    return steps[step] || step;
  };

  const getWorkflowStepColor = (step) => {
    const colors = {
      'received': 'bg-gray-100 text-gray-800',
      'stock_verified': 'bg-blue-100 text-blue-800',
      'stock_partial': 'bg-yellow-100 text-yellow-800',
      'stock_unavailable': 'bg-red-100 text-red-800',
      'stock_available': 'bg-green-100 text-green-800',
      'manufacturing': 'bg-purple-100 text-purple-800',
      'billing': 'bg-orange-100 text-orange-800',
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[step] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const myOrders = orders;
  const pendingBills = bills.filter(b => b.paymentStatus === 'pending');
  const paidBills = bills.filter(b => b.paymentStatus === 'paid');

  return (
    <div className="space-y-6 w-full max-w-full">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Dealer Dashboard</h1>
        <p className="text-gray-600">Welcome, {user?.name}! Track your orders and view bills.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-80">My Orders</p>
          <p className="text-3xl font-bold">{myOrders.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <p className="text-sm opacity-80">Pending Bills</p>
          <p className="text-3xl font-bold">${pendingBills.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</p>
        </div>
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">Completed Orders</p>
          <p className="text-3xl font-bold">{myOrders.filter(o => o.status === 'completed').length}</p>
        </div>
      </div>

      <div className="card w-full max-w-full overflow-hidden">
        <h2 className="text-xl font-semibold mb-4">My Orders</h2>
        {myOrders.length === 0 ? (
          <p className="text-gray-500">No orders yet. Go to Place Order to create your first order.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-full">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Expected Delivery</th>
                  <th>Workflow Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map(order => (
                  <tr key={order.orderID}>
                    <td>#{order.orderID}</td>
                    <td>{order.productName}</td>
                    <td>{order.quantity}</td>
                    <td>${order.totalAmount?.toFixed(2)}</td>
                    <td>{order.billDueDate ? new Date(order.billDueDate).toLocaleDateString() : '-'}</td>
                    <td>{order.billDeliveryDate ? new Date(order.billDeliveryDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge ${getWorkflowStepColor(order.workflowStep)}`}>
                        {getWorkflowStepLabel(order.workflowStep)}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card w-full max-w-full overflow-hidden">
        <h2 className="text-xl font-semibold mb-4">My Bills</h2>
        {bills.length === 0 ? (
          <p className="text-gray-500">No bills yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-full">
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill.billID}>
                    <td>#{bill.billID}</td>
                    <td>#{bill.orderNumber}</td>
                    <td>${bill.amount?.toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${bill.paymentStatus}`}>
                        {bill.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td>{bill.dueDate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleSaveProfile}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Company Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.companyName} 
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contact Person</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.contactPerson} 
                    onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Address</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowProfileModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-danger">Delete Account</h2>
            <p className="text-gray-600 mb-4">Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={saving} className="btn btn-danger">
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Current Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={passwordData.currentPassword} 
                    onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={passwordData.newPassword} 
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={passwordData.confirmPassword} 
                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerDashboard;