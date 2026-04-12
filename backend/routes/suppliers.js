const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate, authorize, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/my-profile', authenticate, authorize('supplier'), (req, res) => {
  try {
    const supplier = db.get(`
      SELECT s.*, u.username, u.email, u.name 
      FROM suppliers s 
      LEFT JOIN users u ON s.userID = u.userID
      WHERE s.userID = ?
    `, [req.user.userID]);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/my-profile', authenticate, authorize('supplier'), logAction('Update own profile'), (req, res) => {
  try {
    const { companyName, contactPerson, phone, email, address, name } = req.body;
    
    const supplier = db.get('SELECT supplierID FROM suppliers WHERE userID = ?', [req.user.userID]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }
    
    db.run('UPDATE suppliers SET companyName = ?, contactPerson = ?, phone = ?, email = ?, address = ? WHERE userID = ?', 
      [companyName, contactPerson, phone, email, address, req.user.userID]);
    
    if (name) {
      db.run('UPDATE users SET name = ? WHERE userID = ?', [name, req.user.userID]);
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/my-profile', authenticate, authorize('supplier'), logAction('Delete own account'), (req, res) => {
  try {
    const supplier = db.get('SELECT supplierID FROM suppliers WHERE userID = ?', [req.user.userID]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }
    
    db.run('DELETE FROM bills WHERE supplierID = ?', [supplier.supplierID]);
    db.run('DELETE FROM quotations WHERE supplierID = ?', [supplier.supplierID]);
    db.run('DELETE FROM notifications WHERE userID = ?', [req.user.userID]);
    db.run('DELETE FROM suppliers WHERE userID = ?', [req.user.userID]);
    db.run("UPDATE users SET username = username || '_deleted_' || datetime('now'), approvalStatus = 'deleted' WHERE userID = ?", [req.user.userID]);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticate, authorize('admin', 'manager'), (req, res) => {
  try {
    const suppliers = db.all(`
      SELECT s.*, u.username, u.email, u.name 
      FROM suppliers s 
      LEFT JOIN users u ON s.userID = u.userID
    `);
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const supplier = db.get(`
      SELECT s.*, u.username, u.email, u.name 
      FROM suppliers s 
      LEFT JOIN users u ON s.userID = u.userID
      WHERE s.supplierID = ?
    `, [req.params.id]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('admin'), logAction('Create supplier'), (req, res) => {
  try {
    const { companyName, contactPerson, phone, email, address, username, password, name } = req.body;
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userResult = db.run('INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)', [username, hashedPassword, 'supplier', name || companyName, email]);
    const userID = userResult.lastInsertRowid;
    
    const result = db.run('INSERT INTO suppliers (userID, companyName, contactPerson, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)', [userID, companyName, contactPerson, phone, email, address]);
    
    res.status(201).json({ message: 'Supplier created successfully', supplierID: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('admin'), logAction('Update supplier'), (req, res) => {
  try {
    const { companyName, contactPerson, phone, email, address } = req.body;
    db.run('UPDATE suppliers SET companyName = ?, contactPerson = ?, phone = ?, email = ?, address = ? WHERE supplierID = ?', [companyName, contactPerson, phone, email, address, req.params.id]);
    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), logAction('Delete supplier'), (req, res) => {
  try {
    const supplier = db.get('SELECT userID FROM suppliers WHERE supplierID = ?', [req.params.id]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    db.run('DELETE FROM suppliers WHERE supplierID = ?', [req.params.id]);
    db.run('DELETE FROM users WHERE userID = ?', [supplier.userID]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;