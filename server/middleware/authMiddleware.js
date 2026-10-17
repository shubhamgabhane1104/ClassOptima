const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getSecret = () => process.env.JWT_SECRET || 'classoptima_dev_secret_change_me';

// Verifies the "Authorization: Bearer <token>" header and attaches req.user.
exports.verifyToken = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }
  try {
    const decoded = jwt.verify(token, getSecret());
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
};

// Role-based access control: requireRole('admin') or requireRole('admin', 'professor')
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. This action needs the ${roles.join(' or ')} role.`,
    });
  }
  next();
};

exports.signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, getSecret(), { expiresIn: '7d' });
