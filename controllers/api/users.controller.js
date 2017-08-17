var config = require('config.js');
var express = require('express');
var router = express.Router();
var ldap = require('ldapjs');
var jwt = require('jsonwebtoken');
var https = require('https');
var userService = require('services/user.service');

// routes
router.post('/authenticate', authenticateUser);
router.get('/current', getCurrentUser);
router.get('/allcourses', getAllCourses);

module.exports = router;


function getAllCourses(req, res) {
  var allcourses;
  var options = {
    hostname: "dbc.doc.ic.ac.uk",
    path: "/api/teachdbs/views/curr/courses",
    auth: "xx4615:XUxu4088?"
  };

  var courses = https.get(options, function(response) {
    var body = "";
    response.on('data', function(chunk) {
      body += chunk;
    });
    response.on('end', function() {
      allcourses = JSON.parse(body);
      res.send(allcourses);
    });
  });
}


function authenticateUser(req, res) {
  userService.authenticate(req.body.username, req.body.password)
    .then(function(token) {
      if (token) {
        // authentication successful
        res.send({
          token: token
        });
      } else {
        // authentication failed
        res.sendStatus(401);
      }
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}


function getCurrentUser(req, res) {
  userService.getById(req.user.sub)
    .then(function(user) {
      if (user) {
        res.send(user);
      } else {
        res.sendStatus(404);
      }
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}






// const DN_FOR_DOC = 'OU=doc,OU=Users,OU=Imperial College (London),DC=ic,DC=ac,DC=uk';
// const DN_FOR_ALL = 'OU=Users,OU=Imperial College (London),DC=ic,DC=ac,DC=uk';
//
// var user = {};
// var allcourses = {};
// var studentCourses = {};
//
// // routes
// router.post('/authenticate', authenticateUser);
// router.get('/current', getCurrentUser);
// router.get('/allcourses', getAllCourses);
// router.get('/courses', getCourses);
//
// module.exports = router;
//
// function getCourses(req, res) {
//     res.send(studentCourses);
// }
//
// function getAllCourses(req, res) {
//     res.send(allcourses);
// }
//
//
// function authenticateUser(req, res) {
//
//   user.username = req.body.username;
//   var dn = `CN=${req.body.username},${DN_FOR_DOC}`;
//   var ldapClient = ldap.createClient({
//     url: "ldaps://ldaps-vip.cc.ic.ac.uk:636"
//   });
//
//
//   ldapClient.bind(dn, req.body.password, function(err) {
//     if (err) {
//       console.log(err);
//       res.status(400).send(err);
//     } else {
//       var options = {
//         hostname: "dbc.doc.ic.ac.uk",
//         path: "/api/teachdbs/views/curr/courses",
//         auth: req.body.username+":"+req.body.password
//       };
//
//       var courses = https.get(options, function(response) {
//         var body = "";
//         response.on('data', function(chunk) {
//           body += chunk;
//         });
//         response.on('end', function() {
//           allcourses = JSON.parse(body);
//         });
//       });
//
//       ldapClient.compare(dn, 'employeeType', 'student,member', function(err, matched) {
//         if (err) {
//           console.log(err);
//         } else if (matched) {
//           user.type = 'student';
//           var options2 = {
//             hostname: "dbc.doc.ic.ac.uk",
//             path: "/api/teachdbs/views/curr/individual/student/courses",
//             auth: req.body.username+":"+req.body.password
//           };
//
//           var courses2 = https.get(options2, function(response) {
//             var body = "";
//             response.on('data', function(chunk) {
//               body += chunk;
//             });
//             response.on('end', function() {
//               studentCourses = JSON.parse(body);
//             });
//           });
//         } else {
//           user.type = 'instructor';
//         }
//       });
//       res.send({
//         token: jwt.sign({
//           username: req.body.username
//         }, config.secret)
//       });
//     }
//   });
// } //TODO: error code and message
//
//
// function getCurrentUser(req, res) {
//   //user role  class     employeeType
//   if (user !== {}) {
//     res.send(user);
//   } else {
//     res.sendStatus(404);
//   }
// }
