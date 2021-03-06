var config = require('config.js');
var express = require('express');
var router = express.Router();
var questionService = require('services/question.service');

router.get('/:username', getByAuthor);
router.post('/', createQuestion);
router.put('/:_id', updateQuestion);
router.delete('/:_id', deleteQuestion);

module.exports = router;

function createQuestion(req, res) {
  questionService.create(req.body)
      .then(function() {
        res.sendStatus(201);
      })
      .catch(function() {
        res.status(400).send(err);
      });
}

function getByAuthor(req, res) {
  questionService.getByAuthor(req.params.username)
      .then(function(data) {
        res.send(data);
      })
      .catch(function(err) {
        res.status(400).send(err);
      })
}

function updateQuestion(req, res) {
  questionService.update(req.params.id, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function deleteQuestion(req, res) {
   questionService.delete(req.params._id)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}
