const r = require('express').Router();
const { Service, Photographer, Enquiry } = require('../models');
const { protect, adminOnly, wrap } = require('../middleware/auth');
const crud = (path, M, required) => {
  r.get(`/${path}`, wrap(async (q, s) => s.json(await M.find().sort('-createdAt'))));
  r.post(`/${path}`, protect, adminOnly, wrap(async (q, s) => {
    if (required.some(k => !q.body[k])) return s.status(400).json({ message: `${required.join(', ')} required` });
    s.status(201).json(await M.create(q.body));
  }));
  r.put(`/${path}/:id`, protect, adminOnly, wrap(async (q, s) => {
    const d = await M.findByIdAndUpdate(q.params.id, q.body, { new: true, runValidators: true });
    d ? s.json(d) : s.status(404).json({ message: 'Not found' });
  }));
  r.delete(`/${path}/:id`, protect, adminOnly, wrap(async (q, s) => { await M.findByIdAndDelete(q.params.id); s.json({ ok: true }); }));
};
crud('services', Service, ['title', 'price']);
crud('photographers', Photographer, ['name']);
r.post('/enquiries', wrap(async (q, s) => {
  const { name, email, message } = q.body;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || !message) return s.status(400).json({ message: 'Name, valid email and message required' });
  await Enquiry.create({ name, email, message }); s.status(201).json({ ok: true });
}));
r.get('/enquiries', protect, adminOnly, wrap(async (q, s) => s.json(await Enquiry.find().sort('-createdAt'))));
r.patch('/enquiries/:id', protect, adminOnly, wrap(async (q, s) => s.json(await Enquiry.findByIdAndUpdate(q.params.id, { status: q.body.status }, { new: true }))));
module.exports = r;
