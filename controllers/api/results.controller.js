var config = require('config.json');
var express = require('express');
var router = express.Router();
var resultService = require('services/result.service');

router.get('/', getByUser);
router.post('/', createResult);
router.put('/:_id', update);
router.delete('/:_id', deleteResult);

module.exports = router;

function getByUser(req, res) {
  resultService.getByUser(req.query)
    .then(function(data) {
      res.send(data);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
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
