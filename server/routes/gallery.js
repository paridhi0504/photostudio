const r = require('express').Router();
const multer = require('multer');
const { Gallery } = require('../models');
const { protect, adminOnly, wrap } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../utils/services');
const up = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8e6 },
  fileFilter: (q, f, cb) => /^image\/(jpe?g|png|webp)$/.test(f.mimetype) ? cb(null, true) : cb(new Error('Only JPG/PNG/WEBP images')) });
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
r.get('/', wrap(async (q, s) => {
  const f = {};
  if (q.query.category && q.query.category !== 'All') f.category = String(q.query.category);
  if (q.query.q) f.title = new RegExp(esc(String(q.query.q)), 'i');
  s.json(await Gallery.find(f).sort('-createdAt'));
}));
r.get('/categories', wrap(async (q, s) => s.json(await Gallery.distinct('category'))));
r.get('/:id', wrap(async (q, s) => { const d = await Gallery.findById(q.params.id); d ? s.json(d) : s.status(404).json({ message: 'Not found' }); }));
r.post('/', protect, adminOnly, up.single('image'), wrap(async (q, s) => {
  if (!q.file || !q.body.title || !q.body.category) return s.status(400).json({ message: 'image, title, category required' });
  const img = await uploadImage(q.file.buffer);
  s.status(201).json(await Gallery.create({ title: q.body.title, category: q.body.category, imageUrl: img.secure_url, publicId: img.public_id }));
}));
r.delete('/:id', protect, adminOnly, wrap(async (q, s) => {
  const d = await Gallery.findByIdAndDelete(q.params.id); if (d) await deleteImage(d.publicId); s.json({ ok: true });
}));
module.exports = r;
