var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('forms');

var service = {};

service.create = create;
service.getByAuthor = getByAuthor;
service.getById = getById;
service.getAll = getAll;
service.update = update;
service.delete = _delete;

function create(formParam) {
  var deferred = Q.defer();

  db.users.findOne(
      { name: formParam.name },
      function (err, form) {
          if (err) deferred.reject(err.name + ': ' + err.message);

          if (form) {
              deferred.reject('Name "' + formParam.name + '" is already taken');
          } else {
              createForm();
          }
      });

  function createForm() {

      var form = formParam;

      db.forms.insert(
          form,
          function (err, doc) {
              if (err) deferred.reject(err.name + ': ' + err.message);

              deferred.resolve();
          });
  }

  return deferred.promise;
}

function getByAuthor(_author) {
    var deferred = Q.defer();

    db.collection('forms').find({ author : _author}).toArray(function(err, searchResults){
      if (err) deferred.reject(err.name + ': ' + err.message);

      var promises = [];

      for (i=0; i<searchResults.length; i++){
        promises[i] = new Promise(function(resolve){
          resolve(searchResults[i]);
        });
      }
      Promise.all(promises).then(results=> {
        deferred.resolve(results);
      });
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function update(_id, formParam) {
    var deferred = Q.defer();

    // validation
    db.forms.findById(_id, function (err, form) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (form.name !== formParam.name) {
            db.forms.findOne(
                { name: formParam.name },
                function (err, form) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (form) {
                        deferred.reject('Name "' + req.body.name + '" is already taken')
                    } else {
                        updateForm();
                    }
                });
        } else {
            updateForm();
        }
    });

    function updateUser() {
        // fields to update
        var set = {
            name: formParam.name,
        };

        db.forms.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.users.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}
