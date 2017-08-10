var config = require('config.json');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {
  native_parser: true
});
db.bind('results');

var service = {};

service.getResult = getResult;
service.getByUser = getByUser;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function getByUser(query) {
  var deferred = Q.defer();
  db.results.findOne({
    group : query.group,
    author : query.member
  }, function(err, g) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(g);
    }
  });

  return deferred.promise;
}

function getResult(id) {
  var deferred = Q.defer();

  db.results.find({
    group: id
  }).toArray(function(err, data) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(data);
    }
  });

  return deferred.promise;
}

function create(Result) {

  var deferred = Q.defer();

  db.results.findOne({
    group: Result.group,
    author: Result.author
  }, function(err, g) {
    if (err) deferred.reject(err);

    if (g) {
      deferred.reject();
    } else {
      createResult();
    }
  });

  function createResult() {

    db.results.insert(
      Result,
      function(err, data) {
        if (err) deferred.reject(err);

        deferred.resolve();
      });
  }

  return deferred.promise;
}

function update(_id, Result) {
  var deferred = Q.defer();

  db.results.update({
      _id: mongo.helper.toObjectID(_id)
    }, {
      $set: {
        result: Result.result
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

  db.results.remove({
      _id: mongo.helper.toObjectID(id)
    },
    function(err) {
      if (err) deferred.reject(err);
      else
        deferred.resolve();
    });

  return deferred.promise;
}
