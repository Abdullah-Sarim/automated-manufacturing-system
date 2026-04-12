import { useState, useEffect } from 'react';
import { getMaterials, createMaterial, updateMaterial, updateMaterialStock, deleteMaterial } from '../utils/api';
import toast from 'react-hot-toast';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', quantity: '', unit: '', reorderLevel: '' });
  const [stockData, setStockData] = useState({ quantity: '', operation: 'add' });
  const [editId, setEditId] = useState(null);
  const [stockMaterialId, setStockMaterialId] = useState(null);

  useEffect(() => { fetchMaterials(); }, []);

  const fetchMaterials = async () => {
    try {
      const res = await getMaterials();
      setMaterials(res.data);
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
        await updateMaterial(editId, formData);
      } else {
        await createMaterial(formData);
      }
      setShowModal(false);
      setFormData({ name: '', quantity: '', unit: '', reorderLevel: '' });
      setEditId(null);
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving material');
    }
  };

  const handleEdit = (material) => {
    setFormData({ name: material.name, quantity: material.quantity, unit: material.unit, reorderLevel: material.reorderLevel });
    setEditId(material.materialID);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      await deleteMaterial(id);
      fetchMaterials();
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateMaterialStock(stockMaterialId, stockData);
      setShowStockModal(false);
      setStockData({ quantity: '', operation: 'add' });
      setStockMaterialId(null);
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating stock');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">Raw Materials</h1>
        <button onClick={() => { setEditId(null); setFormData({ name: '', quantity: '', unit: '', reorderLevel: '' }); setShowModal(true); }} className="btn btn-primary">Add Material</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Reorder Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(material => (
              <tr key={material.materialID}>
                <td>{material.materialID}</td>
                <td>{material.name}</td>
                <td className={material.quantity <= material.reorderLevel ? 'text-danger font-semibold' : ''}>{material.quantity}</td>
                <td>{material.unit}</td>
                <td>{material.reorderLevel}</td>
                <td>
                  {material.quantity <= material.reorderLevel ? (
                    <span className="badge badge-cancelled">Low Stock</span>
                  ) : (
                    <span className="badge badge-completed">OK</span>
                  )}
                </td>
                <td>
                  <button onClick={() => { setStockMaterialId(material.materialID); setShowStockModal(true); }} className="text-accent hover:underline mr-3">Stock</button>
                  <button onClick={() => handleEdit(material)} className="text-blue-600 hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(material.materialID)} className="text-danger hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editId ? 'Edit Material' : 'Add Material'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <input type="text" placeholder="Material Name" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <input type="number" placeholder="Quantity" className="input" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                <input type="text" placeholder="Unit (e.g., pcs, meters)" className="input" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                <input type="number" placeholder="Reorder Level" className="input" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Quantity</h2>
            <form onSubmit={handleStockUpdate}>
              <div className="space-y-3">
                <select className="input" value={stockData.operation} onChange={e => setStockData({...stockData, operation: e.target.value})}>
                  <option value="add">Add</option>
                  <option value="remove">Remove</option>
                </select>
                <input type="number" placeholder="Quantity" className="input" value={stockData.quantity} onChange={e => setStockData({...stockData, quantity: e.target.value})} required />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowStockModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;