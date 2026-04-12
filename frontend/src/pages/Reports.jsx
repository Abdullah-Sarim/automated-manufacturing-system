import { useState, useEffect } from 'react';
import { getSalesReport, getStockReport, getSupplierReport, getOrders, getBills, getManufacturingOrders } from '../utils/api';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  Truck,
  Factory,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Reports = () => {
  const [period, setPeriod] = useState('month');
  const [salesData, setSalesData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [supplierData, setSupplierData] = useState(null);
  const [ordersData, setOrdersData] = useState([]);
  const [billsData, setBillsData] = useState([]);
  const [mfgData, setMfgData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => { fetchData(); }, [period, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, stockRes, supplierRes, ordersRes, billsRes, mfgRes] = await Promise.all([
        getSalesReport(period),
        getStockReport(),
        getSupplierReport(),
        getOrders(),
        getBills(),
        getManufacturingOrders()
      ]);
      setSalesData(salesRes.data);
      setStockData(stockRes.data);
      setSupplierData(supplierRes.data);
      setOrdersData(ordersRes.data);
      setBillsData(billsRes.data);
      setMfgData(mfgRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false };

  const salesChartData = {
    labels: salesData?.salesByMonth?.map(s => s.month) || [],
    datasets: [{
      label: 'Sales',
      data: salesData?.salesByMonth?.map(s => s.total) || [],
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
      fill: false,
    }]
  };

  const productChartData = {
    labels: salesData?.salesByProduct?.slice(0, 5).map(s => s.name) || [],
    datasets: [{
      data: salesData?.salesByProduct?.slice(0, 5).map(s => s.total) || [],
      backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
    }]
  };

  const dealerChartData = {
    labels: salesData?.salesByDealer?.slice(0, 5).map(d => d.companyName) || [],
    datasets: [{
      label: 'Revenue ($)',
      data: salesData?.salesByDealer?.slice(0, 5).map(d => d.total) || [],
      backgroundColor: '#22c55e',
    }]
  };

  const stockChartData = {
    labels: stockData?.products?.slice(0, 8).map(p => p.name) || [],
    datasets: [{
      label: 'Stock',
      data: stockData?.products?.slice(0, 8).map(p => p.stock) || [],
      backgroundColor: '#3b82f6',
    }]
  };

  const stockStatusData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [{
      data: [
        stockData?.products?.filter(p => p.stock > p.reorderLevel).length || 0,
        stockData?.products?.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length || 0,
        stockData?.products?.filter(p => p.stock === 0).length || 0,
      ],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
    }]
  };

  const orderStatusData = {
    labels: ['Pending', 'Processing', 'Completed', 'Cancelled'],
    datasets: [{
      data: [
        ordersData.filter(o => o.status === 'pending').length,
        ordersData.filter(o => o.status === 'processing').length,
        ordersData.filter(o => o.status === 'completed').length,
        ordersData.filter(o => o.status === 'cancelled').length,
      ],
      backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444'],
    }]
  };

  const totalRevenue = billsData.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalPending = billsData.filter(b => b.paymentStatus === 'pending').reduce((sum, b) => sum + (b.amount || 0), 0);

  if (loading) return <div className="p-6">Loading...</div>;

  const tabs = [
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'supplier', label: 'Supplier', icon: Truck },
    { id: 'manufacturing', label: 'Manufacturing', icon: Factory },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="input w-32">
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <button onClick={() => window.print()} className="btn btn-secondary">Print</button>
        </div>
      </div>

      <div className="flex space-x-2 flex-wrap">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${activeTab === tab.id ? 'bg-accent text-white' : 'bg-gray-200'}`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-primary">${(salesData?.salesByMonth?.reduce((s, m) => s + m.total, 0) || 0).toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-primary">{salesData?.salesByMonth?.reduce((s, m) => s + m.orders, 0) || 0}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Active Dealers</p>
              <p className="text-2xl font-bold text-primary">{salesData?.salesByDealer?.length || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
              <div className="h-64">
                <Line data={salesChartData} options={chartOptions} />
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Sales by Product</h3>
              <div className="h-64">
                <Doughnut data={productChartData} options={chartOptions} />
              </div>
            </div>

            <div className="card lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Revenue by Dealer</h3>
              <div className="h-64">
                <Bar data={dealerChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-yellow-50">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{ordersData.filter(o => o.status === 'pending').length}</p>
            </div>
            <div className="card bg-blue-50">
              <p className="text-sm text-gray-500">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{ordersData.filter(o => o.status === 'processing').length}</p>
            </div>
            <div className="card bg-green-50">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{ordersData.filter(o => o.status === 'completed').length}</p>
            </div>
            <div className="card bg-red-50">
              <p className="text-sm text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{ordersData.filter(o => o.status === 'cancelled').length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
              <div className="h-64">
                <Pie data={orderStatusData} options={chartOptions} />
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Availability Overview</h3>
              <div className="h-64">
                <Pie data={{
                  labels: ['Available', 'Partial', 'Unavailable'],
                  datasets: [{
                    data: [
                      ordersData.filter(o => o.availability === 'available').length,
                      ordersData.filter(o => o.availability === 'partial').length,
                      ordersData.filter(o => o.availability === 'unavailable').length,
                    ],
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                  }]
                }} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">All Orders</h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Dealer</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Workflow</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersData.slice(0, 20).map(order => (
                    <tr key={order.orderID}>
                      <td>#{order.orderID}</td>
                      <td>{order.productName}</td>
                      <td>{order.companyName || '-'}</td>
                      <td>{order.quantity}</td>
                      <td>${order.totalAmount?.toFixed(2)}</td>
                      <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                      <td><span className="text-xs">{order.workflowStep}</span></td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-green-50">
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-green-600">{stockData?.products?.length || 0}</p>
            </div>
            <div className="card bg-yellow-50">
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stockData?.products?.filter(p => p.stock <= p.reorderLevel).length || 0}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Stock Value</p>
              <p className="text-2xl font-bold text-primary">${(stockData?.stockValue || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Stock Levels</h3>
              <div className="h-64">
                <Bar data={stockChartData} options={chartOptions} />
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Stock Status</h3>
              <div className="h-64">
                <Pie data={stockStatusData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Products Inventory</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stockData?.products?.map(p => (
                  <tr key={p.productID}>
                    <td className="font-semibold">{p.name}</td>
                    <td>${p.price?.toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td>{p.reorderLevel}</td>
                    <td>${(p.price * p.stock).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-cancelled' : p.stock <= p.reorderLevel ? 'badge-pending' : 'badge-completed'}`}>
                        {p.stock === 0 ? 'Out of Stock' : p.stock <= p.reorderLevel ? 'Low Stock' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Raw Materials</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stockData?.materials?.map(m => (
                  <tr key={m.materialID}>
                    <td className="font-semibold">{m.name}</td>
                    <td>{m.quantity}</td>
                    <td>{m.unit}</td>
                    <td>{m.reorderLevel}</td>
                    <td>
                      <span className={`badge ${m.quantity <= m.reorderLevel ? 'badge-cancelled' : 'badge-completed'}`}>
                        {m.quantity <= m.reorderLevel ? 'Low Stock' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-green-50">
              <p className="text-sm text-gray-500">Total Received</p>
              <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="card bg-yellow-50">
              <p className="text-sm text-gray-500">Pending Payment</p>
              <p className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Revenue vs Pending</h3>
              <div className="h-64">
                <Pie data={{
                  labels: ['Received', 'Pending'],
                  datasets: [{
                    data: [totalRevenue, totalPending],
                    backgroundColor: ['#22c55e', '#f59e0b'],
                  }]
                }} options={chartOptions} />
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Bill Status Distribution</h3>
              <div className="h-64">
                <Pie data={{
                  labels: ['Paid', 'Pending'],
                  datasets: [{
                    data: [
                      billsData.filter(b => b.paymentStatus === 'paid').length,
                      billsData.filter(b => b.paymentStatus === 'pending').length,
                    ],
                    backgroundColor: ['#22c55e', '#f59e0b'],
                  }]
                }} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">All Bills</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Paid Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {billsData.map(bill => (
                  <tr key={bill.billID}>
                    <td>#{bill.billID}</td>
                    <td className="capitalize">{bill.billType}</td>
                    <td className="font-bold">${bill.amount?.toFixed(2)}</td>
                    <td>{bill.dueDate || '-'}</td>
                    <td>{bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge badge-${bill.paymentStatus}`}>
                        {bill.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'supplier' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-sm text-gray-500">Total Suppliers</p>
              <p className="text-2xl font-bold text-primary">{supplierData?.suppliers?.length || 0}</p>
            </div>
            <div className="card bg-green-50">
              <p className="text-sm text-gray-500">Approved Quotes</p>
              <p className="text-2xl font-bold text-green-600">{supplierData?.suppliers?.reduce((s, sup) => s + (sup.approvedQuotes || 0), 0) || 0}</p>
            </div>
            <div className="card bg-blue-50">
              <p className="text-sm text-gray-500">Total Quotes</p>
              <p className="text-2xl font-bold text-blue-600">{supplierData?.suppliers?.reduce((s, sup) => s + (sup.totalQuotes || 0), 0) || 0}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Supplier Performance</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Total Quotes</th>
                  <th>Approved</th>
                  <th>Approval Rate</th>
                </tr>
              </thead>
              <tbody>
                {supplierData?.suppliers?.map(s => (
                  <tr key={s.supplierID}>
                    <td className="font-semibold">{s.companyName}</td>
                    <td>{s.contactPerson}</td>
                    <td>{s.totalQuotes}</td>
                    <td>{s.approvedQuotes}</td>
                    <td>
                      <span className={`badge ${s.totalQuotes > 0 && s.approvedQuotes / s.totalQuotes >= 0.5 ? 'badge-completed' : 'badge-pending'}`}>
                        {s.totalQuotes > 0 ? Math.round(s.approvedQuotes / s.totalQuotes * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'manufacturing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-yellow-50">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{mfgData.filter(m => m.status === 'pending').length}</p>
            </div>
            <div className="card bg-blue-50">
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{mfgData.filter(m => m.status === 'in_progress').length}</p>
            </div>
            <div className="card bg-green-50">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{mfgData.filter(m => m.status === 'completed').length}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Manufacturing Orders</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {mfgData.map(mfg => (
                  <tr key={mfg.mfgID}>
                    <td>#{mfg.mfgID}</td>
                    <td className="font-semibold">{mfg.productName}</td>
                    <td>{mfg.quantity}</td>
                    <td>
                      <span className={`badge badge-${mfg.status === 'completed' ? 'completed' : mfg.status === 'in_progress' ? 'processing' : 'pending'}`}>
                        {mfg.status}
                      </span>
                    </td>
                    <td>{mfg.startDate ? new Date(mfg.startDate).toLocaleDateString() : '-'}</td>
                    <td>{mfg.endDate ? new Date(mfg.endDate).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;