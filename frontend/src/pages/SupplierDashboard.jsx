import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getQuotations, getBills, getMySupplierProfile, updateMySupplierProfile, deleteMySupplierAccount, changePassword } from '../utils/api';
import toast from 'react-hot-toast';

const SupplierDashboard = () => {
  const { user, logout } = useAuth();
  const [quotations, setQuotations] = useState([]);
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
      let quotes = [];
      let billsData = [];
      let prof = {};
      
      try {
        const quotationsRes = await getQuotations();
        quotes = quotationsRes.data || [];
      } catch (e) {
        console.error('Error fetching quotations:', e);
      }
      
      try {
        const billsRes = await getBills();
        billsData = billsRes.data || [];
      } catch (e) {
        console.error('Error fetching bills:', e);
      }
      
      try {
        const profileRes = await getMySupplierProfile();
        prof = profileRes.data || {};
      } catch (e) {
        console.error('Error fetching profile:', e);
      }
      
      setQuotations(quotes);
      setBills(billsData);
      setProfile(prof);
      setFormData({
        companyName: prof.companyName || '',
        contactPerson: prof.contactPerson || '',
        phone: prof.phone || '',
        email: prof.email || '',
        address: prof.address || '',
        name: prof.name || ''
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMySupplierProfile(formData);
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
      await deleteMySupplierAccount();
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

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const myQuotations = quotations;
  const pendingQuotes = myQuotations.filter(q => q.status === 'pending');
  const approvedQuotes = myQuotations.filter(q => q.status === 'approved');

  const totalValue = approvedQuotes.reduce((sum, q) => sum + (q.price || 0), 0);
  
  const pendingBills = bills.filter(b => b.paymentStatus === 'pending');
  const paidBills = bills.filter(b => b.paymentStatus === 'paid');
  const totalReceived = paidBills.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="space-y-6 w-full max-w-full">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Supplier Dashboard</h1>
        <p className="text-gray-600">Welcome! Here you can view quotation requests and submit your quotes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-80">Total Quotations</p>
          <p className="text-3xl font-bold">{myQuotations.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <p className="text-sm opacity-80">Pending Quotes</p>
          <p className="text-3xl font-bold">{pendingQuotes.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">Approved Quotes</p>
          <p className="text-3xl font-bold">{approvedQuotes.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <p className="text-sm opacity-80">Total Received</p>
          <p className="text-3xl font-bold">${totalReceived.toFixed(2)}</p>
        </div>
      </div>

      <div className="card w-full max-w-full overflow-hidden">
        <h2 className="text-xl font-semibold mb-4">My Quotations</h2>
        {myQuotations.length === 0 ? (
          <p className="text-gray-500">No quotation requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-full">
              <thead>
                <tr>
                  <th>Quote ID</th>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Submitted On</th>
                </tr>
              </thead>
              <tbody>
                {myQuotations.map(quote => (
                  <tr key={quote.quoteID}>
                    <td>#{quote.quoteID}</td>
                    <td>{quote.materialName || 'Raw Material'}</td>
                    <td>{quote.quantity || '-'}</td>
                    <td className="font-semibold">${quote.price}</td>
                    <td>{quote.deliveryDate || 'Not specified'}</td>
                    <td>
                      <span className={`badge ${getStatusColor(quote.status)}`}>
                        {quote.status === 'approved' ? 'Approved' : quote.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Quotation Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Pending Quotations</h3>
            {pendingQuotes.length === 0 ? (
              <p className="text-gray-500">No pending quotations</p>
            ) : (
              <ul className="space-y-2">
                {pendingQuotes.map(q => (
                  <li key={q.quoteID} className="flex justify-between border-b pb-2">
                    <span>Quote #{q.quoteID} - {q.materialName} (Qty: {q.quantity || '-'})</span>
                    <span className="text-warning">${q.expectedPrice}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="font-medium mb-2">Approved Quotations Summary</h3>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total approved value</p>
            </div>
          </div>
        </div>
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
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
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

export default SupplierDashboard;