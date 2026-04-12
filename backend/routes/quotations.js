const express = require('express');
const db = require('../config/database');
const { authenticate, authorize, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    let quotations;
    if (req.user.role === 'supplier') {
      const supplier = db.get('SELECT supplierID FROM suppliers WHERE userID = ?', [req.user.userID]);
      if (!supplier) return res.json([]);
      quotations = db.all(`
        SELECT q.*, rm.name as materialName, s.companyName
        FROM quotations q
        LEFT JOIN raw_materials rm ON q.materialID = rm.materialID
        LEFT JOIN suppliers s ON q.supplierID = s.supplierID
        WHERE q.supplierID = ?
        ORDER BY q.createdAt DESC
      `, [supplier.supplierID]);
    } else {
      quotations = db.all(`
        SELECT q.*, rm.name as materialName, s.companyName
        FROM quotations q
        LEFT JOIN raw_materials rm ON q.materialID = rm.materialID
        LEFT JOIN suppliers s ON q.supplierID = s.supplierID
        ORDER BY q.createdAt DESC
      `);
    }
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const quotation = db.get(`
      SELECT q.*, rm.name as materialName, s.companyName
      FROM quotations q
      LEFT JOIN raw_materials rm ON q.materialID = rm.materialID
      LEFT JOIN suppliers s ON q.supplierID = s.supplierID
      WHERE q.quoteID = ?
    `, [req.params.id]);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), logAction('Create quotation request'), (req, res) => {
  try {
    const { materialID, expectedPrice, expectedDeliveryDate, supplierID, quantity } = req.body;
    
    const result = db.run('INSERT INTO quotations (supplierID, materialID, expectedPrice, expectedDeliveryDate, status, responseStatus, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [supplierID, materialID, expectedPrice, expectedDeliveryDate, 'pending', 'waiting', quantity || 0]);
    
    const supplier = db.get('SELECT * FROM suppliers WHERE supplierID = ?', [supplierID]);
    if (supplier && supplier.userID) {
      db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
        [supplier.userID, 'New Quotation Request', `You have a new quotation request for ${quantity} units. Expected price: $${expectedPrice}, Delivery: ${expectedDeliveryDate}`]);
    }

    res.status(201).json({ message: 'Quotation request created successfully', quoteID: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/respond', authenticate, authorize('supplier'), logAction('Supplier responds to quotation'), (req, res) => {
  try {
    const { price, deliveryDate } = req.body;
    const quotation = db.get('SELECT * FROM quotations WHERE quoteID = ?', [req.params.id]);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    if (quotation.responseStatus === 'responded') {
      return res.status(400).json({ error: 'You have already responded to this quotation' });
    }
    
    db.run('UPDATE quotations SET price = ?, deliveryDate = ?, responseStatus = ? WHERE quoteID = ?', 
      [price, deliveryDate, 'responded', req.params.id]);

    const admins = db.all("SELECT userID FROM users WHERE role = 'admin'");
    admins.forEach(admin => {
      db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
        [admin.userID, 'Quotation Response Received', `Supplier responded to quotation #${req.params.id}. Price: $${price}, Delivery: ${deliveryDate}`]);
    });

    res.json({ message: 'Response submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/approve', authenticate, authorize('admin', 'manager'), logAction('Approve quotation'), (req, res) => {
  try {
    db.run("UPDATE quotations SET status = 'approved', isApproved = 1 WHERE quoteID = ?", [req.params.id]);
    
    const quotation = db.get('SELECT * FROM quotations WHERE quoteID = ?', [req.params.id]);
    if (quotation && quotation.materialID && quotation.quantity > 0) {
      db.run('UPDATE raw_materials SET quantity = quantity + ? WHERE materialID = ?', [quotation.quantity, quotation.materialID]);
      
      const material = db.get('SELECT name FROM raw_materials WHERE materialID = ?', [quotation.materialID]);
      
      const supplier = db.get('SELECT * FROM suppliers WHERE supplierID = ?', [quotation.supplierID]);
      if (supplier && supplier.userID) {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [supplier.userID, 'Quotation Approved', `Your quotation #${req.params.id} has been approved! ${quotation.quantity} units of ${material?.name || 'material'} will be added to inventory. You can now generate bill.`]);
      }
    } else {
      const supplier = db.get('SELECT * FROM suppliers WHERE supplierID = ?', [quotation?.supplierID]);
      if (supplier && supplier.userID) {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [supplier.userID, 'Quotation Approved', `Your quotation #${req.params.id} has been approved! You can now generate bill.`]);
      }
    }
    
    res.json({ message: 'Quotation approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/generate-bill', authenticate, authorize('supplier'), logAction('Generate supplier bill'), (req, res) => {
  try {
    const { dueDate, deliveryDate } = req.body;
    const quotation = db.get('SELECT * FROM quotations WHERE quoteID = ?', [req.params.id]);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    if (quotation.status !== 'approved') {
      return res.status(400).json({ error: 'Quotation must be approved first' });
    }

    const existingBill = db.get('SELECT billID FROM bills WHERE quotationID = ?', [req.params.id]);
    if (existingBill) {
      return res.status(400).json({ error: 'Bill already generated for this quotation' });
    }

    const result = db.run('INSERT INTO bills (quotationID, supplierID, billType, amount, paymentStatus, dueDate, expectedDeliveryDate) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [req.params.id, quotation.supplierID, 'supplier', quotation.price, 'pending', dueDate || null, deliveryDate || quotation.deliveryDate || null]);

    const admins = db.all("SELECT userID FROM users WHERE role = 'admin'");
    admins.forEach(admin => {
      db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
        [admin.userID, 'Supplier Bill Generated', `Supplier generated bill #${result.lastInsertRowid} for $${quotation.price}. Please make the payment.`]);
    });

    res.json({ message: 'Bill generated successfully', billID: result.lastInsertRowid, amount: quotation.price, deliveryDate: deliveryDate || quotation.deliveryDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/reject', authenticate, authorize('admin', 'manager'), logAction('Reject quotation'), (req, res) => {
  try {
    db.run("UPDATE quotations SET status = 'rejected' WHERE quoteID = ?", [req.params.id]);
    
    const quotation = db.get('SELECT * FROM quotations WHERE quoteID = ?', [req.params.id]);
    if (quotation) {
      const supplier = db.get('SELECT * FROM suppliers WHERE supplierID = ?', [quotation.supplierID]);
      if (supplier && supplier.userID) {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [supplier.userID, 'Quotation Rejected', `Your quotation #${req.params.id} has been rejected.`]);
      }
    }
    
    res.json({ message: 'Quotation rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), logAction('Delete quotation'), (req, res) => {
  try {
    db.run('DELETE FROM quotations WHERE quoteID = ?', [req.params.id]);
    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/compare/material/:materialID', authenticate, (req, res) => {
  try {
    const quotations = db.all(`
      SELECT q.*, s.companyName
      FROM quotations q
      LEFT JOIN suppliers s ON q.supplierID = s.supplierID
      WHERE q.materialID = ? AND q.responseStatus = 'responded'
      ORDER BY q.price ASC
    `, [req.params.materialID]);
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;