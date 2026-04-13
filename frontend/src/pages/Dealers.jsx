import { useState, useEffect } from 'react';
import { getDealers, createDealer, updateDealer, deleteDealer } from '../utils/api';
import toast from 'react-hot-toast';

const Dealers = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', contactPerson: '', phone: '', address: '', username: '', password: '', name: '', email: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchDealers(); }, []);

  const fetchDealers = async () => {
    try {
      const res = await getDealers();
      setDealers(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateDealer(editId, formData);
      } else {
        await createDealer(formData);
      }
      setShowModal(false);
      setFormData({ companyName: '', contactPerson: '', phone: '', address: '', username: '', password: '', name: '', email: '' });
      setEditId(null);
      fetchDealers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving dealer');
    }
  };

  const handleEdit = (dealer) => {
    setFormData({ companyName: dealer.companyName, contactPerson: dealer.contactPerson, phone: dealer.phone, address: dealer.address });
    setEditId(dealer.dealerID);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      await deleteDealer(id);
      fetchDealers();
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-secondary">Dealers</h1>
        <button onClick={() => { setEditId(null); setFormData({ companyName: '', contactPerson: '', phone: '', address: '', username: '', password: '', name: '', email: '' }); setShowModal(true); }} className="btn btn-primary">Add Dealer</button>
      </div>

      <div className="card w-full max-w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table min-w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Actions</th>
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
                    <button onClick={() => handleEdit(dealer)} className="text-accent hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(dealer.dealerID)} className="text-danger hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editId ? 'Edit Dealer' : 'Add Dealer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <input type="text" placeholder="Company Name" className="input" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} required />
                <input type="text" placeholder="Contact Person" className="input" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                <input type="text" placeholder="Phone" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <textarea placeholder="Address" className="input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                {!editId && (
                  <>
                    <input type="text" placeholder="Username" className="input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                    <input type="password" placeholder="Password" className="input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                    <input type="text" placeholder="Name" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <input type="email" placeholder="Email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dealers;