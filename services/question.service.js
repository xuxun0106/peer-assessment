var config = require('config.json');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('questions');

var service = {};

service.create = create;
service.getByAuthor = getByAuthor;
service.update = update;
service.delete = _delete;

module.exports = service;

function create(Param) {
    var deferred = Q.defer();

    db.questions.findOne(Param, function (err, user) {
         if (err) deferred.reject(err);

         if (user) {
            deferred.reject('Question already exists!');
         } else {
            createQuestion();
         }
      });

    function createQuestion() {

        db.questions.insert(
            Param,
            function (err, data) {
                if (err) deferred.reject(err);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function getByAuthor(_author) {
    var deferred = Q.defer();

    db.questions.find({
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

function update(_id, newQuestion) {
  var deferred = Q.defer();

  db.questions.findOne(newQuestion, function(err, question) {
    if (err) {
      deferred.reject(err);
    } else if (question) {
      deferred.reject('Question already exists!');
    } else {
      updateQuestion();
    }
  });

  function updateQuestion() {
    db.questions.update(
        { _id: mongo.helper.toObjectID(_id) },
        { $set: newQuestion },
        function (err, data) {
            if (err) deferred.reject(err);

            deferred.resolve();
        });
  }

  return deferred.promise;
}

function _delete(id) {
    var deferred = Q.defer();

    db.questions.remove(
        { _id: mongo.helper.toObjectID(id) },
        function (err) {
            if (err) deferred.reject(err);
            else
            deferred.resolve();
        });

    return deferred.promise;
}
