const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticate, authorize, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { username, password, role, name, email, companyName, contactPerson, phone, address } = req.body;
    
    const existing = db.get('SELECT userID FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const approvalStatus = role === 'admin' ? 'approved' : 'pending';
    const result = db.run('INSERT INTO users (username, password, role, name, email, approvalStatus) VALUES (?, ?, ?, ?, ?, ?)', [username, hashedPassword, role, name, email, approvalStatus]);
    
    const userID = result.lastInsertRowid;
    
    if (role === 'dealer') {
      db.run('INSERT INTO dealers (userID, companyName, contactPerson, phone, address, approved) VALUES (?, ?, ?, ?, ?, ?)', [userID, companyName || name, contactPerson, phone, address, 0]);
    } else if (role === 'supplier') {
      db.run('INSERT INTO suppliers (userID, companyName, contactPerson, phone, email, address, approved) VALUES (?, ?, ?, ?, ?, ?, ?)', [userID, companyName || name, contactPerson, phone, email, address, 0]);
    }

    if (approvalStatus === 'approved') {
      const token = jwt.sign({ userID, role }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ message: 'User registered successfully', token, user: { userID, username, role, name, email } });
    } else {
      res.json({ message: 'Registration submitted. Waiting for admin approval.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.approvalStatus === 'pending') {
      if (user.role !== 'manager') {
        return res.status(403).json({ error: 'Your account is pending approval by admin' });
      }
    }
    
    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({ error: 'Your account has been rejected by admin' });
    }
    
    if (user.approvalStatus === 'deleted') {
      return res.status(403).json({ error: 'This account has been deleted' });
    }

    const token = jwt.sign({ userID: user.userID, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { userID: user.userID, username: user.username, role: user.role, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile', authenticate, (req, res) => {
  try {
    const user = req.user;
    let profile = { ...user };
    
    if (user.role === 'dealer') {
      const dealer = db.get('SELECT * FROM dealers WHERE userID = ?', [user.userID]);
      profile.dealer = dealer;
    } else if (user.role === 'supplier') {
      const supplier = db.get('SELECT * FROM suppliers WHERE userID = ?', [user.userID]);
      profile.supplier = supplier;
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/password', authenticate, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = db.get('SELECT password FROM users WHERE userID = ?', [req.user.userID]);
    const validPassword = bcrypt.compareSync(currentPassword, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE userID = ?', [hashedPassword, req.user.userID]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;