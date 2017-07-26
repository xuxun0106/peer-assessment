var config = require('config.json');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {
  native_parser: true
});
db.bind('groups');

var service = {};

service.getByUser = getByUser;
service.create = create;
service.getByAssessment = getByAssessment;
service.update = update;
service.delete = _delete;

module.exports = service;

function getByUser(query) {
  var deferred = Q.defer();
  db.groups.findOne({
    assessment : query.assessment,
    member : query.member
  }, function(err, g) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(g);
    }
  });

  return deferred.promise;
}

function create(Group) {

  var deferred = Q.defer();

  db.groups.findOne({
    member: Group.member[0]
  }, function(err, g) {
    if (err) deferred.reject(err);

    if (g) {
      deferred.reject('You are already in a group!');
    } else {
      createGroup();
    }
  });

  function createGroup() {

    db.groups.insert(
      Group,
      function(err, data) {
        if (err) deferred.reject(err);

        deferred.resolve();
      });
  }

  return deferred.promise;
}

function getByAssessment(_assessment) {
  var deferred = Q.defer();

  db.groups.find({
    assessment: _assessment
  }).toArray(function(err, data) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(data);
    }
  });

  return deferred.promise;
}

function update(_id, Group) {
  var deferred = Q.defer();

  db.groups.update({
      _id: mongo.helper.toObjectID(_id)
    },{
      $set : {
        member : Group.member,
        locked : Group.locked
      }
    },
    function(err, data) {
      if (err) deferred.reject(err);
      else
      deferred.resolve();
    });


  return deferred.promise;
}

function _delete(id) {
  var deferred = Q.defer();

  db.groups.remove({
      _id: mongo.helper.toObjectID(id)
    },
    function(err) {
      if (err) deferred.reject(err);
      else
        deferred.resolve();
    });

  return deferred.promise;
}
