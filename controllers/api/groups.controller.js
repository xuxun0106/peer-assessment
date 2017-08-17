var config = require('config.js');
var express = require('express');
var router = express.Router();
var groupService = require('services/group.service');

router.get('/', getByUser);
router.get('/:assessment', getByAssessment);
router.post('/', createGroup);
router.put('/:_id', update);
router.delete('/:_id', deleteGroup);

module.exports = router;

function getByUser(req, res) {
  groupService.getByUser(req.query)
    .then(function(data) {
      res.send(data);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}

function createGroup(req, res) {
  groupService.create(req.body)
    .then(function(data) {
      res.status(201).send(data);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}

function getByAssessment(req, res) {
  groupService.getByAssessment(req.params.assessment)
    .then(function(data) {
      res.send(data);
    })
    .catch(function(err) {
      res.status(400).send(err);
    })
}

function update(req, res) {
  groupService.update(req.params._id, req.body)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}

function deleteGroup(req, res) {
  groupService.delete(req.params._id)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
}
