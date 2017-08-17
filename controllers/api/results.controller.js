var config = require('config.js');
var express = require('express');
var router = express.Router();
var _ = require('lodash');
var resultService = require('services/result.service');
var groupService = require('services/group.service');
var assessmentService = require('services/assessment.service');
var Filter = require('bad-words');
var filter = new Filter();

router.get('/', getResult);
router.post('/', createResult);
router.put('/:_id', update);
router.delete('/:_id', deleteResult);

module.exports = router;

function getResult(req, res) {
  if (req.query.member) {
    resultService.getByUser(req.query)
      .then(function(data) {
        res.send(data);
      })
      .catch(function(err) {
        res.status(400).send(err);
      });
  } else {

    var feedback = {};
    var questionTypes = [];
    var numQuestions = null;

    //get group information
    groupService.getById(req.query.group)
      .then(function(group) {
        feedback.groupId = group._id;
        feedback.groupMember = group.member;

        //get assessment information
        assessmentService.getById(group.assessment)
          .then(function(a) {
            numQuestions = a.questions.length;
            for (var n = 0; n < numQuestions; n++) {
              questionTypes.push(a.questions[n].type);
            }

            //get result
            resultService.getResult(req.query.group)
              .then(function(data) {
                generateFeedback(data);
                res.send(feedback);
              })
              .catch(function(err) {
                console.log(err);
                res.status(400).send(err);
              });
          })
          .catch(function(err) {
            console.log(err);
            res.status(400).send(err);
          });
      })
      .catch(function(err) {
        res.status(400).send(err);
      });
  }

  function generateFeedback(data) {


    //initialise
    var numMember = feedback.groupMember.length;
    var numComplete = data.length;
    feedback.rawResultForIndividual = [];
    feedback.complete = [];
    feedback.results = new Array(numQuestions);
    feedback.comments = new Array(numQuestions);

    // if (data.length === 0) {
    //   return;
    // }

    //find student(s) who did not complete assessment
    for (var n = 0; n < numComplete; n++) {
      feedback.complete.push(data[n].author);
    }
    feedback.noComplete = _.difference(feedback.groupMember, feedback.complete);

    //comments
    for (var j = 0; j < numQuestions; j++) {
      var comment = {};
      for (var i = 0; i < numComplete; i++) {
        if (data[i].comments[j]) {
          comment[data[i].author] = filter.clean(data[i].comments[j]);
        }
      }
      feedback.comments[j] = comment;
    }

    //get results for one student
    // for (var n = 0; n < numMember; n++) {
    //   var member = feedback.groupMember[n];
    //   rawResultForIndividual[member] = new Array(numQuestions);
    //   for (var i = 0; i < numQuestions; i++) {
    //     var question = new Array(numComplete);
    //     for (var j = 0; j < numComplete; j++) {
    //       question[j] = data[j].result[member][i];
    //     }
    //     rawResultForIndividual[member][i] = question;
    //   }
    // }

    //result
    for (var n = 0; n < numQuestions; n++) {
      var question = {};
      for (var i = 0; i < numMember; i++) {
        var member = feedback.groupMember[i];
        question[member] = {};
        for (var j = 0; j < numComplete; j++) {
          if (typeof data[j].result[member][n] === "string") {
            question[member][data[j].author] = filter.clean(data[j].result[member][n]);
          } else {
            question[member][data[j].author] = data[j].result[member][n];
          }
        }
      }
      feedback.rawResultForIndividual.push(question);
    }

    //calculate factors
    for (var n = 0; n < numQuestions; n++) {
      if (questionTypes[n] === 'Single choice' || questionTypes[n] === 'Slider') {
        feedback.results[n] = {};
        var values = {},
          selfRatings = {},
          avgs = [],
          spa = {},
          sapa = {};
        for (var i = 0; i < numMember; i++) {
          var member = feedback.groupMember[i];
          var value = _.values(feedback.rawResultForIndividual[n][member]);
          selfRatings[member] = (feedback.rawResultForIndividual[n][member][member]) ? feedback.rawResultForIndividual[n][member][member] : 0;
          values[member] = value;
          avgs.push(_.sum(value) / value.length);
        }
        var avg = _.sum(avgs) / avgs.length;

        for (var i = 0; i < numMember; i++) {
          var member = feedback.groupMember[i];
          var tempSpa = {};
          var tempSapa = {};
          //spa factor
          spa[member] = knee(avgs[i] / avg).toFixed(2);
          //sapa factor
          var avgByOthers = (_.sum(values[member]) - selfRatings[member]) / (numComplete - 1);
          sapa[member] = Math.sqrt(selfRatings[member] / avgByOthers).toFixed(2);
        }
        feedback.results[n].spa = spa;
        feedback.results[n].sapa = sapa;
      } else if (questionTypes[n] === 'Multiple choice') {
        feedback.results[n] = {};
        for (var i = 0; i < numMember; i++) {
          var member = feedback.groupMember[i];
          var options = _.flattenDeep(_.values(feedback.rawResultForIndividual[n][member]));
          var result = {};
          while (options.length > 0) {
            var first = options[0];
            var count = 1;
            for (var j = 1; j < options.length; j++) {
              if (first === options[j]) {
                count++;
              }
            }
            result[first] = count;
            _.pull(options, first);
          }
          feedback.results[n][member] = result;
        }
      } else {
        feedback.results[n] = feedback.rawResultForIndividual[n];
      }
    }
  }

  function knee(v) {
    if (v >= 1) {
      return Math.sqrt(v);
    } else {
      return v;
    }
  }
}

function createResult(req, res) {
  resultService.create(req.body)
    .then(function() {
      res.sendStatus(201);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}

function update(req, res) {
  resultService.update(req.params._id, req.body)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}

function deleteResult(req, res) {
  resultService.delete(req.params._id)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}
