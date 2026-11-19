const r = require('express').Router();
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { User } = require('../models');
const { protect, wrap } = require('../middleware/auth');
const { sendMail } = require('../utils/services');
const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const out = u => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
r.post('/register', wrap(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name?.trim() || !EMAIL.test(email || '') || (password || '').length < 6)
    return res.status(400).json({ message: 'Valid name, email and password (min 6 chars) required' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already registered' });
  const u = await User.create({ name, email, phone, password: await bcrypt.hash(password, 10) });
  sendMail(u.email, 'Welcome to PhotoStudio', `<p>Hi ${u.name}, your account is ready.</p>`);
  res.status(201).json({ token: sign(u), user: out(u) });
}));
r.post('/login', wrap(async (req, res) => {
  const u = await User.findOne({ email: String(req.body.email || '').toLowerCase() }).select('+password');
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.password)))
    return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ token: sign(u), user: out(u) });
}));
r.get('/me', protect, (req, res) => res.json(out(req.user)));
r.put('/me', protect, wrap(async (req, res) => {
  const { name, phone } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save(); res.json(out(req.user));
}));
module.exports = r;
