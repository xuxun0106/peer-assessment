var config = require('config.js');
var express = require('express');
var router = express.Router();
var assessmentService = require('services/assessment.service');


router.get('/:username', getByAuthor);
router.get('/', getByCourse)
router.post('/', createAssessment);
router.put('/:_id', updateAssessment);
router.delete('/:_id', deleteAssessment);

module.exports = router;

function createAssessment(req, res) {
  assessmentService.create(req.body)
    .then(function(data) {
      res.status(201).send(data);
    })
    .catch(function() {
      res.status(400).send(err);
    });
}

function getByCourse(req, res) {
  if (req.query.code) {
    assessmentService.getByCourse(req.query.code)
      .then(function(data) {
        res.send(data);
      })
      .catch(function(err) {
        res.status(400).send(err);
      });
  } else if (req.query.id) {
    assessmentService.getById(req.query.id)
      .then(function(data) {
        res.send(data);
      })
      .catch(function(err) {
        res.status(400).send(err);
      });
  }

}

function getByAuthor(req, res) {
  assessmentService.getByAuthor(req.params.username)
    .then(function(data) {
      res.send(data);
    })
    .catch(function(err) {
      res.status(400).send(err);
    })
}

function updateAssessment(req, res) {
  assessmentService.update(req.params._id, req.body)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}

function deleteAssessment(req, res) {
  assessmentService.delete(req.params._id)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}
