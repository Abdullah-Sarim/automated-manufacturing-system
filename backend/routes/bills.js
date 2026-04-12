const express = require('express');
const db = require('../config/database');
const { authenticate, authorize, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    let bills;
    if (req.user.role === 'dealer') {
      const dealer = db.get('SELECT dealerID FROM dealers WHERE userID = ?', [req.user.userID]);
      if (!dealer) return res.json([]);
      bills = db.all(`
        SELECT b.*, o.orderID as orderNumber, p.name as productName
        FROM bills b
        LEFT JOIN orders o ON b.orderID = o.orderID
        LEFT JOIN products p ON o.productID = p.productID
        WHERE b.dealerID = ?
        ORDER BY b.createdAt DESC
      `, [dealer.dealerID]);
    } else if (req.user.role === 'supplier') {
      const supplier = db.get('SELECT supplierID FROM suppliers WHERE userID = ?', [req.user.userID]);
      if (!supplier) return res.json([]);
      bills = db.all(`
        SELECT b.*, q.quoteID as quoteNumber, rm.name as materialName
        FROM bills b
        LEFT JOIN quotations q ON b.quotationID = q.quoteID
        LEFT JOIN raw_materials rm ON q.materialID = rm.materialID
        WHERE b.supplierID = ?
        ORDER BY b.createdAt DESC
      `, [supplier.supplierID]);
    } else {
      bills = db.all(`
        SELECT b.*, o.orderID as orderNumber, p.name as productName, d.companyName, 
               q.quoteID as quoteNumber, s.companyName as supplierName, rm.name as materialName
        FROM bills b
        LEFT JOIN orders o ON b.orderID = o.orderID
        LEFT JOIN products p ON o.productID = p.productID
        LEFT JOIN dealers d ON b.dealerID = d.dealerID
        LEFT JOIN quotations q ON b.quotationID = q.quoteID
        LEFT JOIN suppliers s ON b.supplierID = s.supplierID
        LEFT JOIN raw_materials rm ON q.materialID = rm.materialID
        ORDER BY b.createdAt DESC
      `);
    }
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const bill = db.get(`
      SELECT b.*, o.orderID as orderNumber, p.name as productName, d.companyName
      FROM bills b
      LEFT JOIN orders o ON b.orderID = o.orderID
      LEFT JOIN products p ON o.productID = p.productID
      LEFT JOIN dealers d ON b.dealerID = d.dealerID
      WHERE b.billID = ?
    `, [req.params.id]);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), logAction('Create bill'), (req, res) => {
  try {
    const { orderID, dealerID, amount, dueDate } = req.body;
    const order = db.get('SELECT * FROM orders WHERE orderID = ?', [orderID]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const billAmount = amount || order.totalAmount;
    const result = db.run('INSERT INTO bills (orderID, dealerID, amount, paymentStatus, dueDate) VALUES (?, ?, ?, ?, ?)', [orderID, dealerID, billAmount, 'pending', dueDate || null]);

    const dealer = db.get('SELECT d.userID FROM dealers d WHERE d.dealerID = ?', [dealerID]);
    if (dealer && dealer.userID) {
      db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', [dealer.userID, 'New Bill', `You have a new bill #${result.lastInsertRowid} for $${billAmount}`]);
    }

    res.status(201).json({ message: 'Bill created successfully', billID: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('admin', 'manager'), logAction('Update bill'), (req, res) => {
  try {
    const { paymentStatus, amount, dueDate } = req.body;
    db.run('UPDATE bills SET paymentStatus = ?, amount = ?, dueDate = ? WHERE billID = ?', [paymentStatus, amount, dueDate, req.params.id]);
    res.json({ message: 'Bill updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/pay', authenticate, authorize('dealer', 'admin'), logAction('Pay bill'), (req, res) => {
  try {
    const paidDate = new Date().toISOString();
    
    const bill = db.get('SELECT * FROM bills WHERE billID = ?', [req.params.id]);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    if (bill.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Bill already paid' });
    }
    
    db.run("UPDATE bills SET paymentStatus = 'paid', paidDate = ? WHERE billID = ?", [paidDate, req.params.id]);
    
    if (bill.orderID) {
      db.run("UPDATE orders SET status = 'completed', workflowStep = 'completed' WHERE orderID = ?", [bill.orderID]);
    }
    
    const admins = db.all("SELECT userID FROM users WHERE role IN ('admin', 'manager')");
    admins.forEach(admin => {
      db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
        [admin.userID, 'Payment Received', `Payment of $${bill.amount} received for bill #${req.params.id}${bill.orderID ? ` (Order #${bill.orderID})` : ''}`]);
    });
    
    if (bill.dealerID) {
      const dealer = db.get('SELECT userID, companyName FROM dealers WHERE dealerID = ?', [bill.dealerID]);
      if (dealer && dealer.userID) {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [dealer.userID, 'Payment Confirmed', `Your payment of $${bill.amount} for bill #${req.params.id} has been confirmed.`]);
      }
    } else if (bill.supplierID) {
      const supplier = db.get('SELECT userID, companyName FROM suppliers WHERE supplierID = ?', [bill.supplierID]);
      if (supplier && supplier.userID) {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [supplier.userID, 'Payment Confirmed', `Your payment of $${bill.amount} for bill #${req.params.id} has been confirmed.`]);
      }
    }
    
    res.json({ message: 'Payment recorded successfully', paidDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), logAction('Delete bill'), (req, res) => {
  try {
    db.run('DELETE FROM bills WHERE billID = ?', [req.params.id]);
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check-overdue', authenticate, authorize('admin', 'manager'), (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const overdueBills = db.all(`
      SELECT b.*, d.companyName as dealerName, s.companyName as supplierName
      FROM bills b
      LEFT JOIN dealers d ON b.dealerID = d.dealerID
      LEFT JOIN suppliers s ON b.supplierID = s.supplierID
      WHERE b.paymentStatus = 'pending' AND b.dueDate < ?
    `, [today]);
    
    overdueBills.forEach(bill => {
      const userID = bill.dealerID ? db.get('SELECT userID FROM dealers WHERE dealerID = ?', [bill.dealerID])?.userID : 
                                   db.get('SELECT userID FROM suppliers WHERE supplierID = ?', [bill.supplierID])?.userID;
      if (userID) {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [userID, 'Overdue Payment', `Your payment of $${bill.amount} was due on ${bill.dueDate}. Please make the payment immediately.`]);
      }
    });
    
    res.json({ message: 'Overdue payment check completed', count: overdueBills.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;