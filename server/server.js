require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), cors = require('cors'), helmet = require('helmet'), rate = require('express-rate-limit');
const app = express();
app.use(helmet(), cors({ origin: process.env.CLIENT_URL }), express.json({ limit: '1mb' }));
// strip $-operators/dots from input to prevent NoSQL injection
const clean = o => { if (o && typeof o === 'object') for (const k in o) { if (/^\$|\./.test(k)) delete o[k]; else clean(o[k]); } };
app.use((q, s, n) => { clean(q.body); clean(q.query); clean(q.params); n(); });
app.use('/api/auth', rate({ windowMs: 15 * 60e3, max: 50 }), require('./routes/auth'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/catalog'));
app.use((q, s) => s.status(404).json({ message: 'Route not found' }));
app.use((e, q, s, n) => { console.error(e.message); s.status(e.name === 'ValidationError' || e.name === 'CastError' || e.message?.startsWith('Only') ? 400 : 500).json({ message: e.message }); });
mongoose.connect(process.env.MONGO_URI).then(() => app.listen(process.env.PORT || 5000, () => console.log('API running'))).catch(e => { console.error(e); process.exit(1); });
