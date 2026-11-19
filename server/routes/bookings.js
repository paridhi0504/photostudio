const r = require('express').Router();
const { Booking, Service, Photographer } = require('../models');
const { protect, wrap } = require('../middleware/auth');
const { sendMail, SLOTS } = require('../utils/services');
r.get('/slots', wrap(async (q, s) => {
  const { photographer, date } = q.query;
  const taken = (await Booking.find({ photographer, date, active: true })).map(b => b.slot);
  s.json(SLOTS.map(t => ({ slot: t, available: !taken.includes(t) })));
}));
r.post('/', protect, wrap(async (q, s) => {
  const { service, photographer, date, slot, notes } = q.body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || new Date(date) < new Date(new Date().toDateString()))
    return s.status(400).json({ message: 'Choose a valid future date' });
  if (!SLOTS.includes(slot)) return s.status(400).json({ message: 'Invalid time slot' });
  const [sv, ph] = await Promise.all([Service.findById(service), Photographer.findById(photographer)]);
  if (!sv || !ph) return s.status(400).json({ message: 'Invalid service or photographer' });
  try {
    const b = await Booking.create({ user: q.user._id, service, photographer, date, slot, notes, amount: sv.price });
    sendMail(q.user.email, 'Booking received', `<p>${sv.title} with ${ph.name} on ${date} at ${slot}. Status: pending. Complete payment to confirm.</p>`);
    s.status(201).json(b);
  } catch (e) {
    if (e.code === 11000) return s.status(409).json({ message: 'That slot is already booked' });
    throw e;
  }
}));
r.get('/mine', protect, wrap(async (q, s) =>
  s.json(await Booking.find({ user: q.user._id }).populate('service photographer', 'title name price').sort('-createdAt'))));
r.patch('/:id/cancel', protect, wrap(async (q, s) => {
  const b = await Booking.findOne({ _id: q.params.id, user: q.user._id });
  if (!b) return s.status(404).json({ message: 'Not found' });
  if (b.paymentStatus === 'paid') return s.status(400).json({ message: 'Paid bookings: contact the studio to cancel/refund' });
  b.status = 'cancelled'; b.active = false; await b.save(); s.json(b);
}));
module.exports = r;
