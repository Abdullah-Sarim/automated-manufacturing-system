import { useState, useEffect } from 'react';
import { getBills, getOrders, getDealers, createBill, updateBill, payBill, deleteBill } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Bills = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ orderID: '', dealerID: '', amount: '', dueDate: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [billsRes, ordersRes] = await Promise.all([getBills(), getOrders()]);
      setBills(billsRes.data);
      setOrders(ordersRes.data);
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
      await createBill(formData);
      setShowModal(false);
      setFormData({ orderID: '', dealerID: '', amount: '', dueDate: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error creating bill');
    }
  };

const handlePay = async (id) => {
    try {
      await payBill(id);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error processing payment');
    }
  };

  const billsWithDeliveryDate = bills.filter(b => b.expectedDeliveryDate);
  const getIsSupplierBill = (bill) => bill && bill.billType === 'supplier';

  if (loading) return <div className="p-6">Loading...</div>;

  const dealerBills = bills.filter(b => b.billType !== 'supplier');
  const supplierBills = bills.filter(b => b.billType === 'supplier');
  
  const dealerPaid = dealerBills.filter(b => b.paymentStatus === 'paid');
  const dealerPending = dealerBills.filter(b => b.paymentStatus === 'pending');
  const supplierPaid = supplierBills.filter(b => b.paymentStatus === 'paid');
  const supplierPending = supplierBills.filter(b => b.paymentStatus === 'pending');
  
  const totalDealerPaid = dealerPaid.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalDealerPending = dealerPending.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSupplierPaid = supplierPaid.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSupplierPending = supplierPending.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">Bills</h1>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">New Bill</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-green-50">
          <h2 className="text-xl font-semibold mb-4 text-green-700">Dealer Payments (Received)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Paid Bills</p>
              <p className="text-2xl font-bold text-green-600">{dealerPaid.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Bills</p>
              <p className="text-2xl font-bold text-yellow-600">{dealerPending.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Received</p>
              <p className="text-xl font-bold text-green-600">${totalDealerPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Pending</p>
              <p className="text-xl font-bold text-yellow-600">${totalDealerPending.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card bg-blue-50">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Supplier Payments (Paid)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Paid Bills</p>
              <p className="text-2xl font-bold text-blue-600">{supplierPaid.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Bills</p>
              <p className="text-2xl font-bold text-yellow-600">{supplierPending.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Paid</p>
              <p className="text-xl font-bold text-blue-600">${totalSupplierPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Pending</p>
              <p className="text-xl font-bold text-yellow-600">${totalSupplierPending.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              {user?.role === 'admin' || user?.role === 'manager' ? <th>Dealer/Supplier</th> : null}
              <th>Amount</th>
              <th>Due Date</th>
              <th>Expected Delivery</th>
              {user?.role === 'admin' || user?.role === 'manager' ? <th>Paid Date</th> : null}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => {
              const isSupplier = getIsSupplierBill(bill);
              return (
                <tr key={bill.billID}>
                  <td>#{bill.billID}</td>
                  <td>{isSupplier ? 'Supplier' : 'Dealer'}</td>
                  {user?.role === 'admin' || user?.role === 'manager' ? <td>{bill.supplierName || bill.companyName || '-'}</td> : null}
                  <td>${bill.amount?.toFixed(2)}</td>
                  <td>{bill.dueDate || '-'}</td>
                  <td>{bill.expectedDeliveryDate || '-'}</td>
                  {user?.role === 'admin' || user?.role === 'manager' ? <td>{bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : '-'}</td> : null}
                  <td><span className={`badge badge-${bill.paymentStatus}`}>{bill.paymentStatus}</span></td>
                  <td>
                    {bill.paymentStatus === 'pending' && ((user?.role === 'dealer' && !isSupplier) || (user?.role === 'admin' && isSupplier)) && (
                      <button onClick={() => handlePay(bill.billID)} className="text-success hover:underline">Pay Now</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Bill</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <select className="input" value={formData.orderID} onChange={e => setFormData({...formData, orderID: e.target.value})} required>
                  <option value="">Select Order</option>
                  {orders.map(o => <option key={o.orderID} value={o.orderID}>#{o.orderID} - {o.productName}</option>)}
                </select>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <select className="input" value={formData.dealerID} onChange={e => setFormData({...formData, dealerID: e.target.value})} required>
                    <option value="">Select Dealer</option>
                    {dealers.map(d => <option key={d.dealerID} value={d.dealerID}>{d.companyName}</option>)}
                  </select>
                )}
                <input type="number" placeholder="Amount" className="input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                <input type="date" className="input" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
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

export default Bills;