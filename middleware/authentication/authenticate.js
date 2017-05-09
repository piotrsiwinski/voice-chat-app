/**
 * Created by Piotrek on 08.05.2017.
 */
let authenticate = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Only authenticated users can view this page');
    res.status(401).redirect('/account/login');
  }
  next();
};

module.exports = {authenticate};