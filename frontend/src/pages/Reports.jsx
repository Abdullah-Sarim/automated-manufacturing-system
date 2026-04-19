import { useState, useEffect, useMemo } from 'react';
import { getSalesReport, getStockReport, getSupplierReport, getOrders, getBills, getManufacturingOrders } from '../utils/api';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { TrendingUp, ShoppingCart, Package, DollarSign, Truck, Factory, Download, Printer, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [period, setPeriod] = useState('month');
  const [salesData, setSalesData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [supplierData, setSupplierData] = useState(null);
  const [ordersData, setOrdersData] = useState([]);
  const [billsData, setBillsData] = useState([]);
  const [mfgData, setMfgData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, stockRes, supplierRes, ordersRes, billsRes, mfgRes] = await Promise.all([
        getSalesReport(period), getStockReport(), getSupplierReport(), getOrders(), getBills(), getManufacturingOrders()
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: { enabled: true }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: { enabled: true }
    },
    scales: {
      y: { beginAtZero: true }
    },
    elements: {
      line: { tension: 0.4 }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: { enabled: true }
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [headers.join(','), ...data.map(row => headers.map(h => row[h] ?? '').join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const salesByProduct = salesData?.salesByProduct || [];
  const salesByDealer = salesData?.salesByDealer || [];
  const products = stockData?.products || [];
  const salesByMonth = salesData?.salesByMonth || [];

  const salesChartData = {
    labels: salesByMonth.map(s => s.month || ''),
    datasets: [{
      label: 'Sales ($)',
      data: salesByMonth.map(s => s.total || 0),
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const productChartData = {
    labels: salesByProduct.slice(0, 5).map(s => s.name || 'Unknown'),
    datasets: [{
      data: salesByProduct.slice(0, 5).map(s => s.total || 0),
      backgroundColor: ['#0ea5e9', '#f59e0b', '#22c55e', '#8b5cf6', '#ec4899'],
      borderWidth: 0
    }]
  };

  const dealerChartData = {
    labels: salesByDealer.slice(0, 5).map(d => d.companyName || 'Unknown'),
    datasets: [{
      label: 'Revenue ($)',
      data: salesByDealer.slice(0, 5).map(d => d.total || 0),
      backgroundColor: '#22c55e',
      borderRadius: 4
    }]
  };

  const stockChartData = {
    labels: products.slice(0, 8).map(p => p.name || 'Unknown'),
    datasets: [{
      label: 'Stock Qty',
      data: products.slice(0, 8).map(p => p.stock || 0),
      backgroundColor: '#0ea5e9',
      borderRadius: 4
    }]
  };

  const stockStatusData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [{
      data: [
        (products || []).filter(p => p.stock > p.reorderLevel).length,
        (products || []).filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length,
        (products || []).filter(p => p.stock === 0).length
      ],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
      borderWidth: 0
    }]
  };

  const orderStatusData = {
    labels: ['Pending', 'Processing', 'Completed', 'Cancelled'],
    datasets: [{
      data: [
        (ordersData || []).filter(o => o.status === 'pending').length,
        (ordersData || []).filter(o => o.status === 'processing').length,
        (ordersData || []).filter(o => o.status === 'completed').length,
        (ordersData || []).filter(o => o.status === 'cancelled').length
      ],
      backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444'],
      borderWidth: 0
    }]
  };

  const totalRevenue = useMemo(() => (billsData || []).filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + (b.amount || 0), 0), [billsData]);
  const totalPending = useMemo(() => (billsData || []).filter(b => b.paymentStatus === 'pending').reduce((sum, b) => sum + (b.amount || 0), 0), [billsData]);

  const totalSales = useMemo(() => (salesData?.salesByMonth || []).reduce((s, m) => s + m.total, 0), [salesData]);
  const totalOrdersCount = useMemo(() => (salesData?.salesByMonth || []).reduce((s, m) => s + m.orders, 0), [salesData]);
  const activeDealers = useMemo(() => salesByDealer.length, [salesByDealer]);
  const totalProducts = useMemo(() => products.length, [products]);
  const lowStockCount = useMemo(() => (products || []).filter(p => p.stock <= p.reorderLevel).length, [products]);
  const stockValue = useMemo(() => (products || []).reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0), [products]);

  const pendingOrders = useMemo(() => (ordersData || []).filter(o => o.status === 'pending').length, [ordersData]);
  const processingOrders = useMemo(() => (ordersData || []).filter(o => o.status === 'processing').length, [ordersData]);
  const completedOrders = useMemo(() => (ordersData || []).filter(o => o.status === 'completed').length, [ordersData]);
  const cancelledOrders = useMemo(() => (ordersData || []).filter(o => o.status === 'cancelled').length, [ordersData]);

  const pendingMfg = useMemo(() => (mfgData || []).filter(m => m.status === 'pending').length, [mfgData]);
  const inProgressMfg = useMemo(() => (mfgData || []).filter(m => m.status === 'in_progress').length, [mfgData]);
  const completedMfg = useMemo(() => (mfgData || []).filter(m => m.status === 'completed').length, [mfgData]);

  const filteredOrders = useMemo(() => {
    let result = ordersData || [];
    if (searchTerm) result = result.filter(o => o.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || o.companyName?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (dateFrom) result = result.filter(o => new Date(o.createdAt) >= new Date(dateFrom));
    if (dateTo) result = result.filter(o => new Date(o.createdAt) <= new Date(dateTo));
    return result;
  }, [ordersData, searchTerm, dateFrom, dateTo]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  );

  const tabs = [
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'supplier', label: 'Supplier', icon: Truck },
    { id: 'manufacturing', label: 'Manufacturing', icon: Factory },
  ];

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <div className="flex gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="input w-32">
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <button onClick={() => window.print()} className="btn btn-secondary">Print</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <p className="text-sm text-blue-600">Total Revenue</p>
          <p className="text-xl font-bold text-blue-800">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-100">
          <p className="text-sm text-green-600">Total Orders</p>
          <p className="text-xl font-bold text-green-800">{(ordersData || []).length}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
          <p className="text-sm text-orange-600">Products</p>
          <p className="text-xl font-bold text-orange-800">{totalProducts}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
          <p className="text-sm text-purple-600">Suppliers</p>
          <p className="text-xl font-bold text-purple-800">{(supplierData?.suppliers || []).length}</p>
        </div>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><p className="text-sm text-gray-500">Total Sales</p><p className="text-xl font-bold text-blue-600">${(totalSales || 0).toFixed(2)}</p></div>
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><p className="text-sm text-gray-500">Total Orders</p><p className="text-xl font-bold text-green-600">{totalOrdersCount}</p></div>
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><p className="text-sm text-gray-500">Active Dealers</p><p className="text-xl font-bold text-purple-600">{activeDealers}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><h3 className="text-lg font-semibold mb-4">Sales Trend</h3><div className="h-64"><Line data={salesChartData} options={lineChartOptions} /></div></div>
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><h3 className="text-lg font-semibold mb-4">Sales by Product</h3><div className="h-64"><Doughnut data={productChartData} options={pieChartOptions} /></div></div>
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200 lg:col-span-2"><h3 className="text-lg font-semibold mb-4">Revenue by Dealer</h3><div className="h-64"><Bar data={dealerChartData} options={chartOptions} /></div></div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100"><p className="text-sm text-yellow-600">Pending</p><p className="text-xl font-bold text-yellow-800">{pendingOrders}</p></div>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100"><p className="text-sm text-blue-600">Processing</p><p className="text-xl font-bold text-blue-800">{processingOrders}</p></div>
            <div className="bg-green-50 rounded-xl p-5 border border-green-100"><p className="text-sm text-green-600">Completed</p><p className="text-xl font-bold text-green-800">{completedOrders}</p></div>
            <div className="bg-red-50 rounded-xl p-5 border border-red-100"><p className="text-sm text-red-600">Cancelled</p><p className="text-xl font-bold text-red-800">{cancelledOrders}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><h3 className="text-lg font-semibold mb-4">Order Status</h3><div className="h-64"><Pie data={orderStatusData} options={pieChartOptions} /></div></div>
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><h3 className="text-lg font-semibold mb-4">Availability</h3><div className="h-64"><Pie data={{ labels: ['Available', 'Partial', 'Unavailable'], datasets: [{ data: [(ordersData || []).filter(o => o.availability === 'available').length, (ordersData || []).filter(o => o.availability === 'partial').length, (ordersData || []).filter(o => o.availability === 'unavailable').length], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 0 }] }} options={pieChartOptions} /></div></div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold">All Orders</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100">Filters</button>
                <button onClick={() => exportToCSV(filteredOrders, 'orders')} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Export CSV</button>
              </div>
            </div>
            {showFilters && (
              <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border">
              <table className="table min-w-full">
                <thead className="bg-gray-50"><tr><th>ID</th><th>Product</th><th>Dealer</th><th>Quantity</th><th>Amount</th><th>Status</th><th>Workflow</th><th>Date</th></tr></thead>
                <tbody>
                  {filteredOrders.slice(0, 20).map(order => (<tr key={order.orderID} className="hover:bg-gray-50"><td>#{order.orderID}</td><td>{order.productName}</td><td>{order.companyName || '-'}</td><td>{order.quantity}</td><td>${(order.totalAmount || 0).toFixed(2)}</td><td><span className={`px-2 py-1 rounded text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'processing' ? 'bg-blue-100 text-blue-700' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{order.status}</span></td><td className="text-xs">{order.workflowStep}</td><td>{new Date(order.createdAt).toLocaleDateString()}</td></tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-5 border border-green-100"><p className="text-sm text-green-600">Total Products</p><p className="text-xl font-bold text-green-800">{totalProducts}</p></div>
            <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100"><p className="text-sm text-yellow-600">Low Stock</p><p className="text-xl font-bold text-yellow-800">{lowStockCount}</p></div>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100"><p className="text-sm text-blue-600">Stock Value</p><p className="text-xl font-bold text-blue-800">${stockValue.toFixed(2)}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><h3 className="text-lg font-semibold mb-4">Stock Levels</h3><div className="h-64"><Bar data={stockChartData} options={chartOptions} /></div></div>
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><h3 className="text-lg font-semibold mb-4">Stock Status</h3><div className="h-64"><Pie data={stockStatusData} options={chartOptions} /></div></div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold">Products Inventory</h3>
              <button onClick={() => exportToCSV(products, 'products')} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Export CSV</button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="table min-w-full">
                <thead className="bg-gray-50"><tr><th>Product</th><th>Price</th><th>Stock</th><th>Reorder Level</th><th>Value</th><th>Status</th></tr></thead>
                <tbody>
                  {products.map(p => (<tr key={p.productID} className="hover:bg-gray-50"><td className="font-medium">{p.name}</td><td>${(p.price || 0).toFixed(2)}</td><td>{p.stock}</td><td>{p.reorderLevel}</td><td>${((p.price || 0) * (p.stock || 0)).toFixed(2)}</td><td><span className={`px-2 py-1 rounded text-xs ${p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock <= p.reorderLevel ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{p.stock === 0 ? 'Out of Stock' : p.stock <= p.reorderLevel ? 'Low Stock' : 'OK'}</span></td></tr>))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Raw Materials</h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="table min-w-full">
                <thead className="bg-gray-50"><tr><th>Material</th><th>Quantity</th><th>Unit</th><th>Reorder Level</th><th>Status</th></tr></thead>
                <tbody>
                  {(stockData?.materials || []).map(m => (<tr key={m.materialID} className="hover:bg-gray-50"><td className="font-medium">{m.name}</td><td>{m.quantity}</td><td>{m.unit}</td><td>{m.reorderLevel}</td><td><span className={`px-2 py-1 rounded text-xs ${m.quantity <= m.reorderLevel ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{m.quantity <= m.reorderLevel ? 'Low Stock' : 'OK'}</span></td></tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-5 border border-green-100"><p className="text-sm text-green-600">Total Received</p><p className="text-xl font-bold text-green-800">${totalRevenue.toFixed(2)}</p></div>
            <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100"><p className="text-sm text-yellow-600">Pending Payment</p><p className="text-xl font-bold text-yellow-800">${totalPending.toFixed(2)}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><h3 className="text-lg font-semibold mb-4">Revenue vs Pending</h3><div className="h-64"><Pie data={{ labels: ['Received', 'Pending'], datasets: [{ data: [totalRevenue, totalPending], backgroundColor: ['#22c55e', '#f59e0b'] }] }} options={chartOptions} /></div></div>
            <div className="bg-white rounded-xl shadow p-4 border border-gray-200"><h3 className="text-lg font-semibold mb-4">Bill Status</h3><div className="h-64"><Pie data={{ labels: ['Paid', 'Pending'], datasets: [{ data: [(billsData || []).filter(b => b.paymentStatus === 'paid').length, (billsData || []).filter(b => b.paymentStatus === 'pending').length], backgroundColor: ['#22c55e', '#f59e0b'] }] }} options={chartOptions} /></div></div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold">All Bills</h3>
              <button onClick={() => exportToCSV(billsData, 'bills')} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Export CSV</button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="table min-w-full">
                <thead className="bg-gray-50"><tr><th>ID</th><th>Type</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th></tr></thead>
                <tbody>
                  {(billsData || []).map(bill => (<tr key={bill.billID} className="hover:bg-gray-50"><td>#{bill.billID}</td><td className="capitalize">{bill.billType}</td><td className="font-medium">${(bill.amount || 0).toFixed(2)}</td><td>{bill.dueDate || '-'}</td><td>{bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : '-'}</td><td><span className={`px-2 py-1 rounded text-xs ${bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{bill.paymentStatus}</span></td></tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'supplier' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100"><p className="text-sm text-blue-600">Total Suppliers</p><p className="text-xl font-bold text-blue-800">{(supplierData?.suppliers || []).length}</p></div>
            <div className="bg-green-50 rounded-xl p-5 border border-green-100"><p className="text-sm text-green-600">Approved Quotes</p><p className="text-xl font-bold text-green-800">{(supplierData?.suppliers || []).reduce((s, sup) => s + (sup.approvedQuotes || 0), 0)}</p></div>
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-100"><p className="text-sm text-purple-600">Total Quotes</p><p className="text-xl font-bold text-purple-800">{(supplierData?.suppliers || []).reduce((s, sup) => s + (sup.totalQuotes || 0), 0)}</p></div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold">Supplier Performance</h3>
              <button onClick={() => exportToCSV(supplierData?.suppliers || [], 'suppliers')} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Export CSV</button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="table min-w-full">
                <thead className="bg-gray-50"><tr><th>Company</th><th>Contact</th><th>Total Quotes</th><th>Approved</th><th>Approval Rate</th></tr></thead>
                <tbody>
                  {(supplierData?.suppliers || []).map(s => (<tr key={s.supplierID} className="hover:bg-gray-50"><td className="font-medium">{s.companyName}</td><td>{s.contactPerson}</td><td>{s.totalQuotes}</td><td>{s.approvedQuotes}</td><td><span className={`px-2 py-1 rounded text-xs ${s.totalQuotes > 0 && s.approvedQuotes / s.totalQuotes >= 0.5 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.totalQuotes > 0 ? Math.round(s.approvedQuotes / s.totalQuotes * 100) : 0}%</span></td></tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manufacturing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100"><p className="text-sm text-yellow-600">Pending</p><p className="text-xl font-bold text-yellow-800">{pendingMfg}</p></div>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100"><p className="text-sm text-blue-600">In Progress</p><p className="text-xl font-bold text-blue-800">{inProgressMfg}</p></div>
            <div className="bg-green-50 rounded-xl p-5 border border-green-100"><p className="text-sm text-green-600">Completed</p><p className="text-xl font-bold text-green-800">{completedMfg}</p></div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold">Manufacturing Orders</h3>
              <button onClick={() => exportToCSV(mfgData, 'manufacturing')} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Export CSV</button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="table min-w-full">
                <thead className="bg-gray-50"><tr><th>ID</th><th>Product</th><th>Quantity</th><th>Status</th><th>Start Date</th><th>End Date</th></tr></thead>
                <tbody>
                  {(mfgData || []).map(mfg => (<tr key={mfg.mfgID} className="hover:bg-gray-50"><td>#{mfg.mfgID}</td><td className="font-medium">{mfg.productName}</td><td>{mfg.quantity}</td><td><span className={`px-2 py-1 rounded text-xs ${mfg.status === 'completed' ? 'bg-green-100 text-green-700' : mfg.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{mfg.status}</span></td><td>{mfg.startDate ? new Date(mfg.startDate).toLocaleDateString() : '-'}</td><td>{mfg.endDate ? new Date(mfg.endDate).toLocaleDateString() : '-'}</td></tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;