const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'wams.db');

let db;

const initDb = async () => {
  const SQL = await initSqlJs();
  
  let data;
  if (fs.existsSync(DB_PATH)) {
    data = fs.readFileSync(DB_PATH);
  }
  
  db = new SQL.Database(data);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      userID INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      email TEXT,
      approvalStatus TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dealers (
      dealerID INTEGER PRIMARY KEY AUTOINCREMENT,
      userID INTEGER,
      companyName TEXT NOT NULL,
      contactPerson TEXT,
      phone TEXT,
      address TEXT,
      approved INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userID) REFERENCES users(userID)
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      supplierID INTEGER PRIMARY KEY AUTOINCREMENT,
      userID INTEGER,
      companyName TEXT NOT NULL,
      contactPerson TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      approved INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userID) REFERENCES users(userID)
    );

    CREATE TABLE IF NOT EXISTS products (
      productID INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      reorderLevel INTEGER DEFAULT 10,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS raw_materials (
      materialID INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      reorderLevel INTEGER DEFAULT 10,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      orderID INTEGER PRIMARY KEY AUTOINCREMENT,
      dealerID INTEGER NOT NULL,
      productID INTEGER,
      quantity INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      workflowStep TEXT DEFAULT 'received',
      totalAmount REAL DEFAULT 0,
      orderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dealerID) REFERENCES dealers(dealerID),
      FOREIGN KEY (productID) REFERENCES products(productID)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      itemID INTEGER PRIMARY KEY AUTOINCREMENT,
      orderID INTEGER,
      productID INTEGER,
      quantity INTEGER,
      unitPrice REAL,
      FOREIGN KEY (orderID) REFERENCES orders(orderID),
      FOREIGN KEY (productID) REFERENCES products(productID)
    );

    CREATE TABLE IF NOT EXISTS quotations (
      quoteID INTEGER PRIMARY KEY AUTOINCREMENT,
      supplierID INTEGER NOT NULL,
      materialID INTEGER,
      expectedPrice REAL,
      expectedDeliveryDate DATE,
      price REAL DEFAULT 0,
      deliveryDate DATE,
      quantity INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      responseStatus TEXT DEFAULT 'waiting',
      isApproved INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplierID) REFERENCES suppliers(supplierID),
      FOREIGN KEY (materialID) REFERENCES raw_materials(materialID)
    );

    CREATE TABLE IF NOT EXISTS material_requirements (
      reqID INTEGER PRIMARY KEY AUTOINCREMENT,
      productID INTEGER,
      materialID INTEGER,
      quantityRequired INTEGER,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (productID) REFERENCES products(productID),
      FOREIGN KEY (materialID) REFERENCES raw_materials(materialID)
    );

    CREATE TABLE IF NOT EXISTS manufacturing_materials (
      mfgMaterialID INTEGER PRIMARY KEY AUTOINCREMENT,
      mfgID INTEGER NOT NULL,
      materialID INTEGER NOT NULL,
      quantityUsed INTEGER NOT NULL,
      FOREIGN KEY (mfgID) REFERENCES manufacturing_orders(mfgID),
      FOREIGN KEY (materialID) REFERENCES raw_materials(materialID)
    );

    CREATE TABLE IF NOT EXISTS manufacturing_orders (
      mfgID INTEGER PRIMARY KEY AUTOINCREMENT,
      orderID INTEGER,
      productID INTEGER,
      quantity INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      startDate DATETIME,
      endDate DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderID) REFERENCES orders(orderID),
      FOREIGN KEY (productID) REFERENCES products(productID)
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      poID INTEGER PRIMARY KEY AUTOINCREMENT,
      quotationID INTEGER,
      supplierID INTEGER,
      materialID INTEGER,
      quantity INTEGER,
      totalAmount REAL,
      status TEXT DEFAULT 'pending',
      receivedDate DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quotationID) REFERENCES quotations(quoteID),
      FOREIGN KEY (supplierID) REFERENCES suppliers(supplierID),
      FOREIGN KEY (materialID) REFERENCES raw_materials(materialID)
    );

    CREATE TABLE IF NOT EXISTS bills (
      billID INTEGER PRIMARY KEY AUTOINCREMENT,
      orderID INTEGER,
      quotationID INTEGER,
      dealerID INTEGER,
      supplierID INTEGER,
      billType TEXT,
      amount REAL DEFAULT 0,
      paymentStatus TEXT DEFAULT 'pending',
      dueDate DATE,
      expectedDeliveryDate DATE,
      paidDate DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderID) REFERENCES orders(orderID),
      FOREIGN KEY (quotationID) REFERENCES quotations(quoteID),
      FOREIGN KEY (dealerID) REFERENCES dealers(dealerID),
      FOREIGN KEY (supplierID) REFERENCES suppliers(supplierID)
    );

    CREATE TABLE IF NOT EXISTS payments (
      paymentID INTEGER PRIMARY KEY AUTOINCREMENT,
      billID INTEGER,
      amount REAL,
      paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      paymentMethod TEXT,
      FOREIGN KEY (billID) REFERENCES bills(billID)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      notificationID INTEGER PRIMARY KEY AUTOINCREMENT,
      userID INTEGER,
      title TEXT NOT NULL,
      message TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userID) REFERENCES users(userID)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      logID INTEGER PRIMARY KEY AUTOINCREMENT,
      userID INTEGER,
      action TEXT,
      details TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userID) REFERENCES users(userID)
    );
  `);

  try {
    db.run("ALTER TABLE bills ADD COLUMN quotationID INTEGER");
  } catch (e) {}
  try {
    db.run("ALTER TABLE bills ADD COLUMN dueDate DATE");
  } catch (e) {}
  try {
    db.run("ALTER TABLE bills ADD COLUMN expectedDeliveryDate DATE");
  } catch (e) {}
  try {
    db.run("ALTER TABLE bills ADD COLUMN paidDate DATETIME");
  } catch (e) {}
  try {
    db.run("ALTER TABLE bills ADD COLUMN billType TEXT");
  } catch (e) {}
  try {
    db.run("ALTER TABLE quotations ADD COLUMN quantity INTEGER DEFAULT 0");
  } catch (e) {}

  const bcrypt = require('bcryptjs');
  
  const adminCheck = db.exec("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
  
  const orderCount = db.exec("SELECT COUNT(*) as count FROM orders");
  const hasOrders = orderCount.length > 0 && orderCount[0].values[0][0] > 0;
  
  if (adminCheck.length === 0 || adminCheck[0].values[0][0] === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    db.run("INSERT INTO users (username, password, role, name, email, approvalStatus) VALUES (?, ?, ?, ?, ?, ?)", ['admin', hashedPassword, 'admin', 'System Admin', 'admin@wams.com', 'approved']);
    db.run("INSERT INTO users (username, password, role, name, email, approvalStatus) VALUES (?, ?, ?, ?, ?, ?)", ['manager', bcrypt.hashSync('manager123', 10), 'manager', 'Management Authority', 'manager@wams.com', 'approved']);
    db.run("INSERT INTO users (username, password, role, name, email, approvalStatus) VALUES (?, ?, ?, ?, ?, ?)", ['dealer1', bcrypt.hashSync('dealer123', 10), 'dealer', 'John Dealer', 'dealer1@wams.com', 'approved']);
    db.run("INSERT INTO users (username, password, role, name, email, approvalStatus) VALUES (?, ?, ?, ?, ?, ?)", ['supplier1', bcrypt.hashSync('supplier123', 10), 'supplier', 'ABC Suppliers', 'supplier1@wams.com', 'approved']);
    
    const adminUser = db.exec("SELECT userID FROM users WHERE username = 'admin'");
    const dealerUser = db.exec("SELECT userID FROM users WHERE username = 'dealer1'");
    const supplierUser = db.exec("SELECT userID FROM users WHERE username = 'supplier1'");
    
    if (dealerUser.length > 0) {
      db.run("INSERT INTO dealers (userID, companyName, contactPerson, phone, address, approved) VALUES (?, ?, ?, ?, ?, ?)", [dealerUser[0].values[0][0], 'Tech Solutions Ltd', 'John Smith', '555-1234', '123 Tech Street', 1]);
    }
    if (supplierUser.length > 0) {
      db.run("INSERT INTO suppliers (userID, companyName, contactPerson, phone, email, address, approved) VALUES (?, ?, ?, ?, ?, ?, ?)", [supplierUser[0].values[0][0], 'ABC Suppliers Ltd', 'Robert Brown', '555-5678', 'supplier@abc.com', '456 Supply Ave', 1]);
    }
    
    db.run("INSERT INTO products (name, description, price, stock, reorderLevel) VALUES (?, ?, ?, ?, ?)", ['Widget A', 'High quality widget', 25.00, 100, 20]);
    db.run("INSERT INTO products (name, description, price, stock, reorderLevel) VALUES (?, ?, ?, ?, ?)", ['Gadget B', 'Premium gadget', 50.00, 50, 15]);
    db.run("INSERT INTO products (name, description, price, stock, reorderLevel) VALUES (?, ?, ?, ?, ?)", ['Component C', 'Essential component', 15.00, 200, 30]);
    
    db.run("INSERT INTO raw_materials (name, quantity, unit, reorderLevel) VALUES (?, ?, ?, ?)", ['Steel Rod', 500, 'pcs', 100]);
    db.run("INSERT INTO raw_materials (name, quantity, unit, reorderLevel) VALUES (?, ?, ?, ?)", ['Copper Wire', 200, 'meters', 50]);
    db.run("INSERT INTO raw_materials (name, quantity, unit, reorderLevel) VALUES (?, ?, ?, ?)", ['Plastic Sheet', 100, 'sheets', 25]);

    const dealerCheck = db.exec("SELECT dealerID FROM dealers LIMIT 1");
    const supplierCheck = db.exec("SELECT supplierID FROM suppliers LIMIT 1");
    
    if (!hasOrders) {
      if (dealerCheck.length > 0 && dealerCheck[0].values.length > 0) {
        const dealerID = dealerCheck[0].values[0][0];
        db.run("INSERT INTO orders (dealerID, productID, quantity, totalAmount, status, workflowStep) VALUES (?, ?, ?, ?, ?, ?)", [dealerID, 1, 50, 1250, 'pending', 'received']);
        db.run("INSERT INTO orders (dealerID, productID, quantity, totalAmount, status, workflowStep) VALUES (?, ?, ?, ?, ?, ?)", [dealerID, 2, 30, 1500, 'processing', 'stock_verified']);
        db.run("INSERT INTO orders (dealerID, productID, quantity, totalAmount, status, workflowStep) VALUES (?, ?, ?, ?, ?, ?)", [dealerID, 3, 100, 1500, 'completed', 'billing']);
        db.run("INSERT INTO orders (dealerID, productID, quantity, totalAmount, status, workflowStep) VALUES (?, ?, ?, ?, ?, ?)", [dealerID, 1, 200, 5000, 'pending', 'stock_unavailable']);
        db.run("INSERT INTO orders (dealerID, productID, quantity, totalAmount, status, workflowStep) VALUES (?, ?, ?, ?, ?, ?)", [dealerID, 2, 10, 500, 'completed', 'completed']);
        db.run("INSERT INTO orders (dealerID, productID, quantity, totalAmount, status, workflowStep) VALUES (?, ?, ?, ?, ?, ?)", [dealerID, 3, 75, 1125, 'processing', 'manufacturing']);
        db.run("INSERT INTO orders (dealerID, productID, quantity, totalAmount, status, workflowStep) VALUES (?, ?, ?, ?, ?, ?)", [dealerID, 1, 25, 625, 'pending', 'stock_partial']);
      }

      if (dealerCheck.length > 0 && dealerCheck[0].values.length > 0) {
        const dealerID = dealerCheck[0].values[0][0];
        db.run("INSERT INTO bills (orderID, dealerID, billType, amount, paymentStatus, dueDate) VALUES (?, ?, ?, ?, ?, ?)", [1, dealerID, 'dealer', 1250, 'pending', '2026-04-20']);
        db.run("INSERT INTO bills (orderID, dealerID, billType, amount, paymentStatus, dueDate) VALUES (?, ?, ?, ?, ?, ?)", [2, dealerID, 'dealer', 1500, 'paid', '2026-03-15']);
        db.run("INSERT INTO bills (orderID, dealerID, billType, amount, paymentStatus, dueDate) VALUES (?, ?, ?, ?, ?, ?)", [3, dealerID, 'dealer', 1500, 'paid', '2026-02-28']);
        db.run("INSERT INTO bills (orderID, dealerID, billType, amount, paymentStatus, dueDate) VALUES (?, ?, ?, ?, ?, ?)", [5, dealerID, 'dealer', 500, 'paid', '2026-01-15']);
      }

      if (supplierCheck.length > 0 && supplierCheck[0].values.length > 0) {
        const supplierID = supplierCheck[0].values[0][0];
        db.run("INSERT INTO quotations (supplierID, materialID, expectedPrice, expectedDeliveryDate, price, deliveryDate, status, responseStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [supplierID, 1, 100, '2026-05-01', 95, '2026-04-25', 'approved', 'responded']);
        db.run("INSERT INTO quotations (supplierID, materialID, expectedPrice, expectedDeliveryDate, price, deliveryDate, status, responseStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [supplierID, 2, 50, '2026-05-15', 45, '2026-05-10', 'pending', 'waiting']);
        db.run("INSERT INTO quotations (supplierID, materialID, expectedPrice, expectedDeliveryDate, price, deliveryDate, status, responseStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [supplierID, 3, 25, '2026-04-20', 22, '2026-04-18', 'approved', 'responded']);
        
        db.run("INSERT INTO bills (quotationID, supplierID, billType, amount, paymentStatus, dueDate) VALUES (?, ?, ?, ?, ?, ?)", [1, supplierID, 'supplier', 95, 'pending', '2026-05-01']);
        db.run("INSERT INTO bills (quotationID, supplierID, billType, amount, paymentStatus, dueDate) VALUES (?, ?, ?, ?, ?, ?)", [3, supplierID, 'supplier', 22, 'pending', '2026-04-25']);
      }

      db.run("INSERT INTO manufacturing_orders (productID, quantity, status, startDate) VALUES (?, ?, ?, ?)", [1, 50, 'completed', '2026-02-01']);
      db.run("INSERT INTO manufacturing_orders (productID, quantity, status, startDate) VALUES (?, ?, ?, ?)", [2, 30, 'in_progress', '2026-04-01']);
      db.run("INSERT INTO manufacturing_orders (productID, quantity, status, startDate) VALUES (?, ?, ?, ?)", [3, 100, 'pending', null]);
    }
  }
  
  saveDb();
  
  return db;
};

const saveDb = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
};

const getDb = () => db;

const run = (sql, params = []) => {
  db.run(sql, params);
  saveDb();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0].values[0][0], changes: db.getRowsModified() };
};

const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
};

const all = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
};

module.exports = { initDb, getDb, run, get, all, saveDb };