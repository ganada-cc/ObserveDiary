module.exports = function (req, res, next) {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - X-User-Id header missing' });
  }

  if (parseInt(userId) <= 0) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  req.user = { user_id: userId };
  next();
};