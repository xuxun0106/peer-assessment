﻿require('rootpath')();
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('config.js');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: config.secret, resave: false, saveUninitialized: true }));

// use JWT auth to secure the api
app.use('/api', expressJwt({ secret: config.secret }).unless({ path: ['/api/users/authenticate'] }));

// routes
app.use('/login', require('./controllers/login.controller'));
app.use('/app', require('./controllers/app.controller'));
app.use('/api/users', require('./controllers/api/users.controller'));
app.use('/api/questions', require('./controllers/api/questions.controller'));
app.use('/api/assessments', require('./controllers/api/assessments.controller'));
app.use('/api/groups', require('./controllers/api/groups.controller'));
app.use('/api/results', require('./controllers/api/results.controller'));


// make '/app' default route
app.get('/', function (req, res) {
    return res.redirect('/app');
});

// start server
var server = app.listen(process.env.PORT || 5000, function () {
    console.log('Server listening at http://' + server.address().address + ':' + server.address().port);
});
