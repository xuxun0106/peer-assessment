(function() {
  'use strict';

  angular
    .module('app')
    .controller('AssessmentController', [
      '$scope', '$element', 'close', 'user', 'assessment', 'GroupService', 'ResultService', '$timeout', 'FlashService',
      function($scope, $element, close, user, assessment, GroupService, ResultService, $timeout, FlashService) {
        $scope.title = assessment.courseName + " " + assessment.name;
        $scope.status = "";
        $scope.locked = false;
        $scope.questions = [];
        $scope.groupId = null;
        $scope.members = [];
        $scope.results = [];
        $scope.result = {};
        $scope.first = true;
        $scope.id = null;
        $scope.comments = [];

        GroupService.GetByUser(user, assessment._id)
          .then(function(g) {
            if (g) {
              if (g.locked) {
                ResultService.GetByUser(user, g._id)
                  .then(function(r) {
                    if (r) {
                      $scope.first = false;
                      $scope.id = r._id;
                      $scope.comments = r.comments;
                      for (var i = 0, len = $scope.members.length; i < len; i++) {
                        $scope.results[i] = r.result[$scope.members[i]];
                      }
                    } else {
                      $scope.comments = new Array($scope.questions.length);
                      for (var i = 0, len = $scope.members.length; i < len; i++) {
                        $scope.results[i] = new Array($scope.questions.length);
                        for (var j = 0, len2 = $scope.questions.length; j < len2; j++) {
                          if ($scope.questions[j].type === 'Multiple choice') {
                            $scope.results[i][j] = [];
                          }
                        }
                      }
                    }
                  })
                  .catch(function(err) {
                    FlashService.Error(err);
                  });
                $scope.groupId = g._id;
                $scope.locked = true;
                $scope.questions = assessment.questions;
                $scope.members = g.member;
                setTimeout(function() {
                  $scope.$broadcast('reCalcViewDimensions');
                }, 500);
              } else {
                $scope.status = "Please lock your group!";
              }
            } else {
              $scope.status = "Please join a group first!";
            }
          })
          .catch(function(err) {
            FlashService.Error(err);
          });

        $scope.toggle = function(item, list) {
          var index = -1;
          for (var i = 0, len = list.length; i < len; i++) {
            if (list[i] === item) {
              index = i;
              break;
            }
          }
          if (index > -1) {
            list.splice(index, 1);
          } else {
            list.push(item);
          }
        };

        $scope.exists = function(item, list) {
          if (!list) return false;
          var index = -1;
          for (var i = 0, len = list.length; i < len; i++) {
            if (list[i] === item) {
              index = i;
              break;
            }
          }

          return index > -1;
        };

        $scope.canSubmit = function() {
          return $scope.locked && finished();
        };

        function finished() {
          for (var i = 0, len = $scope.results.length; i < len; i++) {
            for (var j = 0, len2 = $scope.results[i].length; j < len2; j++) {
              // if ($scope.results[i][j] === undefined || $scope.results[i][j] === null) {
              //   return false;
              // }
              if (!$scope.results[i][j]) {
                return false;
              }
            }
          }
          return true;
        }

        $scope.close = function() {
          for (var i = 0, len = $scope.members.length; i < len; i++) {
            $scope.result[$scope.members[i]] = $scope.results[i];
          }
          close({
            _id: $scope.id,
            first: $scope.first,
            author: user,
            group: $scope.groupId,
            result: $scope.result,
            comments: $scope.comments
          }, 500);
        };

        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

        function refreshSlider() {
          $timeout(function() {
            $scope.$broadcast('rzSliderForceRender');
          });
        };

      }
    ]);
})();
