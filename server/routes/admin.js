const r = require('express').Router();
const { User, Booking, Gallery, Enquiry } = require('../models');
const { protect, adminOnly, wrap } = require('../middleware/auth');
const { sendMail } = require('../utils/services');
r.use(protect, adminOnly);
r.get('/stats', wrap(async (q, s) => {
  const paid = await Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, t: { $sum: '$amount' } } }]);
  s.json({ users: await User.countDocuments(), bookings: await Booking.countDocuments(), images: await Gallery.countDocuments(),
    newEnquiries: await Enquiry.countDocuments({ status: 'new' }), revenue: paid[0]?.t || 0 });
}));
r.get('/users', wrap(async (q, s) => s.json(await User.find().sort('-createdAt'))));
r.delete('/users/:id', wrap(async (q, s) => {
  if (String(q.user._id) === q.params.id) return s.status(400).json({ message: 'Cannot delete yourself' });
  await User.findByIdAndDelete(q.params.id); s.json({ ok: true });
}));
r.get('/bookings', wrap(async (q, s) => s.json(await Booking.find().populate('user service photographer', 'name email title').sort('-createdAt'))));
r.patch('/bookings/:id', wrap(async (q, s) => {
  const st = q.body.status;
  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(st)) return s.status(400).json({ message: 'Invalid status' });
  const b = await Booking.findById(q.params.id).populate('user', 'email');
  if (!b) return s.status(404).json({ message: 'Not found' });
  b.status = st; b.active = st !== 'cancelled'; await b.save();
  sendMail(b.user.email, `Booking ${st}`, `<p>Your booking on ${b.date} at ${b.slot} is now <b>${st}</b>.</p>`);
  s.json(b);
}));
r.get('/payments', wrap(async (q, s) => s.json(await Booking.find({ paymentStatus: 'paid' }).populate('user', 'name email').sort('-paidAt'))));
module.exports = r;
