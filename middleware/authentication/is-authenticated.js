let isAuthenticated = (req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  if (req.user) {
    res.locals.user = {_id: req.user._id, email: req.user.email};
  }
  next();
};

module.exports = {isAuthenticated};