const express = require('express');
const db = require('../config/database');
const { authenticate, authorize, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const orders = db.all(`
      SELECT m.*, p.name as productName, o.orderID as originalOrderID
      FROM manufacturing_orders m
      LEFT JOIN products p ON m.productID = p.productID
      LEFT JOIN orders o ON m.orderID = o.orderID
      ORDER BY m.createdAt DESC
    `);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db.get(`
      SELECT m.*, p.name as productName, o.orderID as originalOrderID
      FROM manufacturing_orders m
      LEFT JOIN products p ON m.productID = p.productID
      LEFT JOIN orders o ON m.orderID = o.orderID
      WHERE m.mfgID = ?
    `, [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Manufacturing order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), logAction('Create manufacturing order'), (req, res) => {
  try {
    const { orderID, productID, quantity } = req.body;
    
    const product = db.get('SELECT * FROM products WHERE productID = ?', [productID]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const materials = db.all('SELECT * FROM raw_materials WHERE quantity >= ?', [quantity]);
    if (materials.length === 0) {
      const admins = db.all("SELECT userID FROM users WHERE role = 'admin'");
      admins.forEach(admin => {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', [admin.userID, 'Low Stock Alert', `Insufficient raw materials for production of ${product.name}`]);
      });
      return res.status(400).json({ error: 'Insufficient raw materials for production' });
    }

    const result = db.run('INSERT INTO manufacturing_orders (orderID, productID, quantity, status, startDate) VALUES (?, ?, ?, ?, ?)', [orderID || null, productID, quantity, 'pending', new Date().toISOString()]);
    
    res.status(201).json({ message: 'Manufacturing order created successfully', mfgID: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/start', authenticate, authorize('admin', 'manager'), logAction('Start manufacturing'), (req, res) => {
  try {
    db.run("UPDATE manufacturing_orders SET status = 'in_progress', startDate = ? WHERE mfgID = ?", [new Date().toISOString(), req.params.id]);
    res.json({ message: 'Manufacturing started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/complete', authenticate, authorize('admin', 'manager'), logAction('Complete manufacturing'), (req, res) => {
  try {
    const mfgOrder = db.get('SELECT * FROM manufacturing_orders WHERE mfgID = ?', [req.params.id]);
    if (!mfgOrder) {
      return res.status(404).json({ error: 'Manufacturing order not found' });
    }

    db.run("UPDATE manufacturing_orders SET status = 'completed', endDate = ? WHERE mfgID = ?", [new Date().toISOString(), req.params.id]);

    const product = db.get('SELECT stock FROM products WHERE productID = ?', [mfgOrder.productID]);
    const newStock = product.stock + mfgOrder.quantity;
    db.run('UPDATE products SET stock = ? WHERE productID = ?', [newStock, mfgOrder.productID]);

    if (mfgOrder.orderID) {
      db.run("UPDATE orders SET status = 'completed' WHERE orderID = ?", [mfgOrder.orderID]);
      
      const order = db.get(`
        SELECT o.*, d.userID FROM orders o 
        LEFT JOIN dealers d ON o.dealerID = d.dealerID 
        WHERE o.orderID = ?
      `, [mfgOrder.orderID]);
      if (order && order.userID) {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', [order.userID, 'Order Completed', `Your order #${order.orderID} has been completed`]);
      }
    }

    res.json({ message: 'Manufacturing completed and stock updated', newStock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('admin', 'manager'), (req, res) => {
  try {
    const { status } = req.body;
    db.run('UPDATE manufacturing_orders SET status = ? WHERE mfgID = ?', [status, req.params.id]);
    res.json({ message: 'Manufacturing order updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;