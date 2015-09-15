var isUser = function(req, res) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    return true
  }
};

module.exports.isUser = isUser;