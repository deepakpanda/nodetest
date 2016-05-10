//  OpenShift sample Node application
//var express = require('express'),
    
	
	var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan');

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    //mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

/*if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    //mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    //mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
	mongoURL +='127.0.0.1' + ':' +  '27017' + '/' + 'test';
	mongoURLLabel +='127.0.0.1' + ':' +  '27017' + '/' + 'test';

  }
}*/
mongoose.connect('mongodb://127.0.0.1/test');
mongoURLLabel = mongoURL = 'mongodb://';
mongoURL +='127.0.0.1' + ':' +  '27017' + '/' + 'test';
	mongoURLLabel +='127.0.0.1' + ':' +  '27017' + '/' + 'test';
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};


// all environments
//app.set('port', process.env.PORT || 3001);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(passport.session()); 
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var Schema = mongoose.Schema;


var UserDetail = new Schema({
	firstname:{type:String},
	lastname: {type:String},
    username: {type:String},
    password: {type:String}
});

//console.log("UserDetail",UserDetail);



var userInfo = mongoose.model('infotest',UserDetail);
//console.log("userinfo",userinfo);

/*var userSchema = mongoose.Schema({
   // userinfo             : {
	firstname     :String,
        lastname        : String,
        username     : String,
	password	     : String,
	   // }
},{collection: 'userInfo'});*/

//var UserDetails1 = mongoose.model('userInfo',userSchema);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


passport.use(new LocalStrategy(
  function(username, password, done) {
   
    process.nextTick(function () {
	  userInfo.findOne({'username':username},
		function(err, user) {
			if (err) { return done(err); }
			if (!user) { return done(null, false); }
			if (user.password != password) { return done(null, false); }
			return done(null, user);
		});
    });
  }
));



app.get('/auth', function(req, res, next) {
  res.sendfile('views/login.html');
});

app.get('/register', function(req, res, next) {
  res.sendfile('views/register.html');
});

app.get('/loginFailure' , function(req, res, next){
	res.send('Failure to authenticate');
});

app.get('/loginSuccess' , function(req, res, next){
	res.send('Successfully authenticated');
});


app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/loginSuccess',
    failureRedirect: '/loginFailure'
  }));
  
/* app.post('/register1',
  UserDetail.methods.updateUser = function(request, response){

	//this.user.name = request.body.name;
	
	 console.log(request.body.firstname,request.body.lastname);
	 //var UserDetails = mongoose.model('userInfo',UserDetail);
	 var person_data = new userInfo({
    firstname: request.body.firstname
  , lastname: request.body.lastname
  , username: request.body.username,
  password: request.body.password
});

//var userInfo = new userinfo(person_data);
console.log(person_data);
person_data.save( function(error, person_data){
    if(error){
        response.json(error);
    }
    else{
        response.json(person_data);
		console.log(response, person_data,error);
    }
});
	 //var reg=function(db){db.collection('test').insertone({'userinfo':{'firstname':request.body.firstname,'lastname':request.body.lastname,'username':request.body.username,'password':request.body.password}})}
	response.redirect('/auth');
}
  );*/
  
  app.post('/register1',function(request, response){
	  console.log("Inside Api");
 var person_data = new userInfo({
    firstname: request.body.firstname
  , lastname: request.body.lastname
  , username: request.body.username,
  password: request.body.password
});
console.log(person_data);
person_data.save( function(error){
    if(error){
		console.log(error);
        response.json(error);
    }
    else{
        //response.json(person_data);
		console.log("Inside Server Save")
		//console.log(person_data);
		response.redirect('/auth');
    }
});

});


app.get('/', function (req, res) {
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
