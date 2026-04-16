import { useState, useEffect } from 'react';
import { getManufacturingOrders, getOrders, getProducts, getMaterials, createManufacturingOrder, startManufacturing, completeManufacturing } from '../utils/api';
import toast from 'react-hot-toast';

const Manufacturing = () => {
  const [orders, setOrders] = useState([]);
  const [mfgOrders, setMfgOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedMfgId, setSelectedMfgId] = useState(null);
  const [formData, setFormData] = useState({ orderID: '', productID: '', quantity: '' });
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [mfgRes, ordersRes, productsRes, materialsRes] = await Promise.all([getManufacturingOrders(), getOrders(), getProducts(), getMaterials()]);
      setMfgOrders(mfgRes.data);
      setOrders(ordersRes.data.filter(o => o.status !== 'completed'));
      setAllProducts(productsRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createManufacturingOrder(formData);
      setShowModal(false);
      setFormData({ orderID: '', productID: '', quantity: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error creating manufacturing order');
    }
  };

  const handleStartClick = (id) => {
    setSelectedMfgId(id);
    setSelectedMaterials([]);
    setShowMaterialsModal(true);
  };

  const handleAddMaterial = (materialId) => {
    const material = materials.find(m => m.materialID === materialId);
    if (material) {
      const existing = selectedMaterials.find(m => m.materialID === materialId);
      if (existing) {
        setSelectedMaterials(selectedMaterials.map(m => 
          m.materialID === materialId ? { ...m, quantity: m.quantity + 1 } : m
        ));
      } else {
        setSelectedMaterials([...selectedMaterials, { materialID: materialId, name: material.name, quantity: 1, available: material.quantity }]);
      }
    }
  };

  const handleRemoveMaterial = (materialId) => {
    setSelectedMaterials(selectedMaterials.filter(m => m.materialID !== materialId));
  };

  const handleMaterialQuantityChange = (materialId, qty) => {
    setSelectedMaterials(selectedMaterials.map(m => 
      m.materialID === materialId ? { ...m, quantity: parseInt(qty) || 0 } : m
    ));
  };

  const handleStart = async () => {
    try {
      await startManufacturing(selectedMfgId, { materials: selectedMaterials.map(m => ({ materialID: m.materialID, quantity: m.quantity })) });
      setShowMaterialsModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error starting manufacturing');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeManufacturing(id);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error completing manufacturing');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const lowStockProducts = allProducts.filter(p => p.stock < p.reorderLevel * 2);
  const partialOrders = orders.filter(o => o.availability === 'partial');

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-secondary">Manufacturing Orders</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">New Manufacturing Order</button>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="card border-l-4 border-orange-500 w-full max-w-full overflow-hidden">
          <h2 className="text-xl font-semibold mb-4 text-orange-700">Products Needing Manufacturing</h2>
          <div className="overflow-x-auto">
            <table className="table min-w-full">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(product => (
                  <tr key={product.productID}>
                    <td className="font-semibold">{product.name}</td>
                    <td>{product.stock}</td>
                    <td>{product.reorderLevel}</td>
                    <td>
                      <span className={`badge ${product.stock === 0 ? 'badge-cancelled' : product.stock < product.reorderLevel ? 'badge-pending' : 'badge-processing'}`}>
                        {product.stock === 0 ? 'Out of Stock' : product.stock < product.reorderLevel ? 'Low Stock' : 'Partial'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => { setFormData({...formData, productID: product.productID.toString(), quantity: (product.reorderLevel * 2 - product.stock).toString()}); setShowModal(true); }}
                        className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-blue-700"
                      >
                        Start Manufacturing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {partialOrders.length > 0 && (
        <div className="card border-l-4 border-yellow-500 w-full max-w-full overflow-hidden">
          <h2 className="text-xl font-semibold mb-4 text-yellow-700">Orders with Partial Stock Availability</h2>
          <div className="overflow-x-auto">
            <table className="table min-w-full">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Ordered Qty</th>
                  <th>Available Stock</th>
                  <th>Shortage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partialOrders.map(order => (
                  <tr key={order.orderID}>
                    <td>#{order.orderID}</td>
                    <td className="font-semibold">{order.productName}</td>
                    <td>{order.quantity}</td>
                    <td>{order.productStock}</td>
                    <td className="text-red-600 font-bold">{order.quantity - order.productStock}</td>
                    <td>
                      <button 
                        onClick={() => { setFormData({...formData, productID: order.productID.toString(), quantity: (order.quantity - order.productStock).toString()}); setShowModal(true); }}
                        className="px-3 py-1 bg-warning text-white rounded text-sm hover:bg-yellow-600"
                      >
                        Manufacture Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card w-full max-w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table min-w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mfgOrders.map(mfg => (
                <tr key={mfg.mfgID}>
                  <td>#{mfg.mfgID}</td>
                  <td>{mfg.productName}</td>
                  <td>{mfg.quantity}</td>
                  <td><span className={`badge badge-${mfg.status}`}>{mfg.status}</span></td>
                  <td>{mfg.startDate ? new Date(mfg.startDate).toLocaleDateString() : '-'}</td>
                  <td>{mfg.endDate ? new Date(mfg.endDate).toLocaleDateString() : '-'}</td>
                  <td>
                    {mfg.status === 'pending' && <button onClick={() => handleStartClick(mfg.mfgID)} className="text-accent hover:underline mr-3">Start</button>}
                    {mfg.status === 'in_progress' && <button onClick={() => handleComplete(mfg.mfgID)} className="text-success hover:underline">Complete</button>}
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
            <h2 className="text-xl font-bold mb-4">New Manufacturing Order</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <select className="input" value={formData.productID} onChange={e => setFormData({...formData, productID: e.target.value})} required>
                  <option value="">Select Product</option>
                  {allProducts.map(p => <option key={p.productID} value={p.productID}>{p.name}</option>)}
                </select>
                <input type="number" placeholder="Quantity" className="input" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaterialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Select Raw Materials</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Add Material</label>
                <select 
                  className="input" 
                  onChange={(e) => { if (e.target.value) handleAddMaterial(parseInt(e.target.value)); e.target.value = ''; }}
                >
                  <option value="">Select a material to add</option>
                  {materials.map(m => <option key={m.materialID} value={m.materialID}>{m.name} (Available: {m.quantity} {m.unit})</option>)}
                </select>
              </div>
              
              {selectedMaterials.length > 0 && (
                <div className="border rounded p-3">
                  <h3 className="font-semibold mb-2">Materials to Use:</h3>
                  {selectedMaterials.map(m => (
                    <div key={m.materialID} className="flex items-center justify-between mb-2">
                      <span className="text-sm">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="1" 
                          max={m.available} 
                          value={m.quantity} 
                          onChange={(e) => handleMaterialQuantityChange(m.materialID, e.target.value)}
                          className="input w-20"
                        />
                        <span className="text-xs text-gray-500">/ {m.available} available</span>
                        <button type="button" onClick={() => handleRemoveMaterial(m.materialID)} className="text-red-500 hover:text-red-700">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setShowMaterialsModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleStart} className="btn btn-primary">Start Manufacturing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Manufacturing;