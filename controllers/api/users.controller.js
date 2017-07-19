var config = require('config.json');
var express = require('express');
var router = express.Router();
var ldap = require('ldapjs');
var jwt = require('jsonwebtoken');
var userService = require('services/user.service');

const DN_FOR_DOC = 'OU=doc,OU=Users,OU=Imperial College (London),DC=ic,DC=ac,DC=uk';
const DN_FOR_ALL = 'OU=Users,OU=Imperial College (London),DC=ic,DC=ac,DC=uk';

var user = {};

// routes
router.post('/authenticate', authenticateUser);
router.get('/current', getCurrentUser);

module.exports = router;

function authenticateUser(req, res) {

  user.username = req.body.username;
  var dn = `CN=${req.body.username},${DN_FOR_DOC}`;
  var ldapClient = ldap.createClient({ url : "ldaps://ldaps-vip.cc.ic.ac.uk:636" });

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
      res.send({token:jwt.sign({ username: req.body.username }, config.secret)});
    }
  });
}//TODO: error code and message


function getCurrentUser(req, res) {
   //user role  class     employeeType
   if (user !== {} ) {
     res.send(user);
   } else {
     res.sendStatus(404);
   }
}
