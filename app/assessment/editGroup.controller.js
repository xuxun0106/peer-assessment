(function() {
  'use strict';

  angular
    .module('app')
    .controller('EditGroupController', [
      '$scope', '$element', 'title', 'close', 'assessment', 'GroupService', 'FlashService', 'ModalService',
      function($scope, $element, title, close, assessment, GroupService, FlashService, ModalService) {

        $scope.title = title;
        $scope.prettyGroups = [];
        $scope.searchText = "";
        $scope.editing = [];
        $scope.editingGroup = [];
        var groups = [];
        var editingIndex = null;
        var creating = false;

        GroupService.GetByAssessment(assessment._id).then(function(gs) {
            groups = gs;
            for (var n = 0, len = gs.length; n < len; n++) {
              $scope.prettyGroups.push(renderMember(gs[n].member));
              $scope.editing.push(false);
            }
          })
          .catch(function(err) {
            FlashService.Error(err);
          });

        $scope.editGroup = function(index) {
          $scope.editing[index] = true;
          $scope.editingGroup = groups[index].member;
          editingIndex = index;
        };

        $scope.addBox = function() {
          $scope.editingGroup.push("");
        };

        $scope.deleteGroup = function(index) {
          deleteGrp(index);
        };

        $scope.addGroup = function() {
          editingIndex = groups.length;
          $scope.prettyGroups.push("");
          $scope.editing.push(true);
          creating = true;
        };

        $scope.confirmGroup = function() {
          for (var n = 0, len = $scope.editingGroup.length; n < len; n++) {
            if ($scope.editingGroup[n] === "") {
              $scope.editingGroup.splice(n, 1);
              n--;
            }
          }

          if (creating) {
            if ($scope.editingGroup.length === 0) {
              $scope.cancelEdit();
            } else {
              var newGroup = {
                assessment: assessment._id,
                member: $scope.editingGroup,
                locked: true
              }
              GroupService.Create(newGroup).then(function(group) {
                  groups.push(group);
                  $scope.prettyGroups[editingIndex] = renderMember(group.member);
                  creating = false;
                  $scope.cancelEdit();
                })
                .catch(function(err) {
                  alert(err);
                });
            }
          } else {
            if ($scope.editingGroup.length === 0) {
              deleteGrp(editingIndex);
            } else {
              groups[editingIndex].member = $scope.editingGroup;
              GroupService.Update(groups[editingIndex])
                .then(function() {
                  $scope.prettyGroups[editingIndex] = renderMember($scope.editingGroup);
                  $scope.cancelEdit();
                })
                .catch(function(error) {
                  FlashService.Error(error);
                });
            }
          }
        };

        $scope.cancelEdit = function() {
          if (creating) {
            $scope.editing.splice(editingIndex, 1);
            $scope.prettyGroups.splice(editingIndex, 1);
            creating = false;
          } else {
            $scope.editing[editingIndex] = false;
          }
          $scope.editingGroup = [];
          editingIndex = null;
        };

        $scope.upload = function() {
          openModal(ModalService, "assessment/addGroup.html", "UploadGroupsController", {
            title: "Paste the group infomation from CATe"
          }, function(result) {
            document.body.className += ' modal-open';
            if (result) {
              var gs = result.groups;
              for (var n = 0, len = gs.length; n < len; n++) {
                if (gs[n][0] === "#") {
                  continue;
                }
                var group = gs[n].split(":");
                group.splice(0, 2);
                group.splice(-1, 1);

                var newGroup = {
                  assessment: assessment._id,
                  member: group,
                  locked: true
                }
                GroupService.Create(newGroup).then(function(g) {
                  groups.push(g);
                  $scope.prettyGroups.push(renderMember(g.member));
                  $scope.editing.push(false);
                });
              }
            }
          });
        };

        $scope.close = function() {
          close(null, 500);
        };

        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

        function deleteGrp(index) {
          GroupService.Delete(groups[index]._id).then(function() {
              groups.splice(index, 1);
              $scope.prettyGroups.splice(index, 1);
              $scope.editing.splice(index, 1);
              $scope.editingGroup = [];
              editingIndex = null;
            })
            .catch(function(err) {
              FlashService.Error(err);
            });
        }
      }
    ]);

    function openModal(ModalService, url, controller, option, callback = function(result) {}) {
      ModalService.showModal({
        templateUrl: url,
        controller: controller,
        preClose: (modal) => {
          modal.element.modal('hide');
        },
        inputs: option
      }).then(function(modal) {
        modal.element.modal();
        modal.close.then(function(result) {
          callback(result);
        });
      });
    }

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
