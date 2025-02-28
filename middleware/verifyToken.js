const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  // Skip token verification for login, static files, and favicon
  if (
    req.originalUrl.startsWith('/api/auth/login') ||
    req.originalUrl.startsWith('/image') ||
    req.originalUrl.startsWith('/css') ||
    req.originalUrl.startsWith('/js') ||
    req.originalUrl === '/favicon.ico'
  ) {
    return next(); // Skip token verification
  }

  console.log('Cookies:', req.cookies); // Log cookies to debug

  const token = req.cookies.authToken; // Token is expected in the cookies

  if (!token) {
    console.log('No token provided.');
    return res.status(401).send('Access Denied. No Token Provided.');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.adminId; // Attach decoded adminId to the request
    console.log('Admin ID from token:', req.adminId);
    next(); // Proceed to the next middleware/route
  } catch (err) {
    console.log('Invalid Token:', err.message);
    return res.status(400).send('Invalid Token.');
  }
};
