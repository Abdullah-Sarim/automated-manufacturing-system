const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dealerRoutes = require('./routes/dealers');
const supplierRoutes = require('./routes/suppliers');
const productRoutes = require('./routes/products');
const materialRoutes = require('./routes/materials');
const orderRoutes = require('./routes/orders');
const quotationRoutes = require('./routes/quotations');
const manufacturingRoutes = require('./routes/manufacturing');
const billRoutes = require('./routes/bills');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const startServer = async () => {
  await initDb();
  
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/dealers', dealerRoutes);
  app.use('/api/suppliers', supplierRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/materials', materialRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/quotations', quotationRoutes);
  app.use('/api/manufacturing', manufacturingRoutes);
  app.use('/api/bills', billRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'WAMS API is running' });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  app.listen(PORT, () => {
    console.log(`WAMS Server running on port ${PORT}`);
  });
};

startServer();