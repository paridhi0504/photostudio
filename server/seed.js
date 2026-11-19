require('dotenv').config();
const mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const { User, Service, Photographer } = require('./models');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  if (!(await User.findOne({ role: 'admin' }))) await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL, password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10), role: 'admin' });
  if (!(await Service.countDocuments())) await Service.insertMany([
    { title: 'Wedding Photography', price: 35000, features: ['Full day coverage', '300+ edited photos', 'Wedding album', 'Online gallery'] },
    { title: 'Pre Wedding Shoot', price: 15000, features: ['Outdoor location', '100 edited photos', '2 outfit changes'] },
    { title: 'Portrait Session', price: 5000, features: ['Studio session', '25 edited photos', 'Soft copy'] },
    { title: 'Fashion Photography', price: 12000, features: ['Indoor & outdoor', 'Creative editing', 'Portfolio ready'] }]);
  if (!(await Photographer.countDocuments())) await Photographer.insertMany([{ name: 'Arjun Mehta', speciality: 'Weddings & Portraits' }, { name: 'Riya Kapoor', speciality: 'Fashion & Events' }]);
  console.log('Seeded'); process.exit();
})();
