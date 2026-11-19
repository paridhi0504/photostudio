require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rate = require('express-rate-limit');

const app = express();

// Vercel runs behind a proxy; this lets rate-limit see the real client IP
app.set('trust proxy', 1);

// CLIENT_URL can hold one or more frontend URLs (comma-separated); trailing slashes are ignored
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  helmet(),
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  }),
  express.json({ limit: '1mb' })
);

// strip $-operators/dots from input to prevent NoSQL injection
const clean = o => {
  if (o && typeof o === 'object') {
    for (const k in o) {
      if (/^\$|\./.test(k)) delete o[k];
      else clean(o[k]);
    }
  }
};
app.use((q, s, n) => { clean(q.body); clean(q.query); clean(q.params); n(); });

// Health check (works even if the database is down)
app.get('/', (q, s) => s.json({ status: 'ok', service: 'PhotoStudio API' }));

// Cached MongoDB connection: serverless functions reuse it between requests
const cached = global._mongoose || (global._mongoose = { conn: null, promise: null });
async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // allow a retry on the next request
    throw e;
  }
  return cached.conn;
}
app.use(async (q, s, n) => {
  try { await connectDB(); n(); } catch (e) { n(e); }
});

app.use('/api/auth', rate({ windowMs: 15 * 60e3, max: 50 }), require('./routes/auth'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/catalog'));

app.use((q, s) => s.status(404).json({ message: 'Route not found' }));
app.use((e, q, s, n) => {
  console.error(e.message);
  const status =
    e.name === 'ValidationError' || e.name === 'CastError' || e.message?.startsWith('Only') ? 400 : 500;
  // don't leak internal error details (e.g. database errors) to clients
  s.status(status).json({ message: status === 500 ? 'Server error' : e.message });
});

// Local development only: Vercel sets VERCEL=1 and handles the server itself
if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  connectDB()
    .then(() => app.listen(port, () => console.log(`API running on ${port}`)))
    .catch(e => { console.error(e); process.exit(1); });
}

module.exports = app;