
(function() {
  'use strict';

  angular
    .module('app')
    .controller('Assessment.IndexController', ['UserService', 'ModalService', '$scope', Controller])
    //TODO
    .controller('NewController', [
      '$scope', '$element', '$http', 'title', 'close', 'ModalService',
      function($scope, $element, $http, title, close, ModalService) {
        var url = "https://dbc.doc.ic.ac.uk/api/teachdbs/views/curr/courses";

        

        $scope.course = null;
        $scope.name = null;
        $scope.dateRangeStart = null;
        $scope.dateRangeEnd = null;
        $scope.questions = [];
        $scope.title = title;


        $scope.close = function() {
          close({
            course: $scope.course,
            name: $scope.name,
            startDate: $scope.dateRangeStart,
            endDate: $scope.dateRangeEnd,
            questions: $scope.questions
          }, 500);
        };


        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

        $scope.check = function() {
          return $scope.course && $scope.name && $scope.dateRangeStart && $scope.dateRangeEnd && $scope.questions.length > 0;
        }

        $scope.show = function() {

          ModalService.showModal({
            templateUrl: "assessment/questionSuite.html",
            controller: "SelectController",
            preClose: (modal) => {
              modal.element.modal('hide');
            },
            inputs: {
              title: "Select questions",
              selected: $scope.questions
            }
          }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
              if (result) {
                $scope.questions = result.questions;
              }
            });
          });
        };


        //datetimepicker
        $scope.endDateBeforeRender = endDateBeforeRender
        $scope.endDateOnSetTime = endDateOnSetTime
        $scope.startDateBeforeRender = startDateBeforeRender
        $scope.startDateOnSetTime = startDateOnSetTime

        function startDateOnSetTime() {
          $scope.$broadcast('start-date-changed');
        }

        function endDateOnSetTime() {
          $scope.$broadcast('end-date-changed');
        }

        function startDateBeforeRender($dates) {
          if ($scope.dateRangeEnd) {
            var activeDate = moment($scope.dateRangeEnd);

            $dates.filter(function(date) {
              return date.localDateValue() >= activeDate.valueOf()
            }).forEach(function(date) {
              date.selectable = false;
            })
          }
        }

        function endDateBeforeRender($view, $dates) {
          if ($scope.dateRangeStart) {
            var activeDate = moment($scope.dateRangeStart).subtract(1, $view).add(1, 'minute');

            $dates.filter(function(date) {
              return date.localDateValue() <= activeDate.valueOf()
            }).forEach(function(date) {
              date.selectable = false;
            })
          }
        }

      }
    ])
    .controller('SelectController', [
      '$scope', '$element', 'title', 'close', 'selected', 'UserService', 'QuestionService',
      function($scope, $element, title, close, selected, UserService, QuestionService) {

        $scope.title = title;
        $scope.selected = selected;
        $scope.questions = [];

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

        $scope.toggle = function(item, list) {
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

        $scope.exists = function(item, list) {
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
          UserService.GetCurrent().then(function(user) {
            QuestionService.GetByAuthor(user.username).then(function(q) {
              $scope.questions = q;
            })
          });
        }

      }
    ]);

  function Controller(UserService, ModalService, $scope) {
    var vm = this;

    vm.user = null;

    initController();

    function initController() {
      UserService.GetCurrent().then(function(user) {
        vm.user = user;
      });
    }

    vm.show = function() {

      ModalService.showModal({
        templateUrl: "assessment/newAssessment.html",
        controller: "NewController",
        preClose: (modal) => {
          modal.element.modal('hide');
        },
        inputs: {
          title: "Create a new assessment"
        }
      }).then(function(modal) {
        modal.element.modal();
        modal.close.then(function(result) {
          if (result) {

          }
        });
      });
    };





  }

})();
