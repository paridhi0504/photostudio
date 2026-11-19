const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
exports.uploadImage = buf => new Promise((ok, no) =>
  cloudinary.uploader.upload_stream({ folder: 'photostudio' }, (e, r) => e ? no(e) : ok(r)).end(buf));
exports.deleteImage = id => id && cloudinary.uploader.destroy(id).catch(() => {});
const tx = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
exports.sendMail = (to, subject, html) =>
  tx.sendMail({ from: process.env.MAIL_FROM, to, subject, html }).catch(e => console.error('Mail error:', e.message));
exports.SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00'];
