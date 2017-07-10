var config = require('config.json');
var express = require('express');
var router = express.Router();
var ldap = require('ldapjs');
var jwt = require('jsonwebtoken');

const DN_FOR_DOC = 'OU=doc,OU=Users,OU=Imperial College (London),DC=ic,DC=ac,DC=uk';
const DN_FOR_ALL = 'OU=Users,OU=Imperial College (London),DC=ic,DC=ac,DC=uk';

// routes
router.post('/authenticate', authenticateUser);
router.get('/current', getCurrentUser);

module.exports = router;

function authenticateUser(req, res) {

  var dn = `CN=${req.body.username},${DN_FOR_DOC}`;
  var ldapClient = ldap.createClient({ url : "ldaps://ldaps-vip.cc.ic.ac.uk:636" });

  ldapClient.bind(dn, req.body.password, function(err) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      console.log("2");
      res.send({token:jwt.sign({ username: req.body.username }, config.secret)});
    }
  });
}//TODO: error code and message


function getCurrentUser(req, res) {
   user role  class     employeeType
   var dn = `CN=${req.body.username},${DN_FOR_DOC}`;
   var ldapClient = ldap.createClient({ url : "ldaps://ldaps-vip.cc.ic.ac.uk:636" });
   var user = {};

   ldapClient.bind(dn, req.body.password, function(err) {
     if (err) {
       res.status(400).send(err);
     } else {
       ldapClient.compare(dn, "employeeType", "student,memeber", function(err, matched) {
         if (err) {
           console.log(err);
           res.status(400).send(err);
         } else {
           console.log("matched!")
           console.log(matched);
         }
       });
     }
   });


    // userService.getById(req.user.sub)
    //     .then(function (user) {
    //         if (user) {
    //             res.send(user);
    //         } else {
    //             res.sendStatus(404);
    //         }
    //     })
    //     .catch(function (err) {
    //         res.status(400).send(err);
    //     });
}
