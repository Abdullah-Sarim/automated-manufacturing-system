import { useState, useEffect } from 'react';
import { getBills, getQuotations } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SupplierBills = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [billsRes, quotesRes] = await Promise.all([getBills(), getQuotations()]);
      setBills(billsRes.data);
      setQuotations(quotesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuotationInfo = (quoteNumber) => {
    return quotations.find(q => q.quoteID === quoteNumber);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const pendingBills = bills.filter(b => b.paymentStatus === 'pending');
  const paidBills = bills.filter(b => b.paymentStatus === 'paid');
  const totalPending = pendingBills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalReceivable = paidBills.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">My Bills</h1>
      <p className="text-gray-600">View bills for your raw material supplies. Admin will make payments to you.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <p className="text-sm opacity-80">Pending Payment</p>
          <p className="text-3xl font-bold">{pendingBills.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">Received Payments</p>
          <p className="text-3xl font-bold">{paidBills.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-80">Total Received</p>
          <p className="text-3xl font-bold">${totalReceivable.toFixed(2)}</p>
        </div>
      </div>

      {pendingBills.length > 0 && (
        <div className="card border-l-4 border-yellow-400">
          <h2 className="text-xl font-semibold mb-4 text-yellow-700">Awaiting Payment from Admin</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Quotation</th>
                <th>Material</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingBills.map(bill => {
                const quote = getQuotationInfo(bill.quoteNumber);
                return (
                  <tr key={bill.billID}>
                    <td>#{bill.billID}</td>
                    <td>#{bill.quoteNumber}</td>
                    <td>{bill.materialName || quote?.materialName || '-'}</td>
                    <td className="font-bold">${bill.amount?.toFixed(2)}</td>
                    <td>{bill.dueDate || '-'}</td>
                    <td><span className="badge badge-pending">Awaiting Payment</span></td>
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
                <th>Quotation</th>
                <th>Material</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Paid Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => {
                const quote = getQuotationInfo(bill.quoteNumber);
                return (
                  <tr key={bill.billID}>
                    <td>#{bill.billID}</td>
                    <td>#{bill.quoteNumber}</td>
                    <td>{bill.materialName || quote?.materialName || '-'}</td>
                    <td>${bill.amount?.toFixed(2)}</td>
                    <td>{bill.dueDate || '-'}</td>
                    <td>{bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge badge-${bill.paymentStatus}`}>
                        {bill.paymentStatus === 'paid' ? 'Paid Received' : 'Pending'}
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

export default SupplierBills;