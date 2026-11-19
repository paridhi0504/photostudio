const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phone: String,
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' }
}, { timestamps: true }));
const Service = model('Service', new Schema({
  title: { type: String, required: true }, price: { type: Number, required: true, min: 0 },
  description: String, features: [String], image: String
}, { timestamps: true }));
const Photographer = model('Photographer', new Schema({
  name: { type: String, required: true }, speciality: String, bio: String, photo: String
}, { timestamps: true }));
const Gallery = model('Gallery', new Schema({
  title: { type: String, required: true }, category: { type: String, required: true },
  imageUrl: { type: String, required: true }, publicId: String
}, { timestamps: true }));
const bs = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  photographer: { type: Schema.Types.ObjectId, ref: 'Photographer', required: true },
  date: { type: String, required: true }, slot: { type: String, required: true },
  amount: Number, notes: String,
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  active: { type: Boolean, default: true },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  orderId: String, paymentId: String, paidAt: Date
}, { timestamps: true });
// DB-level double-booking guard: one active booking per photographer/date/slot
bs.index({ photographer: 1, date: 1, slot: 1 }, { unique: true, partialFilterExpression: { active: true } });
const Booking = model('Booking', bs);
const Enquiry = model('Enquiry', new Schema({
  name: String, email: String, message: String, status: { type: String, enum: ['new', 'resolved'], default: 'new' }
}, { timestamps: true }));
module.exports = { User, Service, Photographer, Gallery, Booking, Enquiry };
