import { useState, useEffect } from 'react';
import { getPendingUsers, approveUser, rejectUser, getDealers, getSuppliers, getManagers, deleteManager, resetData } from '../utils/api';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pendingRes, managersRes, dealersRes, suppliersRes] = await Promise.all([
        getPendingUsers(),
        getManagers(),
        getDealers(),
        getSuppliers()
      ]);
      setPendingUsers(pendingRes.data);
      setManagers(managersRes.data || []);
      setDealers(dealersRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await approveUser(userId);
      fetchData();
      toast.success('User approved successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error approving user');
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectUser(userId);
      fetchData();
      toast.success('User rejected');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error rejecting user');
    }
  };

  const handleDeleteManager = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this manager account?')) return;
    try {
      await deleteManager(userId);
      fetchData();
      toast.success('Manager deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error deleting manager');
    }
  };

  const handleResetData = async (e) => {
    e.preventDefault();
    if (resetConfirmText !== 'RESET') {
      toast.error('Please type RESET to confirm');
      return;
    }
    setResetting(true);
    try {
      await resetData(resetPassword);
      toast.success('Data reset successfully');
      setShowResetModal(false);
      setResetPassword('');
      setResetConfirmText('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error resetting data');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">User Management</h1>

      <div className="flex space-x-4 mb-4">
        <button 
          onClick={() => setActiveTab('pending')} 
          className={`px-4 py-2 rounded ${activeTab === 'pending' ? 'bg-accent text-white' : 'bg-gray-200'}`}
        >
          Pending ({pendingUsers.length})
        </button>
        <button 
          onClick={() => setActiveTab('managers')} 
          className={`px-4 py-2 rounded ${activeTab === 'managers' ? 'bg-accent text-white' : 'bg-gray-200'}`}
        >
          Managers
        </button>
        <button 
          onClick={() => setActiveTab('dealers')} 
          className={`px-4 py-2 rounded ${activeTab === 'dealers' ? 'bg-accent text-white' : 'bg-gray-200'}`}
        >
          Dealers ({dealers.length})
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')} 
          className={`px-4 py-2 rounded ${activeTab === 'suppliers' ? 'bg-accent text-white' : 'bg-gray-200'}`}
        >
          Suppliers ({suppliers.length})
        </button>
      </div>

      {activeTab === 'managers' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Managers</h2>
          {managers.length === 0 ? (
            <p className="text-gray-500">No managers found</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {managers.map(user => (
                  <tr key={user.userID}>
                    <td>{user.username}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td><span className={`badge badge-${user.approvalStatus}`}>{user.approvalStatus}</span></td>
                    <td>
                      <button 
                        onClick={() => handleDeleteManager(user.userID)}
                        className="text-danger hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Pending User Approvals</h2>
          {pendingUsers.length === 0 ? (
            <p className="text-gray-500">No pending users</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.userID}>
                    <td>{user.username}</td>
                    <td><span className="badge badge-pending capitalize">{user.role}</span></td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.companyName || user.supplierName || '-'}</td>
                    <td>
                      <button onClick={() => handleApprove(user.userID)} className="text-success hover:underline mr-3">Approve</button>
                      <button onClick={() => handleReject(user.userID)} className="text-danger hover:underline">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'dealers' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Dealers</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dealers.map(dealer => (
                <tr key={dealer.dealerID}>
                  <td>{dealer.dealerID}</td>
                  <td>{dealer.companyName}</td>
                  <td>{dealer.contactPerson || '-'}</td>
                  <td>{dealer.phone || '-'}</td>
                  <td>{dealer.email || '-'}</td>
                  <td>
                    <span className={`badge ${dealer.approved ? 'badge-completed' : 'badge-pending'}`}>
                      {dealer.approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Suppliers</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.supplierID}>
                  <td>{supplier.supplierID}</td>
                  <td>{supplier.companyName}</td>
                  <td>{supplier.contactPerson || '-'}</td>
                  <td>{supplier.phone || '-'}</td>
                  <td>{supplier.email || '-'}</td>
                  <td>
                    <span className={`badge ${supplier.approved ? 'badge-completed' : 'badge-pending'}`}>
                      {supplier.approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 pt-4 border-t">
        <button 
          onClick={() => setShowResetModal(true)} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reset Website Data
        </button>
        <p className="text-xs text-gray-500 mt-1">Warning: This will delete all orders, bills, manufacturing orders, products (reset to default), and raw materials. User accounts (dealers, suppliers, admins) will be preserved.</p>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-2 text-red-600">Reset Website Data</h2>
            <div className="bg-red-50 p-3 rounded mb-4">
              <p className="text-sm text-red-700 font-semibold">Warning!</p>
              <p className="text-xs text-red-600">This will delete:</p>
              <ul className="text-xs text-red-600 list-disc list-inside mt-1">
                <li>All orders and bills</li>
                <li>All manufacturing orders</li>
                <li>All quotations</li>
                <li>All products (will reset to default)</li>
                <li>All raw materials (will reset to default)</li>
                <li>All notifications</li>
              </ul>
              <p className="text-xs text-red-600 mt-1">User accounts (admins, dealers, suppliers) will be preserved.</p>
            </div>
            <form onSubmit={handleResetData}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Admin Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={resetPassword} 
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Confirm Reset</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={resetConfirmText} 
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder="Type RESET"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowResetModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={resetting || resetConfirmText !== 'RESET'}
                  className="btn btn-danger"
                >
                  {resetting ? 'Resetting...' : 'Reset Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;