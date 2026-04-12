const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate, authorize, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/my-profile', authenticate, authorize('dealer'), (req, res) => {
  try {
    const dealer = db.get(`
      SELECT d.*, u.username, u.email, u.name 
      FROM dealers d 
      LEFT JOIN users u ON d.userID = u.userID
      WHERE d.userID = ?
    `, [req.user.userID]);
    
    if (!dealer) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/my-profile', authenticate, authorize('dealer'), logAction('Update own profile'), (req, res) => {
  try {
    const { companyName, contactPerson, phone, address, name, email } = req.body;
    
    const dealer = db.get('SELECT dealerID FROM dealers WHERE userID = ?', [req.user.userID]);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer profile not found' });
    }
    
    db.run('UPDATE dealers SET companyName = ?, contactPerson = ?, phone = ?, address = ? WHERE userID = ?', 
      [companyName, contactPerson, phone, address, req.user.userID]);
    
    if (name || email) {
      if (name) db.run('UPDATE users SET name = ? WHERE userID = ?', [name, req.user.userID]);
      if (email) db.run('UPDATE users SET email = ? WHERE userID = ?', [email, req.user.userID]);
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/my-profile', authenticate, authorize('dealer'), logAction('Delete own account'), (req, res) => {
  try {
    const dealer = db.get('SELECT dealerID FROM dealers WHERE userID = ?', [req.user.userID]);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer profile not found' });
    }
    
    db.run('DELETE FROM bills WHERE dealerID = ?', [dealer.dealerID]);
    db.run('DELETE FROM orders WHERE dealerID = ?', [dealer.dealerID]);
    db.run('DELETE FROM notifications WHERE userID = ?', [req.user.userID]);
    db.run('DELETE FROM dealers WHERE userID = ?', [req.user.userID]);
    db.run("UPDATE users SET username = username || '_deleted_' || datetime('now'), approvalStatus = 'deleted' WHERE userID = ?", [req.user.userID]);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticate, (req, res) => {
  try {
    let dealers;
    if (req.user.role === 'dealer') {
      const dealer = db.get('SELECT dealerID FROM dealers WHERE userID = ?', [req.user.userID]);
      if (!dealer) return res.json([]);
      dealers = db.all(`
        SELECT d.*, u.username, u.email, u.name 
        FROM dealers d 
        LEFT JOIN users u ON d.userID = u.userID
        WHERE d.dealerID = ?
      `, [dealer.dealerID]);
    } else {
      dealers = db.all(`
        SELECT d.*, u.username, u.email, u.name 
        FROM dealers d 
        LEFT JOIN users u ON d.userID = u.userID
      `);
    }
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const dealer = db.get(`
      SELECT d.*, u.username, u.email, u.name 
      FROM dealers d 
      LEFT JOIN users u ON d.userID = u.userID
      WHERE d.dealerID = ?
    `, [req.params.id]);
    
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }
    
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('admin'), logAction('Create dealer'), (req, res) => {
  try {
    const { companyName, contactPerson, phone, address, username, password, name, email } = req.body;
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userResult = db.run('INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)', [username, hashedPassword, 'dealer', name || companyName, email]);
    const userID = userResult.lastInsertRowid;
    
    const result = db.run('INSERT INTO dealers (userID, companyName, contactPerson, phone, address) VALUES (?, ?, ?, ?, ?)', [userID, companyName, contactPerson, phone, address]);
    
    res.status(201).json({ message: 'Dealer created successfully', dealerID: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('admin'), logAction('Update dealer'), (req, res) => {
  try {
    const { companyName, contactPerson, phone, address } = req.body;
    
    db.run('UPDATE dealers SET companyName = ?, contactPerson = ?, phone = ?, address = ? WHERE dealerID = ?', [companyName, contactPerson, phone, address, req.params.id]);
    
    res.json({ message: 'Dealer updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), logAction('Delete dealer'), (req, res) => {
  try {
    const dealer = db.get('SELECT userID FROM dealers WHERE dealerID = ?', [req.params.id]);
    
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }
    
    db.run('DELETE FROM dealers WHERE dealerID = ?', [req.params.id]);
    db.run('DELETE FROM users WHERE userID = ?', [dealer.userID]);
    
    res.json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;