const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticate, (req, res) => {
  try {
    const totalOrders = db.get('SELECT COUNT(*) as count FROM orders').count;
    const pendingOrders = db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").count;
    const completedOrders = db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").count;
    const totalProducts = db.get('SELECT COUNT(*) as count FROM products').count;
    const totalDealers = db.get('SELECT COUNT(*) as count FROM dealers').count;
    const totalSuppliers = db.get('SELECT COUNT(*) as count FROM suppliers').count;
    const totalRevenue = db.get("SELECT COALESCE(SUM(amount), 0) as total FROM bills WHERE paymentStatus = 'paid'").total;
    const pendingPayments = db.get("SELECT COALESCE(SUM(amount), 0) as total FROM bills WHERE paymentStatus = 'pending'").total;

    const stats = {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalProducts,
      totalDealers,
      totalSuppliers,
      totalRevenue,
      pendingPayments
    };

    const lowStockProducts = db.all('SELECT * FROM products WHERE stock <= reorderLevel');
    const lowStockMaterials = db.all('SELECT * FROM raw_materials WHERE quantity <= reorderLevel');
    
    const today = new Date().toISOString().split('T')[0];
    const overduePayments = db.all(`
      SELECT b.*, d.companyName as dealerName
      FROM bills b
      LEFT JOIN dealers d ON b.dealerID = d.dealerID
      WHERE b.paymentStatus = 'pending' AND b.dueDate < ?
      ORDER BY b.dueDate ASC
    `, [today]);

    const recentOrders = db.all(`
      SELECT o.*, p.name as productName, d.companyName
      FROM orders o
      LEFT JOIN products p ON o.productID = p.productID
      LEFT JOIN dealers d ON o.dealerID = d.dealerID
      ORDER BY o.createdAt DESC
      LIMIT 5
    `);

    res.json({ stats, lowStockProducts, lowStockMaterials, overduePayments, recentOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sales', authenticate, authorize('admin', 'manager'), (req, res) => {
  try {
    const { period } = req.query;
    let dateCondition = '';
    if (period === 'week') {
      dateCondition = "AND orders.createdAt >= datetime('now', '-7 days')";
    } else if (period === 'month') {
      dateCondition = "AND orders.createdAt >= datetime('now', '-30 days')";
    } else if (period === 'year') {
      dateCondition = "AND orders.createdAt >= datetime('now', '-365 days')";
    }

    const whereClause = dateCondition ? `orders.createdAt IS NOT NULL ${dateCondition}` : 'orders.createdAt IS NOT NULL';

    const salesByMonth = db.all(`
      SELECT strftime('%Y-%m', orders.createdAt) as month, 
             COALESCE(SUM(orders.totalAmount), 0) as total, 
             COUNT(*) as orders
      FROM orders
      WHERE ${whereClause}
      GROUP BY strftime('%Y-%m', orders.createdAt)
      ORDER BY month
    `);

    const salesByProduct = db.all(`
      SELECT COALESCE(products.name, 'Unknown') as name, 
             COALESCE(SUM(orders.quantity), 0) as quantity, 
             COALESCE(SUM(orders.totalAmount), 0) as total
      FROM orders
      LEFT JOIN products ON orders.productID = products.productID
      WHERE ${whereClause}
      GROUP BY COALESCE(products.name, 'Unknown')
    `);

    const salesByDealer = db.all(`
      SELECT COALESCE(dealers.companyName, 'Unknown') as companyName, 
             COALESCE(SUM(orders.totalAmount), 0) as total, 
             COUNT(*) as orders
      FROM orders
      LEFT JOIN dealers ON orders.dealerID = dealers.dealerID
      WHERE ${whereClause}
      GROUP BY COALESCE(dealers.companyName, 'Unknown')
    `);

    res.json({ 
      salesByMonth: salesByMonth || [], 
      salesByProduct: salesByProduct || [], 
      salesByDealer: salesByDealer || [] 
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

router.get('/stock', authenticate, authorize('admin', 'manager'), (req, res) => {
  try {
    const products = db.all('SELECT * FROM products');
    const materials = db.all('SELECT * FROM raw_materials');
    
    const stockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    res.json({ products, materials, stockValue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/supplier', authenticate, authorize('admin', 'manager'), (req, res) => {
  try {
    const suppliers = db.all(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM quotations q WHERE q.supplierID = s.supplierID) as totalQuotes,
        (SELECT COUNT(*) FROM quotations q WHERE q.supplierID = s.supplierID AND q.status = 'approved') as approvedQuotes
      FROM suppliers s
    `);

    const quotesBySupplier = db.all(`
      SELECT s.companyName, q.status, COUNT(*) as count
      FROM quotations q
      LEFT JOIN suppliers s ON q.supplierID = s.supplierID
      GROUP BY s.companyName, q.status
    `);

    res.json({ suppliers, quotesBySupplier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/predictions', authenticate, authorize('admin', 'manager'), (req, res) => {
  try {
    const lowStockPredictions = db.all(`
      SELECT p.productID, p.name, p.stock, p.reorderLevel,
        CASE 
          WHEN p.stock <= p.reorderLevel THEN 'Critical'
          WHEN p.stock <= p.reorderLevel * 1.5 THEN 'Warning'
          ELSE 'OK'
        END as status
      FROM products p
    `);

    const avgSales = db.all(`
      SELECT productID, AVG(quantity) as avgQuantity
      FROM orders
      WHERE createdAt >= datetime('now', '-30 days')
      GROUP BY productID
    `);

    const suggestions = [];
    lowStockPredictions.forEach(product => {
      const avg = avgSales.find(a => a.productID === product.productID);
      if (avg && product.stock < avg.avgQuantity * 7) {
        suggestions.push({
          product: product.name,
          suggestion: `Reorder ${Math.ceil(avg.avgQuantity * 14 - product.stock)} units`,
          urgency: product.status
        });
      }
    });

    const bestSupplier = db.get(`
      SELECT s.companyName, AVG(q.price) as avgPrice, COUNT(*) as quoteCount
      FROM quotations q
      LEFT JOIN suppliers s ON q.supplierID = s.supplierID
      WHERE q.status = 'approved'
      GROUP BY s.supplierID
      ORDER BY avgPrice ASC
      LIMIT 1
    `);

    res.json({ predictions: lowStockPredictions, suggestions, bestSupplier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;