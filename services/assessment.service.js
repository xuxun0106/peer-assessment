var config = require('config.json');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {
  native_parser: true
});
db.bind('assessments');

var service = {};

service.create = create;
service.getByAuthor = getByAuthor;
service.getByCourse = getByCourse;
service.update = update;
service.delete = _delete;

module.exports = service;

function create(Param) {
  var deferred = Q.defer();

  createAssessment();

  function createAssessment() {

    db.assessments.insert(
      Param,
      function(err, data) {
        if (err) deferred.reject(err);

        deferred.resolve();
      });
  }

  return deferred.promise;
}

function getByCourse(_code) {
    var deferred = Q.defer();
    
    db.assessments.find({
      courseCode : _code
    }).toArray(function(err, data) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(data);
      }
    });

    return deferred.promise;
}

function getByAuthor(_author) {
    var deferred = Q.defer();

    db.assessments.find({
      author : _author
    }).toArray(function(err, data) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(data);
      }
    });

    return deferred.promise;
}

function update(_id, newAssessment) {
  var deferred = Q.defer();

  updateAssessment();

  function updateAssessment() {
    db.assessments.update({
        _id: mongo.helper.toObjectID(_id)
      }, {
        $set: newAssessment
      },
      function(err, data) {
        if (err) deferred.reject(err);

        deferred.resolve();
      });
  }

  return deferred.promise;
}

function _delete(id) {
  var deferred = Q.defer();

  db.assessments.remove({
      _id: mongo.helper.toObjectID(id)
    },
    function(err) {
      if (err) deferred.reject(err);
      else
        deferred.resolve();
    });

  return deferred.promise;
}
