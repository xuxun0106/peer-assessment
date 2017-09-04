(function() {
  'use strict';

  angular
    .module('app')
    .controller('GroupController', [
      '$scope', '$element', 'close', 'GroupService', 'user', 'assessment', 'FlashService',
      function($scope, $element, close, GroupService, user, assessment, FlashService) {

        var currentGroup = null,
          allGroups = [],
          index = null;
        init()

        getGroup();

        $scope.canLeave = function() {
          return $scope.inGroup && !$scope.locked;
        }

        $scope.lock = function() {
          if (confirm("The group cannot be changed once locked. Are you sure to lock it?")) {
            currentGroup.locked = true;
            GroupService.Update(currentGroup)
              .then(function() {
                $scope.locked = true;
              })
              .catch(function(err) {
                FlashService.Error(err);
              })
          }
        }

        $scope.createGroup = function() {
          GroupService.Create({
              assessment: assessment,
              member: [user],
              locked: false
            }).then(function() {
              $scope.inGroup = true;
              $scope.status = "Success! Now ask your group members to join!"
              getGroup();
            })
            .catch(function(error) {
              $scope.status = "Sorry, you are already in a group!"
            });
        };

        $scope.select = function(g, i) {
          $scope.group = g;
          index = i;
        }

        $scope.join = function() {
          if ($scope.group === "Group") {
            return;
          }

          var oldGroup = allGroups[index];
          oldGroup.member.push(user);
          GroupService.Update(oldGroup)
            .then(function() {
              $scope.inGroup = true;
              getGroup();
            })
            .catch(function(error) {
              FlashService.Error(error);
            });
        }

        $scope.leave = function() {
          var oldGroup = currentGroup.member;
          if (oldGroup.length === 1 && oldGroup[0] === user) {
            GroupService.Delete(currentGroup._id)
              .then(function() {
                init();
                getGroup();
              })
              .catch(function(error) {
                FlashService.Error(error);
              });
          } else {
            for (var i = 0; i < oldGroup.length; i++) {
              if (user === oldGroup[i]) {
                oldGroup.splice(i, 1);
                currentGroup.member = oldGroup;
                GroupService.Update(currentGroup)
                  .then(function() {
                    init();
                    getGroup();
                  })
                  .catch(function(error) {
                    FlashService.Error(error);
                  });
              }
            }
          }
        }

        function getGroup() {
          GroupService.GetByUser(user, assessment)
            .then(function(g) {
              if (g) {
                currentGroup = g;
                $scope.inGroup = true;
                var member = g.member;
                $scope.group = member[0];
                for (var n = 1; n < member.length; n++) {
                  $scope.group += ", ";
                  $scope.group += member[n];
                }
                $scope.locked = g.locked;
              } else {
                GroupService.GetByAssessment(assessment)
                  .then(function(gs) {
                    allGroups = gs;
                    $scope.groups = [];
                    for (var i = 0; i < gs.length; i++) {
                      var member = gs[i].member;
                      $scope.groups[i] = member[0];
                      for (var j = 1; j < member.length; j++) {
                        $scope.groups[i] += ", ";
                        $scope.groups[i] += member[j];
                      }
                    }
                  })
                  .catch(function(err) {
                    FlashService.Error(err);
                  });
              }
            })
            .catch(function(err) {
              FlashService.Error(err);
            });
        }

        function init() {
          $scope.status = "";
          $scope.group = "Group";
          $scope.groups = [];
          $scope.inGroup = false;
          $scope.locked = false;
          currentGroup = null;
          allGroups = [];
          index = null;
        }

        $scope.close = function() {
          close(null, 500);
        };

      }
    ]);
})();
