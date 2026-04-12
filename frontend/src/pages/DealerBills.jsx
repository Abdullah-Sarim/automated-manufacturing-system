import { useState, useEffect } from 'react';
import { getBills, payBill, getOrders } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DealerBills = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [billsRes, ordersRes] = await Promise.all([getBills(), getOrders()]);
      setBills(billsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id) => {
    try {
      await payBill(id);
      fetchData();
      toast.success('Payment processed successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error processing payment');
    }
  };

  const getOrderInfo = (orderNumber) => {
    return orders.find(o => o.orderID === orderNumber);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const pendingBills = bills.filter(b => b.paymentStatus === 'pending');
  const paidBills = bills.filter(b => b.paymentStatus === 'paid');
  const totalPending = pendingBills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalPaid = paidBills.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">My Bills</h1>
      <p className="text-gray-600">View and manage your bills for product orders.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <p className="text-sm opacity-80">Pending Bills</p>
          <p className="text-3xl font-bold">{pendingBills.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-80">Paid Bills</p>
          <p className="text-3xl font-bold">{paidBills.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">Total Paid Amount</p>
          <p className="text-3xl font-bold">${totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {pendingBills.length > 0 && (
        <div className="card border-l-4 border-yellow-400">
          <h2 className="text-xl font-semibold mb-4 text-yellow-700">Pending Payments</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Order</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Expected Delivery</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingBills.map(bill => {
                const order = getOrderInfo(bill.orderNumber);
                return (
                  <tr key={bill.billID}>
                    <td>#{bill.billID}</td>
                    <td>#{bill.orderNumber}</td>
                    <td>{bill.productName || order?.productName || '-'}</td>
                    <td className="font-bold">${bill.amount?.toFixed(2)}</td>
                    <td>{bill.dueDate || '-'}</td>
                    <td>{bill.expectedDeliveryDate || '-'}</td>
                    <td>
                      <button 
                        onClick={() => handlePay(bill.billID)} 
                        className="px-4 py-2 bg-success text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Pay Now
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        {bills.length === 0 ? (
          <p className="text-gray-500">No bills yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Order</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Expected Delivery</th>
                <th>Paid Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => {
                const order = getOrderInfo(bill.orderNumber);
                return (
                  <tr key={bill.billID}>
                    <td>#{bill.billID}</td>
                    <td>#{bill.orderNumber}</td>
                    <td>{bill.productName || order?.productName || '-'}</td>
                    <td>${bill.amount?.toFixed(2)}</td>
                    <td>{bill.dueDate || '-'}</td>
                    <td>{bill.expectedDeliveryDate || '-'}</td>
                    <td>{bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge badge-${bill.paymentStatus}`}>
                        {bill.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DealerBills;