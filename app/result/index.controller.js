(function() {
  'use strict';

  angular
    .module('app')
    .controller('Result.IndexController', ['UserService', 'AssessmentService', '$scope', '$state',
      function(UserService, AssessmentService, $scope, $state) {
        $scope.assessments = [];

        UserService.GetCurrent()
          .then(function(user) {
            AssessmentService.GetByAuthor(user.username)
              .then(function(a) {
                var now = moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ');
                for (var i = 0; i < a.length; i++) {
                  if (moment(a[i].endDate).isSameOrBefore(now)) {
                    $scope.assessments.push(a[i]);
                  }
                }
              })
              .catch(function(err) {
                console.log(err);
              });
          })
          .catch(function(err) {
            console.log(err);
          });

        $scope.resultByAssessment = function(id) {
          $state.go('resultByAssessment', {
            assessmentId: id
          });
        };
      }
    ])
    .controller('ResultByAssessmentController', ['$scope', '$stateParams',
      'GroupService', 'AssessmentService', 'ModalService',
      function($scope, $stateParams, GroupService, AssessmentService, ModalService) {

        $scope.assessment = null;
        $scope.groups = [];
        $scope.groupMembers = [];
        $scope.weightings = [];
        var spa = {};
        var sapa = {};
        var scoreQuestions = [];
        var assessmentId = $stateParams.assessmentId;

        AssessmentService.GetById(assessmentId)
          .then(function(a) {
            $scope.assessment = a;
            var count = 0;
            for (var n = 0, len = a.questions.length; n < len; n++) {
              if (a.questions[n].type === 'Single choice' || a.questions[n].type === 'Slider') {
                count++;
                scoreQuestions.push(a.questions[n].text);
              }
            }
            $scope.weightings = Array.apply(null, Array(count)).map(function(item, i) {
              return Number((100 / count).toFixed(2));
            });
          })

        GroupService.GetByAssessment(assessmentId)
          .then(function(g) {
            $scope.groups = g;
            for (var i = 0; i < g.length; i++) {
              var member = g[i].member;
              $scope.groupMembers[i] = renderMember(member);
            }
          })
          .catch(function(err) {
            console.log(err);
          })

        $scope.show = function(groupId) {
          ModalService.showModal({
            templateUrl: "result/feedback.html",
            controller: "FeedbackController",
            preClose: (modal) => {
              modal.element.modal('hide');
            },
            inputs: {
              group: groupId,
              assessment: $scope.assessment,
              weightings: $scope.weightings
            }
          }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
              if (result) {
                spa[result.group] = result.spa;
                sapa[result.group] = result.sapa;
              }
            });
          });
        };

        $scope.setWeightings = function() {
          ModalService.showModal({
            templateUrl: "result/setWeightings.html",
            controller: "WeightingController",
            preClose: (modal) => {
              modal.element.modal('hide');
            },
            inputs: {
              weightings: $scope.weightings,
              questions: scoreQuestions
            }
          }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
              if (result) {
                $scope.weightings = result.weightings;
              }
            });
          });
        };
      }
    ])
    .controller('FeedbackController', [
      '$scope', '$element', 'group', 'close', 'assessment', 'ResultService', 'weightings',
      function($scope, $element, group, close, assessment, ResultService, weightings) {

        $scope.groupMembers = [];
        $scope.noComplete = "None";
        $scope.assessment = assessment;
        $scope.comments = [];
        $scope.results = [];
        $scope.rawResults = [];
        $scope.overallSPA = {};
        $scope.overallSAPA = {};
        var w = weightings.slice();

        ResultService.GetByGroup(group)
          .then(function(data) {
            $scope.groupMembers = data.groupMember;
            $scope.noComplete = renderMember(data.noComplete);
            $scope.comments = data.comments;
            $scope.results = data.results;
            $scope.rawResults = data.rawResultForIndividual;
            for (var i = 0, len2 = $scope.groupMembers.length; i < len2; i++) {
              var member = $scope.groupMembers[i];
              $scope.overallSPA[member] = 0;
              $scope.overallSAPA[member] = 0;
            }
            for (var n = 0, len = assessment.questions.length; n < len; n++) {
              var type = assessment.questions[n].type;
              if (type === 'Single choice' || type === 'Slider') {
                var weighting = w.shift();
                for (var i = 0, len2 = $scope.groupMembers.length; i < len2; i++) {
                  var member = $scope.groupMembers[i]
                  $scope.overallSPA[member] += $scope.results[n].spa[member] * weighting / 100;
                  $scope.overallSAPA[member] += $scope.results[n].sapa[member] * weighting / 100;
                }
              }
            }
            for (var i = 0, len2 = $scope.groupMembers.length; i < len2; i++) {
              var member = $scope.groupMembers[i];
              $scope.overallSPA[member] = Number($scope.overallSPA[member].toFixed(2));
              $scope.overallSAPA[member] = Number($scope.overallSAPA[member].toFixed(2));
            }
          })
          .catch(function(err) {
            console.log(err);
          })

        $scope.flag = function(sapa) {
          if (sapa >= 0.90 && sapa <= 1.10)
            return false;
          return true;
        };

        $scope.close = function() {
          close({
            spa: $scope.overallSPA,
            sapa: $scope.overallSAPA,
            group: group
          }, 500);
        };

        $scope.cancel = function() {

          $element.modal('hide');

          close({
            spa: $scope.overallSPA,
            sapa: $scope.overallSAPA,
            group: group
          }, 500);
        };

      }
    ]).controller('WeightingController', [
      '$scope', '$element', 'weightings', 'close', 'questions',
      function($scope, $element, weightings, close, questions) {

        $scope.weightings = weightings;
        $scope.questions = questions;

        $scope.close = function() {
          var sum = 0;
          $scope.weightings.forEach(function(item) {
            item = item || 0;
            sum += item;
          });
          $scope.weightings = $scope.weightings.map(function(item, i) {
            return Number((item * 100 / sum).toFixed(2));
          });
          close({
            weightings: $scope.weightings
          }, 500);
        };

        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

      }
    ]);

  function renderMember(member) {
    if (member.length < 1) {
      return "None";
    }
    var groupMembers = member[0];
    for (var j = 1; j < member.length; j++) {
      groupMembers += ", ";
      groupMembers += member[j];
    }
    return groupMembers;
  }
})();
