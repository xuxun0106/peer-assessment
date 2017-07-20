
var config = require('config.json');
var express = require('express');
var router = express.Router();
var ldap = require('ldapjs');
var jwt = require('jsonwebtoken');
var Kerberos = require('kerberos').Kerberos;
var kerberos = new Kerberos();
var http = require('http');

const DN_FOR_DOC = 'OU=doc,OU=Users,OU=Imperial College (London),DC=ic,DC=ac,DC=uk';
const DN_FOR_ALL = 'OU=Users,OU=Imperial College (London),DC=ic,DC=ac,DC=uk';

var user = {};

// routes
router.post('/authenticate', authenticateUser);
router.get('/current', getCurrentUser);
router.get('/allcourses', getAllCourses)

module.exports = router;

function getAllCourses(req, res) {
  var options = {
    hostname: "dbc.doc.ic.ac.uk",
    path: "/api/teachdbs/views/curr/courses"
  };

  var req = httpget(options, function(res) {
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      console.log("BODY: " + body);
    });
  });

  req.on('resubmit', function(newreq) {
    console.log('request resubmitted');
    req = newreq;
  });

  return;
}

function httpget(opts, callback) {
  console.log('submitting to ' + (opts.hostname || opts.host) + ' with authorization header: ' + (opts.headers || {}).authorization);
  var req = http.get(opts, function(res) {
    if (res.statusCode == 401) {
      submitWithAuthorization(req, opts, callback);
      return;
    }
    callback(res);
  });
  return req;
}

function submitWithAuthorization(oldreq, opts, callback) {
  kerberos.authGSSClientInit("HTTP@" + (opts.hostname || opts.host), 0, function(err, ctx) {
    if (err) {
      throw new Error("" + err);
    }
    console.log('done init ' + ctx);
    kerberos.authGSSClientStep(ctx, "", function(err) {
      if (err) {
        throw new Error("" + err);
      }
      console.log('done step ' + ctx.response);
      var headers = opts.headers || {};
      headers.authorization = "Negotiate " + ctx.response;
      opts.headers = headers;
      var newreq = httpget(opts, callback);

      // tell oldReq "owner" about newReq. resubmit is an "unofficial" event
      oldreq.emit('resubmit', newreq);
      kerberos.authGSSClientClean(ctx, function(err) {
        if (err) {
          throw new Error("" + err);
        }
      });
    });
  });
}









function authenticateUser(req, res) {

  user.username = req.body.username;
  var dn = `CN=${req.body.username},${DN_FOR_DOC}`;
  var ldapClient = ldap.createClient({
    url: "ldaps://ldaps-vip.cc.ic.ac.uk:636"
  });

  ldapClient.bind(dn, req.body.password, function(err) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      ldapClient.compare(dn, 'employeeType', 'student,member', function(err, matched) {
        if (err) {
          console.log(err);
        } else if (matched) {
          user.type = 'student';
        } else {
          user.type = 'instructor';
        }
      });
      res.send({
        token: jwt.sign({
          username: req.body.username
        }, config.secret)
      });
    }
  });
} //TODO: error code and message


function getCurrentUser(req, res) {
  //user role  class     employeeType
  if (user !== {}) {
    res.send(user);
  } else {
    res.sendStatus(404);
  }
}
