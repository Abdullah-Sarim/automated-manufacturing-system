import { useState, useEffect } from 'react';
import { getManufacturingOrders, getOrders, getProducts, createManufacturingOrder, startManufacturing, completeManufacturing } from '../utils/api';
import toast from 'react-hot-toast';

const Manufacturing = () => {
  const [orders, setOrders] = useState([]);
  const [mfgOrders, setMfgOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ orderID: '', productID: '', quantity: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [mfgRes, ordersRes, productsRes] = await Promise.all([getManufacturingOrders(), getOrders(), getProducts()]);
      setMfgOrders(mfgRes.data);
      setOrders(ordersRes.data.filter(o => o.status !== 'completed'));
      setAllProducts(productsRes.data);
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

  const handleStart = async (id) => {
    try {
      await startManufacturing(id);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">Manufacturing Orders</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">New Manufacturing Order</button>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="card border-l-4 border-orange-500">
          <h2 className="text-xl font-semibold mb-4 text-orange-700">Products Needing Manufacturing</h2>
          <table className="table">
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
      )}

      {partialOrders.length > 0 && (
        <div className="card border-l-4 border-yellow-500">
          <h2 className="text-xl font-semibold mb-4 text-yellow-700">Orders with Partial Stock Availability</h2>
          <table className="table">
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
      )}

      <div className="card">
        <table className="table">
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
                  {mfg.status === 'pending' && <button onClick={() => handleStart(mfg.mfgID)} className="text-accent hover:underline mr-3">Start</button>}
                  {mfg.status === 'in_progress' && <button onClick={() => handleComplete(mfg.mfgID)} className="text-success hover:underline">Complete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </div>
  );
};

export default Manufacturing;