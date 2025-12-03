const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Allow demo token for testing
  if (token === 'demo-token' && process.env.NODE_ENV !== 'production') {
    req.user = {
      userId: 'demo-user',
      accountId: 'demo-account',
      mondayToken: 'demo-monday-token'
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
