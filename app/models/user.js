var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  links: function() {
    return this.hasMany(Link);
  },

  initialize: function() {
      // debugger;
      // var user = this;
      // var username = this.get('username');
      // var password = this.get('password');
    this.on('creating', function(model, attrs, options) {
      // debugger;
      bcrypt.genSalt(10, function(err, salt) {
        // debugger;
        bcrypt.hash(model.get('password'), salt, null, function(err, hash) {
          model.set('password', hash);
          model.set('salt', salt);
        });
      });
      
    });

  }

});

module.exports = User;