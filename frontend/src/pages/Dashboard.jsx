import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboard, getOrders, getPredictions, getBills } from '../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  useEffect(() => {
    fetchDashboard();
    if (user?.role === 'admin' || user?.role === 'manager') {
      fetchPredictions();
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const [dashRes, ordersRes, billsRes] = await Promise.all([
        getDashboard(),
        getOrders(),
        getBills()
      ]);
      setData(dashRes.data);
      setOrders(ordersRes.data);
      setBills(billsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const res = await getPredictions();
      setPredictions(res.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const getWorkflowStepLabel = (step) => {
    const steps = {
      'received': 'Order Received',
      'stock_verified': 'Stock Verified',
      'stock_partial': 'Partial Stock',
      'stock_unavailable': 'Stock Unavailable',
      'stock_available': 'Stock Available',
      'manufacturing': 'In Manufacturing',
      'billing': 'Billing',
      'processing': 'Processing',
      'completed': 'Completed'
    };
    return steps[step] || step;
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const processingOrders = orders.filter(o => o.status === 'processing');
  const stockUnavailable = orders.filter(o => o.workflowStep === 'stock_unavailable');
  
  const paidBills = bills.filter(b => b.paymentStatus === 'paid');
  const pendingBills = bills.filter(b => b.paymentStatus === 'pending');
  const dealerBills = bills.filter(b => b.billType !== 'supplier');
  const supplierBills = bills.filter(b => b.billType === 'supplier');
  const dealerReceived = dealerBills.filter(b => b.paymentStatus === 'paid');
  const dealerPending = dealerBills.filter(b => b.paymentStatus === 'pending');
  const supplierPaid = supplierBills.filter(b => b.paymentStatus === 'paid');
  const supplierPending = supplierBills.filter(b => b.paymentStatus === 'pending');
  const totalEarnings = paidBills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const pendingPayments = pendingBills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalDealerReceived = dealerReceived.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalDealerPending = dealerPending.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSupplierPaid = supplierPaid.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSupplierPending = supplierPending.reduce((sum, b) => sum + (b.amount || 0), 0);
  const netEarnings = totalDealerReceived - totalSupplierPaid;

  return (
    <div className="space-y-6 w-full max-w-full">
      <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-primary">{data?.stats?.totalOrders || 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-warning">{pendingOrders.length}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{processingOrders.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-success">{completedOrders.length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white cursor-pointer hover:opacity-90" onClick={() => setShowEarningsModal(true)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Earnings</p>
              <p className="text-2xl font-bold">${netEarnings.toFixed(2)}</p>
              <p className="text-xs opacity-70 mt-1">Click to view details</p>
            </div>
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0-1V7m-3 1h6M6 6h12v12H6z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <p className="text-sm opacity-80">Pending Payments</p>
          <p className="text-2xl font-bold">${pendingPayments.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Paid Bills</p>
          <p className="text-2xl font-bold text-success">{paidBills.length}</p>
        </div>
      </div>

      {(data?.lowStockProducts?.length > 0 || data?.lowStockMaterials?.length > 0 || stockUnavailable.length > 0) && (
        <div className="card border-l-4 border-warning">
          <h3 className="text-lg font-semibold text-warning mb-4">Alerts</h3>
          <div className="space-y-2">
            {stockUnavailable.length > 0 && (
              <div className="flex items-center text-danger">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{stockUnavailable.length} order(s) require manufacturing (stock unavailable)</span>
              </div>
            )}
            {data?.lowStockProducts?.map(product => (
              <div key={product.productID} className="flex justify-between items-center">
                <span>Product: {product.name}</span>
                <span className="text-danger">Stock: {product.stock} (Reorder: {product.reorderLevel})</span>
              </div>
            ))}
            {data?.lowStockMaterials?.map(material => (
              <div key={material.materialID} className="flex justify-between items-center">
                <span>Material: {material.name}</span>
                <span className="text-danger">Qty: {material.quantity} (Reorder: {material.reorderLevel})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Workflow</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(order => (
                  <tr key={order.orderID}>
                    <td>#{order.orderID}</td>
                    <td>{order.productName}</td>
                    <td>
                      <span className="text-xs">{getWorkflowStepLabel(order.workflowStep)}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${order.status}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Dealers</span>
              <span className="font-semibold">{data?.stats?.totalDealers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Suppliers</span>
              <span className="font-semibold">{data?.stats?.totalSuppliers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold">${(data?.stats?.totalRevenue || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Payments</span>
              <span className="font-semibold">${(data?.stats?.pendingPayments || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {(user?.role === 'admin' || user?.role === 'manager') && predictions && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">AI Predictions & Suggestions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Stock Status</h4>
              {predictions.predictions?.map(p => (
                <div key={p.productID} className="flex justify-between py-2 border-b">
                  <span>{p.name}</span>
                  <span className={`badge ${p.status === 'Critical' ? 'badge-cancelled' : p.status === 'Warning' ? 'badge-pending' : 'badge-completed'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium mb-2">Reorder Suggestions</h4>
              {predictions.suggestions?.length > 0 ? (
                predictions.suggestions.map((s, idx) => (
                  <div key={idx} className="py-2 border-b">
                    <p className="font-medium">{s.product}</p>
                    <p className="text-sm text-gray-600">{s.suggestion}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No suggestions</p>
              )}
              {predictions.bestSupplier && (
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <p className="font-medium text-success">Best Supplier</p>
                  <p className="text-sm">{predictions.bestSupplier.companyName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEarningsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-secondary">Earnings Details</h2>
              <button onClick={() => setShowEarningsModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Payments Received (Dealers)</p>
                <p className="text-2xl font-bold text-green-600">${totalDealerReceived.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{dealerReceived.length} bills</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Payments Paid (Suppliers)</p>
                <p className="text-2xl font-bold text-blue-600">${totalSupplierPaid.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{supplierPaid.length} bills</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Pending from Dealers</p>
                <p className="text-2xl font-bold text-yellow-600">${totalDealerPending.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{dealerPending.length} bills</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Pending to Suppliers</p>
                <p className="text-2xl font-bold text-orange-600">${totalSupplierPending.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{supplierPending.length} bills</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Net Earnings</span>
                <span className={`font-bold text-2xl ${netEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${netEarnings.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Total Received - Total Paid</p>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-3">Dealer Payments (Received)</h3>
              {dealerReceived.length === 0 ? (
                <p className="text-gray-500">No payments received</p>
              ) : (
                <div className="max-h-40 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Bill ID</th>
                        <th className="p-2 text-left">Dealer</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dealerReceived.map(bill => (
                        <tr key={bill.billID} className="border-t">
                          <td className="p-2">#{bill.billID}</td>
                          <td className="p-2">{bill.companyName || '-'}</td>
                          <td className="p-2 text-right font-semibold">${bill.amount?.toFixed(2)}</td>
                          <td className="p-2">{bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-3">Supplier Payments (Paid)</h3>
              {supplierPaid.length === 0 ? (
                <p className="text-gray-500">No payments made</p>
              ) : (
                <div className="max-h-40 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Bill ID</th>
                        <th className="p-2 text-left">Supplier</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierPaid.map(bill => (
                        <tr key={bill.billID} className="border-t">
                          <td className="p-2">#{bill.billID}</td>
                          <td className="p-2">{bill.supplierName || '-'}</td>
                          <td className="p-2 text-right font-semibold">${bill.amount?.toFixed(2)}</td>
                          <td className="p-2">{bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;