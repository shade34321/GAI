
/**
 * Module dependencies.
 */

var coffee = require('coffee-script');
var express = require('express');
var crypto = require('crypto');

var users = require('./users');


var app = module.exports = express.createServer();

var admin = require('./routes/admin')(app);
var routes = require('./routes');
console.log (admin.index);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('users', users);
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// TODO: trying use everyauth modue
function checkAuth(req, res, next) {
    var sess = req.cookies.tx_session;

    if (sess == undefined)
        return res.redirect('/admin/login');

    for(var cnt = 0; cnt < users.length; cnt++)
        if (users[cnt].session == sess)
            return next();

    return res.redirect('/admin/login');
}

// Routes

app.get('/admin/logout', function(req, res, next) {

    res.clearCookie('TX_SESSION');
    res.clearCookie('LOGIN');

    res.redirect('/');
});

app.get('/admin/login', function(req, res, next) {
    res.render('login', {
        title: "Login"
    });
});

app.post('/admin/login', function(req, res, next) {
    var user = req.body.user;
    var pwd = req.body.pwd;
    var found = false;
    var cnt = 0;

    for (cnt = 0; cnt < users.length; cnt++) {
        if (users[cnt].user == user && users[cnt].pwd == pwd) {
            found = true;
            break;
        }
    }

    if (!found)
        return res.render("login", {
            title: "Login",
            errors: [ "Неправильная пара логин/пароль" ]
        });

    var secret = "y8tHachup4aPhaKUThA3$USWa";

    var shasum = crypto.createHash('sha1');
    shasum.update(user + pwd + secret);

    users[cnt].session = shasum.digest('hex');

    var oneDay = 60*60*24*1000;

    res.cookie('TX_SESSION', users[cnt].session, {
        expires: new Date(Date.now() + oneDay),
        httpOnly: true
    });
    res.cookie('LOGIN', users[cnt].user, {
        expires: new Date(Date.now() + oneDay),
        httpOnly: true
    });

    res.redirect('/admin/index');
});



// Pages

app.all('^/admin*$', function(req, res, next) {
    if (/^\/vendor\//.test(req.path) ||
        /^\/css\//.test(req.path) ||
        /^\/js\//.test(req.path) ||
        /^\/img\//.test(req.path))
        return next();

    return checkAuth(req, res, next);
});


app.get('/', routes.index);
app.get('/admin/?(index)?', admin.index);


// Api
// TODO: by what? date, region, road... or custom query?

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
