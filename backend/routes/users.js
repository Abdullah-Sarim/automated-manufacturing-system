const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate, authorize, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authenticate, authorize('admin'), (req, res) => {
  try {
    const users = db.all('SELECT userID, username, role, name, email, approvalStatus, createdAt FROM users WHERE role != ?', ['admin']);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/managers', authenticate, authorize('admin'), (req, res) => {
  try {
    const managers = db.all('SELECT userID, username, name, email, approvalStatus, createdAt FROM users WHERE role = ?', ['manager']);
    res.json(managers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pending', authenticate, authorize('admin', 'manager'), (req, res) => {
  try {
    const pendingUsers = db.all("SELECT u.userID, u.username, u.role, u.name, u.email, u.createdAt, d.companyName, s.companyName as supplierName FROM users u LEFT JOIN dealers d ON u.userID = d.userID LEFT JOIN suppliers s ON u.userID = s.userID WHERE u.approvalStatus = 'pending'");
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/approve', authenticate, authorize('admin'), logAction('Approve user'), (req, res) => {
  try {
    const user = db.get('SELECT * FROM users WHERE userID = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.run("UPDATE users SET approvalStatus = 'approved' WHERE userID = ?", [req.params.id]);

    if (user.role === 'dealer') {
      db.run("UPDATE dealers SET approved = 1 WHERE userID = ?", [req.params.id]);
    } else if (user.role === 'supplier') {
      db.run("UPDATE suppliers SET approved = 1 WHERE userID = ?", [req.params.id]);
    }

    db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
      [user.userID, 'Account Approved', 'Your account has been approved by admin. You can now access the system.']);

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/reject', authenticate, authorize('admin'), logAction('Reject user'), (req, res) => {
  try {
    const user = db.get('SELECT * FROM users WHERE userID = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.run("UPDATE users SET approvalStatus = 'rejected' WHERE userID = ?", [req.params.id]);

    db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
      [user.userID, 'Account Rejected', 'Your account registration has been rejected by admin.']);

    res.json({ message: 'User rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dealers', authenticate, authorize('admin', 'manager'), (req, res) => {
  try {
    const dealers = db.all(`
      SELECT d.*, u.username, u.email, u.name, u.approvalStatus 
      FROM dealers d 
      LEFT JOIN users u ON d.userID = u.userID
    `);
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/suppliers', authenticate, authorize('admin', 'manager'), (req, res) => {
  try {
    const suppliers = db.all(`
      SELECT s.*, u.username, u.email, u.name, u.approvalStatus 
      FROM suppliers s 
      LEFT JOIN users u ON s.userID = u.userID
    `);
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/register', (req, res) => {
  try {
    const { username, password, role, name, email, companyName, contactPerson, phone, address } = req.body;
    
    const existing = db.get('SELECT userID FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const approvalStatus = role === 'admin' ? 'approved' : 'pending';
    const result = db.run('INSERT INTO users (username, password, role, name, email, approvalStatus) VALUES (?, ?, ?, ?, ?, ?)', 
      [username, hashedPassword, role, name, email, approvalStatus]);
    
    const userID = result.lastInsertRowid;
    
    if (role === 'dealer') {
      db.run('INSERT INTO dealers (userID, companyName, contactPerson, phone, address, approved) VALUES (?, ?, ?, ?, ?, ?)', 
        [userID, companyName || name, contactPerson, phone, address, 0]);
    } else if (role === 'supplier') {
      db.run('INSERT INTO suppliers (userID, companyName, contactPerson, phone, email, address, approved) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [userID, companyName || name, contactPerson, phone, email, address, 0]);
    } else if (role === 'manager') {
      db.run('INSERT INTO users (approvalStatus) VALUES (?)', ['approved']);
    }

    if (approvalStatus === 'approved') {
      const token = require('jsonwebtoken').sign({ userID, role }, 'wams-secret-key-2024', { expiresIn: '7d' });
      res.json({ message: 'User registered successfully', token, user: { userID, username, role, name, email } });
    } else {
      res.json({ message: 'Registration submitted. Waiting for admin approval.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset-data', authenticate, authorize('admin'), (req, res) => {
  try {
    const { password } = req.body;
    
    const adminUser = db.get('SELECT password FROM users WHERE role = ?', ['admin']);
    if (!adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    
    const isValidPassword = bcrypt.compareSync(password, adminUser.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    db.run('DELETE FROM audit_logs');
    db.run('DELETE FROM notifications');
    db.run('DELETE FROM bills');
    db.run('DELETE FROM manufacturing_orders');
    db.run('DELETE FROM quotations');
    db.run('DELETE FROM orders');
    db.run('DELETE FROM products');
    db.run('DELETE FROM raw_materials');
    
    db.run("INSERT INTO products (name, description, price, stock, reorderLevel) VALUES (?, ?, ?, ?, ?)", ['Widget A', 'High quality widget', 25.00, 100, 20]);
    db.run("INSERT INTO products (name, description, price, stock, reorderLevel) VALUES (?, ?, ?, ?, ?)", ['Gadget B', 'Premium gadget', 50.00, 50, 15]);
    db.run("INSERT INTO products (name, description, price, stock, reorderLevel) VALUES (?, ?, ?, ?, ?)", ['Component C', 'Essential component', 15.00, 200, 30]);
    
    db.run("INSERT INTO raw_materials (name, quantity, unit, reorderLevel) VALUES (?, ?, ?, ?)", ['Steel Rod', 500, 'pcs', 100]);
    db.run("INSERT INTO raw_materials (name, quantity, unit, reorderLevel) VALUES (?, ?, ?, ?)", ['Copper Wire', 200, 'meters', 50]);
    db.run("INSERT INTO raw_materials (name, quantity, unit, reorderLevel) VALUES (?, ?, ?, ?)", ['Plastic Sheet', 100, 'sheets', 25]);
    
    res.json({ message: 'All data has been reset successfully. Products and raw materials restored to default.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), logAction('Delete user'), (req, res) => {
  try {
    const user = db.get('SELECT * FROM users WHERE userID = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin' });
    }
    
    if (user.role === 'manager') {
      const manager = db.get('SELECT * FROM users WHERE userID = ?', [req.params.id]);
    } else if (user.role === 'dealer') {
      const dealer = db.get('SELECT dealerID FROM dealers WHERE userID = ?', [req.params.id]);
      if (dealer) {
        db.run('DELETE FROM orders WHERE dealerID = ?', [dealer.dealerID]);
        db.run('DELETE FROM bills WHERE dealerID = ?', [dealer.dealerID]);
        db.run('DELETE FROM dealers WHERE userID = ?', [req.params.id]);
      }
    } else if (user.role === 'supplier') {
      const supplier = db.get('SELECT supplierID FROM suppliers WHERE userID = ?', [req.params.id]);
      if (supplier) {
        db.run('DELETE FROM quotations WHERE supplierID = ?', [supplier.supplierID]);
        db.run('DELETE FROM bills WHERE supplierID = ?', [supplier.supplierID]);
        db.run('DELETE FROM suppliers WHERE userID = ?', [req.params.id]);
      }
    }
    
    db.run('DELETE FROM notifications WHERE userID = ?', [req.params.id]);
    db.run("UPDATE users SET username = username || '_deleted_' || datetime('now'), approvalStatus = 'deleted' WHERE userID = ?", [req.params.id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;