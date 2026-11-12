const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5000;

// TEST
app.get('/', (req, res) => res.json({ message: 'Uni Market Backend working!' }));

// REGISTER
app.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users(name,email,password,phone) VALUES (?,?,?,?)', [name, email, hashed, phone || '']);
    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    console.log('REGISTER ERROR:', err.message);
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists, use another email' });
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Wrong password' });
    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.log('LOGIN ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET ALL ITEMS
app.get('/items', async (req, res) => {
  try {
    const search = req.query.search || '';
    let items;
    if (search) {
      items = await db.query('SELECT * FROM items WHERE title LIKE ? ORDER BY id DESC', ['%' + search + '%']);
    } else {
      items = await db.query('SELECT * FROM items ORDER BY id DESC');
    }
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADD ITEM
app.post('/items', async (req, res) => {
  const { title, description, price, category, image, seller_name, seller_phone } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  try {
    await db.query('INSERT INTO items(title,description,price,category,image,seller_name,seller_phone) VALUES (?,?,?,?,?,?,?)', [title, description || '', price || 0, category || '', image || '', seller_name || '', seller_phone || '']);
    res.status(201).json({ message: 'Item added successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE ITEM
app.delete('/items/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));