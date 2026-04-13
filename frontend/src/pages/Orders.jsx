import { useState, useEffect } from 'react';
import { getOrders, getProducts, getDealers, createOrder, updateOrder, generateBill } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [formData, setFormData] = useState({ productID: '', quantity: '', dealerID: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([getOrders(), getProducts()]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      if (user?.role === 'admin' || user?.role === 'manager') {
        const dealersRes = await getDealers();
        setDealers(dealersRes.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOrder(formData);
      setShowModal(false);
      setFormData({ productID: '', quantity: '', dealerID: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error creating order');
    }
  };

  const handleProcessOrder = (order) => {
    setSelectedOrder(order);
    setShowBillModal(true);
  };

  const handleGenerateBill = async () => {
    try {
      await generateBill(selectedOrder.orderID, { dueDate, expectedDeliveryDate });
      setShowBillModal(false);
      setDueDate('');
      setExpectedDeliveryDate('');
      setSelectedOrder(null);
      fetchData();
      toast.success('Bill generated successfully. Dealer has been notified.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error generating bill');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateOrder(id, { status });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating order');
    }
  };

  const getWorkflowStepLabel = (step) => {
    const steps = {
      'received': 'Order Received',
      'stock_verified': 'Stock Verified',
      'stock_partial': 'Partial Stock',
      'stock_unavailable': 'Stock Unavailable',
      'stock_available': 'Stock Now Available',
      'manufacturing': 'In Manufacturing',
      'billing': 'Billed',
      'processing': 'Processing',
      'completed': 'Completed'
    };
    return steps[step] || step;
  };

  const getWorkflowStepColor = (step) => {
    const colors = {
      'received': 'bg-gray-100 text-gray-800',
      'stock_verified': 'bg-green-100 text-green-800',
      'stock_partial': 'bg-yellow-100 text-yellow-800',
      'stock_unavailable': 'bg-red-100 text-red-800',
      'stock_available': 'bg-blue-100 text-blue-800',
      'manufacturing': 'bg-purple-100 text-purple-800',
      'billing': 'bg-orange-100 text-orange-800',
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[step] || 'bg-gray-100 text-gray-800';
  };

  const getAvailabilityBadge = (availability) => {
    const badges = {
      'available': { label: 'In Stock', color: 'bg-green-100 text-green-800' },
      'partial': { label: 'Partial', color: 'bg-yellow-100 text-yellow-800' },
      'unavailable': { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    };
    return badges[availability] || { label: 'Unknown', color: 'bg-gray-100' };
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const filteredOrders = orders.filter(o => 
    o.orderID?.toString().includes(searchQuery) ||
    o.productName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl font-bold text-secondary">Orders</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        {(user?.role === 'dealer' || user?.role === 'admin') && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">New Order</button>
        )}
      </div>

      <div className="card w-full max-w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table min-w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                {user?.role === 'admin' || user?.role === 'manager' ? <th>Dealer</th> : null}
                <th>Qty</th>
                <th>Amount</th>
                <th>Availability</th>
                <th>Due Date</th>
                <th>Expected Delivery</th>
                <th>Payment</th>
                <th>Workflow</th>
                <th>Status</th>
                <th>Date</th>
                {(user?.role === 'admin' || user?.role === 'manager') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const availability = getAvailabilityBadge(order.availability);
                return (
                  <tr key={order.orderID}>
                    <td>#{order.orderID}</td>
                    <td>{order.productName}</td>
                    {user?.role === 'admin' || user?.role === 'manager' ? <td>{order.companyName || '-'}</td> : null}
                    <td>{order.quantity}</td>
                    <td>${order.totalAmount?.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${availability.color}`}>{availability.label}</span>
                    </td>
                    <td>{order.billDueDate ? new Date(order.billDueDate).toLocaleDateString() : '-'}</td>
                    <td>{order.billDeliveryDate ? new Date(order.billDeliveryDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-completed' : order.paymentStatus === 'pending' ? 'badge-pending' : 'bg-gray-100 text-gray-800'}`}>
                        {order.paymentStatus || 'No Bill'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getWorkflowStepColor(order.workflowStep)}`}>
                        {getWorkflowStepLabel(order.workflowStep)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${order.status}`}>{order.status}</span>
                    </td>
                    <td>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</td>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <td>
                        {order.workflowStep !== 'billing' && order.status !== 'completed' && (
                          <button 
                            onClick={() => handleProcessOrder(order)}
                            className="text-accent hover:underline mr-3 text-sm"
                          >
                            Generate Bill
                          </button>
                        )}
                        {order.workflowStep === 'billing' && (
                          <span className="text-green-600 text-sm mr-3 font-semibold">Billed</span>
                        )}
                        <select
                          className="text-sm border rounded px-2 py-1"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.orderID, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Order</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <select className="input" value={formData.productID} onChange={e => setFormData({...formData, productID: e.target.value})} required>
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.productID} value={p.productID}>
                      {p.name} - ${p.price} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
                <input type="number" placeholder="Quantity" className="input" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <select className="input" value={formData.dealerID} onChange={e => setFormData({...formData, dealerID: e.target.value})} required>
                    <option value="">Select Dealer</option>
                    {dealers.map(d => <option key={d.dealerID} value={d.dealerID}>{d.companyName}</option>)}
                  </select>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBillModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Generate Bill</h2>
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Order #{selectedOrder.orderID}</p>
                <p className="font-semibold">{selectedOrder.productName}</p>
                <p className="text-lg font-bold text-primary">${selectedOrder.totalAmount?.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Payment Due Date (optional)</label>
                <input 
                  type="date" 
                  className="input" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Expected Delivery Date (optional)</label>
                <input 
                  type="date" 
                  className="input" 
                  value={expectedDeliveryDate} 
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => { setShowBillModal(false); setDueDate(''); setExpectedDeliveryDate(''); setSelectedOrder(null); }} className="btn btn-secondary">Cancel</button>
              <button type="button" onClick={handleGenerateBill} className="btn btn-primary">Generate Bill</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;