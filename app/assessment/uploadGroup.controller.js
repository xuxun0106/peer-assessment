(function() {
  'use strict';

  angular
    .module('app')
    .controller('UploadGroupController', [
      '$scope', '$element', 'title', 'close', 'groups',
      function($scope, $element, title, close, groups) {
        $scope.title = title;
        $scope.text = "";
        $scope.prettyGroups = [];
        $scope.groups = groups;

        for (var n = 0, len = groups.length; n < len; n++) {
          $scope.prettyGroups[n] = renderMember($scope.groups[n]);
        }

        $scope.deleteGroup = function(index) {
          $scope.prettyGroups.splice(index, 1);
          $scope.groups.splice(index, 1);
        };

        $scope.deleteAll = function() {
          $scope.prettyGroups = [];
          $scope.groups = [];
        };

        $scope.parseText = function() {
          var groups = $scope.text.split("\n");
          for (var n = 0, len = groups.length; n < len; n++) {
            if (groups[n][0] === "#") {
              continue;
            }
            var group = groups[n].split(":");
            group.splice(0, 2);
            group.splice(-1, 1);
            $scope.groups.push(group);
            $scope.prettyGroups.push(renderMember(group))
          }
          $scope.text = "";
        }

        $scope.close = function() {
          close({
            groups: $scope.groups
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
