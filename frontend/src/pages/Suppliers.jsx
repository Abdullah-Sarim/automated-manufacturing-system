import { useState, useEffect } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../utils/api';
import toast from 'react-hot-toast';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', contactPerson: '', phone: '', email: '', address: '', username: '', password: '', name: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliers();
      setSuppliers(res.data);
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
        await updateSupplier(editId, formData);
      } else {
        await createSupplier(formData);
      }
      setShowModal(false);
      setFormData({ companyName: '', contactPerson: '', phone: '', email: '', address: '', username: '', password: '', name: '' });
      setEditId(null);
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving supplier');
    }
  };

  const handleEdit = (supplier) => {
    setFormData({ companyName: supplier.companyName, contactPerson: supplier.contactPerson, phone: supplier.phone, email: supplier.email, address: supplier.address });
    setEditId(supplier.supplierID);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      await deleteSupplier(id);
      fetchSuppliers();
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">Suppliers</h1>
        <button onClick={() => { setEditId(null); setFormData({ companyName: '', contactPerson: '', phone: '', email: '', address: '', username: '', password: '', name: '' }); setShowModal(true); }} className="btn btn-primary">Add Supplier</button>
      </div>

      <div className="card">
        <table className="table">
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
            {suppliers.map(supplier => (
              <tr key={supplier.supplierID}>
                <td>{supplier.supplierID}</td>
                <td>{supplier.companyName}</td>
                <td>{supplier.contactPerson || '-'}</td>
                <td>{supplier.phone || '-'}</td>
                <td>{supplier.email || '-'}</td>
                <td>
                  <button onClick={() => handleEdit(supplier)} className="text-accent hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(supplier.supplierID)} className="text-danger hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editId ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <input type="text" placeholder="Company Name" className="input" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} required />
                <input type="text" placeholder="Contact Person" className="input" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                <input type="text" placeholder="Phone" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <input type="email" placeholder="Email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <textarea placeholder="Address" className="input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                {!editId && (
                  <>
                    <input type="text" placeholder="Username" className="input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                    <input type="password" placeholder="Password" className="input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                    <input type="text" placeholder="Name" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
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

export default Suppliers;