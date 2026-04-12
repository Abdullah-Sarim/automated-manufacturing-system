const express = require('express');
const db = require('../config/database');
const { authenticate, authorize, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const products = db.all('SELECT * FROM products');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const product = db.get('SELECT * FROM products WHERE productID = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), logAction('Create product'), (req, res) => {
  try {
    const { name, description, price, stock, reorderLevel } = req.body;
    const result = db.run('INSERT INTO products (name, description, price, stock, reorderLevel) VALUES (?, ?, ?, ?, ?)', [name, description, price || 0, stock || 0, reorderLevel || 10]);
    res.status(201).json({ message: 'Product created successfully', productID: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('admin', 'manager'), logAction('Update product'), (req, res) => {
  try {
    const { name, description, price, stock, reorderLevel } = req.body;
    db.run('UPDATE products SET name = ?, description = ?, price = ?, stock = ?, reorderLevel = ? WHERE productID = ?', [name, description, price, stock, reorderLevel, req.params.id]);
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/stock', authenticate, authorize('admin', 'manager'), logAction('Update stock'), (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const product = db.get('SELECT * FROM products WHERE productID = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    let newStock = operation === 'add' ? product.stock + quantity : Math.max(0, product.stock - quantity);
    db.run('UPDATE products SET stock = ? WHERE productID = ?', [newStock, req.params.id]);
    
    if (newStock <= product.reorderLevel) {
      const admins = db.all("SELECT userID FROM users WHERE role IN ('admin', 'manager')");
      admins.forEach(admin => {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [admin.userID, 'Low Stock Alert', `${product.name} stock is low (${newStock}). Reorder level: ${product.reorderLevel}`]);
      });
    }
    
    res.json({ message: 'Stock updated successfully', newStock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), logAction('Delete product'), (req, res) => {
  try {
    db.run('DELETE FROM products WHERE productID = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/low-stock/alerts', authenticate, (req, res) => {
  try {
    const alerts = db.all('SELECT * FROM products WHERE stock <= reorderLevel');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;