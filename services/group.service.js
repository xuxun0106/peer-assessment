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
service.getById = getById;
service.update = update;
service.delete = _delete;

module.exports = service;

function getByUser(query) {
  query.member = query.member.split(',');
  var deferred = Q.defer();
  if (typeof query.member === "string") {
    db.groups.findOne({
      assessment: query.assessment,
      member: query.member
    }, function(err, g) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(g);
      }
    });
  } else if (Array.isArray(query.member)) {
    db.groups.findOne({
      assessment: query.assessment,
      member: {
        $all: query.member
      }
    }, function(err, g) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(g);
      }
    });
  }


  return deferred.promise;
}

function getById(id) {
  var deferred = Q.defer();
  db.groups.findById(id, function(err, group) {
    if (err) deferred.reject(err);

    if (group) {
      deferred.resolve(group);
    } else {
      deferred.reject();
    }
  })
  return deferred.promise;
}

function create(Group) {
  var deferred = Q.defer();

  db.groups.findOne({
    assessment: Group.assessment,
    member: {
      $in: Group.member
    }
  }, function(err, g) {
    if (err) deferred.reject(err);

    if (g) {
      deferred.reject('Please quit current group first!');
    } else {
      createGroup();
    }
  });

  function createGroup() {

    db.groups.insert(
      Group,
      function(err, data) {
        if (err) deferred.reject(err);

        deferred.resolve(data.ops[0]);
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

  if (Group.grade !== undefined || Group.grade !== null) {
    db.groups.update({
        _id: mongo.helper.toObjectID(_id)
      }, {
        $set: {
          grade: Group.grade
        }
      },
      function(err, data) {
        if (err) deferred.reject(err);
        else
          deferred.resolve();
      });
  } else {
    db.groups.update({
        _id: mongo.helper.toObjectID(_id)
      }, {
        $set: {
          member: Group.member,
          locked: Group.locked
        }
      },
      function(err, data) {
        if (err) deferred.reject(err);
        else
          deferred.resolve();
      });
  }

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
