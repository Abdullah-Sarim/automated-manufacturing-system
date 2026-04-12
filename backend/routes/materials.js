const express = require('express');
const db = require('../config/database');
const { authenticate, authorize, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const materials = db.all('SELECT * FROM raw_materials');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const material = db.get('SELECT * FROM raw_materials WHERE materialID = ?', [req.params.id]);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), logAction('Create material'), (req, res) => {
  try {
    const { name, quantity, unit, reorderLevel } = req.body;
    const result = db.run('INSERT INTO raw_materials (name, quantity, unit, reorderLevel) VALUES (?, ?, ?, ?)', [name, quantity || 0, unit || 'pcs', reorderLevel || 10]);
    res.status(201).json({ message: 'Material created successfully', materialID: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('admin', 'manager'), logAction('Update material'), (req, res) => {
  try {
    const { name, quantity, unit, reorderLevel } = req.body;
    db.run('UPDATE raw_materials SET name = ?, quantity = ?, unit = ?, reorderLevel = ? WHERE materialID = ?', [name, quantity, unit, reorderLevel, req.params.id]);
    res.json({ message: 'Material updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/stock', authenticate, authorize('admin', 'manager'), logAction('Update material stock'), (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const material = db.get('SELECT quantity FROM raw_materials WHERE materialID = ?', [req.params.id]);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    let newQuantity = operation === 'add' ? material.quantity + quantity : Math.max(0, material.quantity - quantity);
    db.run('UPDATE raw_materials SET quantity = ? WHERE materialID = ?', [newQuantity, req.params.id]);
    res.json({ message: 'Stock updated successfully', newQuantity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), logAction('Delete material'), (req, res) => {
  try {
    db.run('DELETE FROM raw_materials WHERE materialID = ?', [req.params.id]);
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/low-stock/alerts', authenticate, (req, res) => {
  try {
    const alerts = db.all('SELECT * FROM raw_materials WHERE quantity <= reorderLevel');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;