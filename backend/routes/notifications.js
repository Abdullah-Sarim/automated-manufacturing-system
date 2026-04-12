const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const notifications = db.all(`
      SELECT * FROM notifications
      WHERE userID = ?
      ORDER BY createdAt DESC
      LIMIT 50
    `, [req.user.userID]);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/unread', authenticate, (req, res) => {
  try {
    const count = db.get('SELECT COUNT(*) as count FROM notifications WHERE userID = ? AND isRead = 0', [req.user.userID]);
    res.json({ count: count.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/read', authenticate, (req, res) => {
  try {
    db.run('UPDATE notifications SET isRead = 1 WHERE notificationID = ? AND userID = ?', [req.params.id, req.user.userID]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/read-all', authenticate, (req, res) => {
  try {
    db.run('UPDATE notifications SET isRead = 1 WHERE userID = ?', [req.user.userID]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  try {
    db.run('DELETE FROM notifications WHERE notificationID = ? AND userID = ?', [req.params.id, req.user.userID]);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;