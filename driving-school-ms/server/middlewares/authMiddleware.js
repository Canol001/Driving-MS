const jwt = require('jsonwebtoken');

module.exports = (allowedRoles) => (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  console.log('authMiddleware: Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.error('authMiddleware: No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('authMiddleware: Token decoded:', decoded);

    req.user = decoded.user; // ✅ extract the actual user info

    const userRole = decoded.user?.role;
    if (!allowedRoles.includes(userRole)) {
      console.error('authMiddleware: User role not authorized:', userRole);
      return res.status(403).json({ message: `User role '${userRole}' not authorized` });
    }

    next();
  } catch (error) {
    console.error('authMiddleware: Invalid token:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
