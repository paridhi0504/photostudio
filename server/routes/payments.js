const r = require('express').Router();
const crypto = require('crypto'), Razorpay = require('razorpay');
const { Booking } = require('../models');
const { protect, wrap } = require('../middleware/auth');
const { sendMail } = require('../utils/services');
const rp = () => new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
r.post('/order', protect, wrap(async (q, s) => {
  const b = await Booking.findOne({ _id: q.body.bookingId, user: q.user._id, active: true });
  if (!b) return s.status(404).json({ message: 'Booking not found' });
  if (b.paymentStatus === 'paid') return s.status(400).json({ message: 'Already paid' });
  const o = await rp().orders.create({ amount: Math.round(b.amount * 100), currency: 'INR', receipt: String(b._id) });
  b.orderId = o.id; await b.save();
  s.json({ orderId: o.id, amount: o.amount, currency: o.currency, key: process.env.RAZORPAY_KEY_ID });
}));
r.post('/verify', protect, wrap(async (q, s) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = q.body;
  const b = await Booking.findOne({ _id: bookingId, user: q.user._id });
  if (!b || b.orderId !== razorpay_order_id) return s.status(400).json({ message: 'Order mismatch' });
  const sig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (sig !== razorpay_signature) return s.status(400).json({ message: 'Payment verification failed' });
  Object.assign(b, { paymentStatus: 'paid', paymentId: razorpay_payment_id, status: 'confirmed', paidAt: new Date() });
  await b.save();
  sendMail(q.user.email, 'Payment received - booking confirmed', `<p>We received ₹${b.amount} (ref ${razorpay_payment_id}). Your session on ${b.date} at ${b.slot} is confirmed.</p>`);
  s.json(b);
}));
module.exports = r;
