(function() {
  'use strict';

  angular
    .module('app')
    .controller('SelectController', [
      '$scope', '$element', 'title', 'close', 'selected', 'UserService', 'QuestionService', 'ModalService', 'FlashService',
      function($scope, $element, title, close, selected, UserService, QuestionService, ModalService, FlashService) {

        $scope.title = title;
        $scope.selected = selected;
        $scope.questions = [];
        $scope.searchText = "";

        getAllQuestions();

        $scope.close = function() {
          close({
            questions: $scope.selected
          }, 500);
        };


        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

        $scope.order = function() {
          openModal(ModalService, "assessment/order.html", "OrderController", {
            title: "You can drag and drop the questions to change the order",
            selected: $scope.selected
          }, function(result) {
            document.body.className += ' modal-open';
            if (result) {
              $scope.selected = result.selected;
            }
          });
        };

        $scope.toggle = function(item, list, ind) {
          var searchTerm = item.text,
            index = -1;
          for (var i = 0, len = list.length; i < len; i++) {
            if (list[i].text === searchTerm) {
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

        $scope.exists = function(item, list, ind) {
          var searchTerm = item.text,
            index = -1;
          for (var i = 0, len = list.length; i < len; i++) {
            if (list[i].text === searchTerm) {
              index = i;
              break;
            }
          }
          return index > -1;
        };

        function getAllQuestions() {
          QuestionService.GetByAuthor("Example").then(function(q) {
            $scope.questions = q;
            UserService.GetCurrent().then(function(user) {
              QuestionService.GetByAuthor(user.username).then(function(q) {
                $scope.questions = $scope.questions.concat(q);
              });
            });
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
})();
