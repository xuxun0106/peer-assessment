var config = require('config.json');
var express = require('express');
var router = express.Router();
var assessmentService = require('services/assessment.service');

router.get('/:course', getByCourse);
router.post('/', createAssessment);
router.put('/:_id', updateAssessment);
router.delete('/:_id', deleteAssessment);

module.exports = router;

function createAssessment(req, res) {
  assessmentService.create(req.body)
      .then(function() {
        res.sendStatus(201);
      })
      .catch(function() {
        res.sendStatus(400).send(err);
      });
}

function getByCourse(req, res) {
  assessmentService.getByCourse(req.params.course)
      .then(function(data) {
        res.send(data);
      })
      .catch(function(err) {
        res.sendStatus(400).send(err);
      })
}

function updateAssessment(req, res) {
  assessmentService.update(req.params.id, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function deleteAssessment(req, res) {
   assessmentService.delete(req.params._id)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}