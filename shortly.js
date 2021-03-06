var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var helpers = require('./helpers/isUser');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({ secret: 'pair program spooning'}));


app.get('/', 
function(req, res) {
  // use conditional to see if user is already logged in
  // render login if not
  if(helpers.isUser(req, res)) {
    res.render('index');
  }

});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  //invoke users collection .add method, passing in new user model
  var username = req.body.username;
  var password = req.body.password;

  new User({username: username}).fetch().then(function(found) {
    if (found) {
      res.send('Username taken');
    } else {
      Users.create({
        username: username,
        password: password
      }).then(function(newUser) {
        res.redirect('/');
      });
    }
  });
  
});

app.get('/create', 
function(req, res) {
  if(helpers.isUser(req, res)) {
    res.render('create');
  }
});

app.get('/links', 
function(req, res) {
  if(helpers.isUser(req, res)) {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  }
});

app.post('/links', 
function(req, res) {
  if(helpers.isUser(req, res)) {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.send(404);
    }

    new Link({ url: uri }).fetch().then(function(found) {
      if (found) {
        res.send(200, found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.send(404);
          }

          Links.create({
            url: uri,
            title: title,
            base_url: req.headers.origin
          })
          .then(function(newLink) {
            res.send(200, newLink);
          });
        });
      }
    });
  }
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', function(req, res) {
  res.render('login');
})

app.post('/login', function(req, res) {
  var sessionID = { username: req.body.username };
  new User({ username: req.body.username}).fetch().then(function(user) {
    if(user) {
      var match = bcrypt.compareSync(req.body.password, user.get('password'));
      if(match) {
        req.session.user = req.body.username;

        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    } else {
      res.redirect('/login');
    }
  });

});

app.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      console.log(err, 'Could not destroy session');

    }
  });
  res.redirect('/login');
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
