const express = require('express');
const db = require('../config/database');
const { authenticate, authorize, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    let orders;
    if (req.user.role === 'dealer') {
      const dealer = db.get('SELECT dealerID FROM dealers WHERE userID = ?', [req.user.userID]);
      if (!dealer) return res.json([]);
      orders = db.all(`
        SELECT o.*, p.name as productName, p.price as unitPrice, p.stock as productStock,
               b.paymentStatus as paymentStatus, b.paidDate, b.dueDate as billDueDate, b.expectedDeliveryDate as billDeliveryDate,
               CASE 
                 WHEN p.stock >= o.quantity THEN 'available'
                 WHEN p.stock > 0 THEN 'partial'
                 ELSE 'unavailable'
               END as availability
        FROM orders o
        LEFT JOIN products p ON o.productID = p.productID
        LEFT JOIN dealers d ON o.dealerID = d.dealerID
        LEFT JOIN bills b ON o.orderID = b.orderID
        WHERE o.dealerID = ?
        ORDER BY o.createdAt DESC
      `, [dealer.dealerID]);
    } else {
      orders = db.all(`
        SELECT o.*, p.name as productName, p.price as unitPrice, p.stock as productStock,
               d.companyName,
               b.paymentStatus as paymentStatus, b.paidDate, b.dueDate as billDueDate, b.expectedDeliveryDate as billDeliveryDate,
               CASE 
                 WHEN p.stock >= o.quantity THEN 'available'
                 WHEN p.stock > 0 THEN 'partial'
                 ELSE 'unavailable'
               END as availability
        FROM orders o
        LEFT JOIN products p ON o.productID = p.productID
        LEFT JOIN dealers d ON o.dealerID = d.dealerID
        LEFT JOIN bills b ON o.orderID = b.orderID
        ORDER BY o.createdAt DESC
      `);
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db.get(`
      SELECT o.*, p.name as productName, p.price as unitPrice, p.stock as productStock,
             d.companyName, d.contactPerson
      FROM orders o
      LEFT JOIN products p ON o.productID = p.productID
      LEFT JOIN dealers d ON o.dealerID = d.dealerID
      WHERE o.orderID = ?
    `, [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk', authenticate, authorize('dealer', 'admin'), logAction('Create bulk orders'), async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    let dealerID;
    if (req.user.role === 'dealer') {
      const dealer = db.get('SELECT dealerID, approved FROM dealers WHERE userID = ?', [req.user.userID]);
      if (!dealer) {
        return res.status(400).json({ error: 'Dealer profile not found' });
      }
      if (!dealer.approved) {
        return res.status(403).json({ error: 'Your account is not approved by admin' });
      }
      dealerID = dealer.dealerID;
    } else {
      const { dealerID: dID } = req.body;
      dealerID = dID;
    }

    const orderIDs = [];
    const errors = [];

    for (const item of items) {
      const { productID, quantity } = item;
      const product = db.get('SELECT * FROM products WHERE productID = ?', [productID]);
      if (!product) {
        errors.push({ productID, error: 'Product not found' });
        continue;
      }

      const totalAmount = product.price * quantity;
      const result = db.run('INSERT INTO orders (dealerID, productID, quantity, totalAmount, status, workflowStep) VALUES (?, ?, ?, ?, ?, ?)', 
        [dealerID, productID, quantity, totalAmount, 'pending', 'received']);
      const orderID = result.lastInsertRowid;
      orderIDs.push(orderID);

      if (product.stock >= quantity) {
        db.run("UPDATE orders SET workflowStep = 'stock_verified' WHERE orderID = ?", [orderID]);
      } else if (product.stock > 0) {
        db.run("UPDATE orders SET workflowStep = 'stock_partial' WHERE orderID = ?", [orderID]);
      } else {
        db.run("UPDATE orders SET workflowStep = 'stock_unavailable' WHERE orderID = ?", [orderID]);
      }

      const admins = db.all("SELECT userID FROM users WHERE role = 'admin'");
      admins.forEach(admin => {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [admin.userID, 'New Order Received', `Order #${orderID} for ${product.name} (qty: ${quantity}) received from dealer`]);
      });
    }

    res.status(201).json({ 
      message: `Created ${orderIDs.length} orders successfully`,
      orderIDs,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('dealer', 'admin'), logAction('Create order'), async (req, res) => {
  try {
    const { productID, quantity } = req.body;
    const product = db.get('SELECT * FROM products WHERE productID = ?', [productID]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let dealerID;
    if (req.user.role === 'dealer') {
      const dealer = db.get('SELECT dealerID, approved FROM dealers WHERE userID = ?', [req.user.userID]);
      if (!dealer) {
        return res.status(400).json({ error: 'Dealer profile not found' });
      }
      if (!dealer.approved) {
        return res.status(403).json({ error: 'Your account is not approved by admin' });
      }
      dealerID = dealer.dealerID;
    } else {
      const { dealerID: dID } = req.body;
      dealerID = dID;
    }

    const totalAmount = product.price * quantity;
    const result = db.run('INSERT INTO orders (dealerID, productID, quantity, totalAmount, status, workflowStep) VALUES (?, ?, ?, ?, ?, ?)', 
      [dealerID, productID, quantity, totalAmount, 'pending', 'received']);
    const orderID = result.lastInsertRowid;

    const admins = db.all("SELECT userID FROM users WHERE role = 'admin'");
    admins.forEach(admin => {
      db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
        [admin.userID, 'New Order Received', `Order #${orderID} for ${product.name} (qty: ${quantity}) received from dealer`]);
    });

    if (product.stock >= quantity) {
      db.run("UPDATE orders SET workflowStep = 'stock_verified' WHERE orderID = ?", [orderID]);
      
      const mgrUsers = db.all("SELECT userID FROM users WHERE role = 'manager'");
      mgrUsers.forEach(mgr => {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [mgr.userID, 'Stock Available', `Order #${orderID} - Stock available for immediate processing`]);
      });
    } else if (product.stock > 0) {
      db.run("UPDATE orders SET workflowStep = 'stock_partial' WHERE orderID = ?", [orderID]);
      
      const mgrUsers = db.all("SELECT userID FROM users WHERE role = 'manager'");
      mgrUsers.forEach(mgr => {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [mgr.userID, 'Partial Stock', `Order #${orderID} - Only ${product.stock} units available, need ${quantity - product.stock} more`]);
      });
    } else {
      db.run("UPDATE orders SET workflowStep = 'stock_unavailable' WHERE orderID = ?", [orderID]);
      
      db.run('INSERT INTO material_requirements (productID, materialID, quantityRequired, status) VALUES (?, ?, ?, ?)', 
        [productID, null, quantity, 'pending']);

      const mgrUsers = db.all("SELECT userID FROM users WHERE role = 'manager'");
      mgrUsers.forEach(mgr => {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [mgr.userID, 'Stock Unavailable', `Order #${orderID} - No stock available. Manufacturing process required.`]);
      });
    }

    res.status(201).json({ 
      message: 'Order created successfully', 
      orderID, 
      totalAmount,
      workflowStep: product.stock >= quantity ? 'stock_verified' : product.stock > 0 ? 'stock_partial' : 'stock_unavailable'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/process', authenticate, authorize('admin', 'manager'), logAction('Process order'), (req, res) => {
  try {
    const order = db.get('SELECT * FROM orders WHERE orderID = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const product = db.get('SELECT * FROM products WHERE productID = ?', [order.productID]);

    if (product.stock >= order.quantity) {
      db.run("UPDATE orders SET workflowStep = 'billing' WHERE orderID = ?", [req.params.id]);

      db.run('UPDATE products SET stock = stock - ? WHERE productID = ?', [order.quantity, order.productID]);

      const result = db.run('INSERT INTO bills (orderID, dealerID, billType, amount, paymentStatus) VALUES (?, ?, ?, ?, ?)', 
        [req.params.id, order.dealerID, 'dealer', order.totalAmount, 'pending']);

      db.run("UPDATE orders SET status = 'processing' WHERE orderID = ?", [req.params.id]);

      const dealer = db.get('SELECT d.userID, d.companyName FROM dealers d WHERE dealerID = ?', [order.dealerID]);
      if (dealer && dealer.userID) {
        db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
          [dealer.userID, 'Order Processing', `Your order #${req.params.id} is being processed. Bill #${result.lastInsertRowid} generated.`]);
      }

      res.json({ message: 'Order processed - stock available, bill generated', billID: result.lastInsertRowid });
    } else {
      res.status(400).json({ error: 'Insufficient stock. Manufacturing process required first.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/generate-bill', authenticate, authorize('admin', 'manager'), logAction('Generate bill'), (req, res) => {
  try {
    const { dueDate, expectedDeliveryDate } = req.body;
    const order = db.get('SELECT * FROM orders WHERE orderID = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const existingBill = db.get('SELECT billID FROM bills WHERE orderID = ?', [req.params.id]);
    if (existingBill) {
      return res.status(400).json({ error: 'Bill already generated for this order' });
    }

    const product = db.get('SELECT * FROM products WHERE productID = ?', [order.productID]);

    if (product.stock >= order.quantity) {
      db.run('UPDATE products SET stock = stock - ? WHERE productID = ?', [order.quantity, order.productID]);
    }

    db.run("UPDATE orders SET workflowStep = 'billing' WHERE orderID = ?", [req.params.id]);

    const result = db.run('INSERT INTO bills (orderID, dealerID, billType, amount, paymentStatus, dueDate, expectedDeliveryDate) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [req.params.id, order.dealerID, 'dealer', order.totalAmount, 'pending', dueDate || null, expectedDeliveryDate || null]);

    db.run("UPDATE orders SET status = 'processing' WHERE orderID = ?", [req.params.id]);

    const dealer = db.get('SELECT d.userID, d.companyName FROM dealers d WHERE dealerID = ?', [order.dealerID]);
    if (dealer && dealer.userID) {
      let msg = `A bill of $${order.totalAmount} has been generated for your order #${req.params.id}.`;
      if (dueDate) msg += ` Please pay by ${dueDate}.`;
      if (expectedDeliveryDate) msg += ` Expected delivery: ${expectedDeliveryDate}.`;
      db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
        [dealer.userID, 'New Bill Generated', msg]);
    }

    res.json({ message: 'Bill generated successfully', billID: result.lastInsertRowid, amount: order.totalAmount, dueDate, expectedDeliveryDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/approve-supplier', authenticate, authorize('admin', 'manager'), logAction('Approve supplier quotation'), (req, res) => {
  try {
    const { quotationID } = req.body;
    const quotation = db.get('SELECT * FROM quotations WHERE quoteID = ?', [quotationID]);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    db.run("UPDATE quotations SET isApproved = 1, status = 'approved' WHERE quoteID = ?", [quotationID]);

    const result = db.run('INSERT INTO purchase_orders (quotationID, supplierID, materialID, quantity, totalAmount, status) VALUES (?, ?, ?, ?, ?, ?)', 
      [quotationID, quotation.supplierID, quotation.materialID, 1, quotation.price, 'pending']);

    const supplier = db.get('SELECT * FROM suppliers WHERE supplierID = ?', [quotation.supplierID]);
    if (supplier && supplier.userID) {
      db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
        [supplier.userID, 'Purchase Order Generated', `Your quotation has been approved. PO #${result.lastInsertRowid} generated for material supply.`]);
    }

    res.json({ message: 'Supplier approved and purchase order generated', poID: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/receive-materials', authenticate, authorize('admin', 'manager'), logAction('Receive materials'), (req, res) => {
  try {
    const { poID } = req.body;
    const po = db.get('SELECT * FROM purchase_orders WHERE poID = ?', [poID]);
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    db.run("UPDATE purchase_orders SET status = 'received', receivedDate = ? WHERE poID = ?", [new Date().toISOString(), poID]);

    if (po.materialID) {
      db.run('UPDATE raw_materials SET quantity = quantity + ? WHERE materialID = ?', [po.quantity, po.materialID]);
    }

    const pendingOrders = db.all("SELECT orderID, productID, quantity FROM orders WHERE workflowStep = 'stock_unavailable'");
    pendingOrders.forEach(order => {
      const product = db.get('SELECT stock FROM products WHERE productID = ?', [order.productID]);
      if (product && product.stock >= order.quantity) {
        db.run("UPDATE orders SET workflowStep = 'stock_available' WHERE orderID = ?", [order.orderID]);
        
        const mgrUsers = db.all("SELECT userID FROM users WHERE role = 'manager'");
        mgrUsers.forEach(mgr => {
          db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
            [mgr.userID, 'Stock Now Available', `Raw materials received. Order #${order.orderID} can now be processed.`]);
        });
      }
    });

    const admins = db.all("SELECT userID FROM users WHERE role = 'admin'");
    admins.forEach(admin => {
      db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', 
        [admin.userID, 'Materials Received', `Purchase order #${poID} materials received and inventory updated.`]);
    });

    res.json({ message: 'Materials received and inventory updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('admin', 'manager'), logAction('Update order status'), (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = db.get(`
      SELECT o.*, d.userID, p.name as productName FROM orders o 
      LEFT JOIN dealers d ON o.dealerID = d.dealerID
      LEFT JOIN products p ON o.productID = p.productID
      WHERE o.orderID = ?
    `, [req.params.id]);

    if (status === 'completed' && order && order.productID) {
      const previousWorkflowStep = order.workflowStep;
      if (previousWorkflowStep !== 'billing' && previousWorkflowStep !== 'completed') {
        const product = db.get('SELECT stock FROM products WHERE productID = ?', [order.productID]);
        if (product && product.stock >= order.quantity) {
          db.run('UPDATE products SET stock = stock - ? WHERE productID = ?', [order.quantity, order.productID]);
        } else if (product && product.stock > 0) {
          db.run('UPDATE products SET stock = 0 WHERE productID = ?', [order.productID]);
        }
      }
    }

    if (status === 'cancelled' && order && order.productID) {
      const previousWorkflowStep = order.workflowStep;
      if (previousWorkflowStep !== 'billing' && previousWorkflowStep !== 'completed') {
        const product = db.get('SELECT stock FROM products WHERE productID = ?', [order.productID]);
        if (product) {
          const stockToRestore = order.quantity;
          db.run('UPDATE products SET stock = stock + ? WHERE productID = ?', [stockToRestore, order.productID]);
        }
      }
    }

    db.run('UPDATE orders SET status = ? WHERE orderID = ?', [status, req.params.id]);
    
    if (order && order.userID) {
      let message = '';
      switch(status) {
        case 'completed':
          message = `Your order #${req.params.id} for ${order.productName} has been completed and ready for delivery.`;
          break;
        case 'processing':
          message = `Your order #${req.params.id} is now being processed.`;
          break;
        case 'cancelled':
          message = `Your order #${req.params.id} has been cancelled.`;
          break;
        default:
          message = `Your order #${req.params.id} status is now: ${status}`;
      }
      db.run('INSERT INTO notifications (userID, title, message) VALUES (?, ?, ?)', [order.userID, 'Order Update', message]);
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), logAction('Delete order'), (req, res) => {
  try {
    db.run('DELETE FROM orders WHERE orderID = ?', [req.params.id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;