const jwt = require('jsonwebtoken');
const { User } = require('../models');
exports.protect = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    if (!t) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = jwt.verify(t, process.env.JWT_SECRET);
    req.user = await User.findById(id);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch { res.status(401).json({ message: 'Invalid or expired token' }); }
};
exports.adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access required' });
exports.wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
