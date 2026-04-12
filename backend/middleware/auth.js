const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = 'wams-secret-key-2024';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.get('SELECT userID, username, role, name, email FROM users WHERE userID = ?', [decoded.userID]);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    next();
  };
};

const logAction = (action) => {
  return (req, res, next) => {
    if (req.user) {
      db.run('INSERT INTO audit_logs (userID, action, details) VALUES (?, ?, ?)', [
        req.user.userID,
        action,
        JSON.stringify({ body: req.body, params: req.params })
      ]);
    }
    next();
  };
};

module.exports = { authenticate, authorize, logAction, JWT_SECRET };