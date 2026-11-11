require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// REGISTER
app.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)', [name, email, hashed, phone]);
    res.json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Wrong password' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ITEMS + SEARCH
app.get('/items', async (req, res) => {
  const search = req.query.search || '';
  try {
    const [rows] = await db.query(
      `SELECT items.*, users.name as seller_name, users.phone as seller_phone 
       FROM items JOIN users ON items.user_id = users.id 
       WHERE items.status='available' AND items.title LIKE ?`,
      [`%${search}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST ITEM (Sell item)
app.post('/items', async (req, res) => {
  const { user_id, title, description, price, category } = req.body;
  try {
    await db.query('INSERT INTO items (user_id, title, description, price, category) VALUES (?, ?, ?, ?, ?)', [user_id, title, description, price, category]);
    res.json({ message: 'Item posted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/', (req, res) => res.json({ message: 'RUN Market Backend Working!' }));
// PUT ITEM - only owner, fit mark as sold or edit
app.put('/items/:id', async (req, res) => {
  const { title, description, price, image_url, status } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE items SET title = COALESCE(?, title), description = COALESCE(?, description), price = COALESCE(?, price), image_url = COALESCE(?, image_url), status = COALESCE(?, status) WHERE id = ?',
      [title, description, price, image_url, status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ITEM - only owner
app.delete('/items/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM items WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// PUT ITEM - update item / mark as sold
app.put('/items/:id', async (req, res) => {
  const { title, description, price, image_url, status } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE items SET title = COALESCE(?, title), description = COALESCE(?, description), price = COALESCE(?, price), image_url = COALESCE(?, image_url), status = COALESCE(?, status) WHERE id = ?',
      [title, description, price, image_url, status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ITEM
app.delete('/items/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM items WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));