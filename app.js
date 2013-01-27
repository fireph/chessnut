//ports to listen on
var expressPort = 8081;

var redisPort = 6379;
var redisUrl = "127.0.0.1";
var redisPass = "pass";

//chess.js
var ch = require('chess.js');
var uuid = require('node-uuid');
var glicko2 = require('glicko2');

//express
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var sio = require('socket.io');
var io = sio.listen(server);

//redis
/*
var redis = require('redis');
var pub = redis.createClient(redisPort, redisUrl);
var sub = redis.createClient(redisPort, redisUrl);
var store = redis.createClient(redisPort, redisUrl);
pub.auth(redisPass, function(){console.log("pub done!")});
sub.auth(redisPass, function(){console.log("subd done!")});
store.auth(redisPass, function(){console.log("store done!")});
*/

//configure socket.io
io.configure( function(){
	io.enable('browser client minification');  // send minified client
	io.enable('browser client etag');          // apply etag caching logic based on version number
	io.enable('browser client gzip');          // gzip the file
	io.set('log level', 1);                    // reduce logging
	//var RedisStore = require('socket.io/lib/stores/redis');
	//io.set('store', new RedisStore({redisPub:pub, redisSub:sub, redisClient:store}));
});

//configuration file for passport
var conf = require('./conf')

var passport = require('passport')
	, FacebookStrategy = require('passport-facebook').Strategy
	, LocalStrategy = require('passport-local').Strategy;

//config express
app.configure(function() {
	app.use(express.compress());
	app.set('views', __dirname + '/views');
	app.set('view options', { layout: false});
	app.set('view engine', 'ejs');
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({ secret: 'sessionchessnutsecret' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(express.static(__dirname + '/static'));
	app.use(app.router);
});

//mongoskin
var mongo = require('mongoskin');
var db = mongo.db('localhost:27017/chessnut?auto_reconnect');
var userColl = db.collection('users');
var rankColl = db.collection('ranks');
var userInfoColl = db.collection('userinfo');

//passport code
passport.use(new FacebookStrategy({
		clientID: conf.fb.appId,
		clientSecret: conf.fb.appSecret,
		callbackURL: "http://chessnut.fmeyer.com/auth/facebook/callback"
	},
	function(accessToken, refreshToken, profile, done) {
		userColl.findOne({fbId: profile.id}, function (err, account) {
			if (err) { return done(err); }
			if (account) {
				return done(null, account);
			} else {
				var newAccount = {};
				newAccount.type = 'facebook';
				newAccount.picture = 'https://graph.facebook.com/'+ profile.id +'/picture'
				newAccount.name = profile.displayName;
				newAccount.fbId = profile.id;
				newAccount.date = new Date();
				newAccount.userId = uuid.v1();
				userColl.insert(newAccount, function(err, result) {
					if (err) {
						console.log("Facebook Insert Error in User Collection: "+err); return;
					} else {
						//do nothing, adding was a success
					}
					return done(null, result);
				});
			}
		});
	}
));

passport.serializeUser(function(user, done) {
	//console.log(user);
	done(null, user.userId);
});

passport.deserializeUser(function(id, done) {
	userColl.findOne({userId: id}, function (err, user) {
		done(err, user);
	});
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		if (username) {
			userColl.findOne({username: username}, function (err, user) {
				if (err) { return done(err); }
				if (!user) {
					return done(null, false, { message: 'Unknown user' });
				}
				/*
				if (!user.validPassword(password)) {
					return done(null, false, { message: 'Invalid password' });
				}
				*/
				return done(null, user);
			});
		} else {
			return done(null, false, { message: 'Empty username' });
		}
	}
));

app.get('/', function(req, res){
	if (req.user) {
		res.render("index", {user: req.user, userId: req.userId});
	} else {
		res.redirect('/login');
	}
});

app.get('/login', function(req, res){
	if (req.user) {
		res.redirect('/');
	} else {
		res.render('login');
	}
});

app.get("/logout", function (req, res) {
	req.logOut();
	res.redirect('/');
});

app.post('/register/local', function (req, res) {
	var regUser = req.body;
	userColl.findOne({username: regUser.username}, function (err, account) {
		if(err) {
			console.log("Find Error in User Collection: "+err); return;
		}
		if (account) {
			//account already exists, redirect to login page.
			res.redirect('/login')
		} else {
			var newAccount = {};
			newAccount.type = 'local';
			newAccount.picture = '/img/test.jpg';
			newAccount.name = regUser.name;
			newAccount.username = regUser.username;
			newAccount.password = regUser.password;
			newAccount.date = new Date();
			newAccount.userId = uuid.v1();
			userColl.insert(newAccount, function(err, result) {
				if (err) {
					console.log("Local Insert Error in User Collection: "+err); return;
				} else {
					//do nothing, adding was a success
				}
				res.redirect('/login');
			});
		}
	});
});
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', 
	passport.authenticate('facebook', { successRedirect: '/',
																			failureRedirect: '/login' }));
app.post('/auth/local',
	passport.authenticate('local', { successRedirect: '/',
																	 failureRedirect: '/login',
																	 failureFlash: 'Invalid credentials' })
);

var match = require('./room.js');
var matchMakingRooms = new match.matchMaking(io, ch, glicko2, uuid);

server.listen(expressPort);
console.log('Express on port: '+expressPort);
