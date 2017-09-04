(function() {
  'use strict';

  angular
    .module('app')
    .controller('NewController', [
      '$scope', '$element', 'title', 'close', 'author', 'ModalService', 'UserService',
      'courseCode', 'courseName', 'questions', 'name', 'startDate', 'endDate', 'id', 'FlashService', 'groups',
      function($scope, $element, title, close, author, ModalService, UserService,
        courseCode, courseName, questions, name, startDate, endDate, id, FlashService, groups) {
        $scope.on = function() {
          if (startDate && endDate) {
            return ongoing({
              startDate,
              endDate
            }) || past({
              startDate,
              endDate
            });
          }
          return false;
        };

        if (startDate) {
          $scope.dateRangeStart = moment(startDate).subtract(moment(startDate).utcOffset() / 60, 'hours');
        } else {
          $scope.dateRangeStart = null;
        }

        if (endDate) {
          $scope.dateRangeEnd = moment(endDate).subtract(moment(endDate).utcOffset() / 60, 'hours');
        } else {
          $scope.dateRangeEnd = null;
        }

        $scope.courses = null;
        $scope.courseCode = courseCode;
        $scope.courseName = courseName;
        $scope.name = name;
        $scope.questions = questions;
        $scope.author = author;
        $scope.title = title;
        $scope.searchText = "";
        $scope.groups = groups || [];
        $scope.id = id;

        UserService.GetAllCourses().then(function(data) {
            $scope.courses = data;
          })
          .catch(function(err) {
            FlashService.Error(err);
          });

        $scope.setCourse = function(c) {
          $scope.courseCode = c.code;
          $scope.courseName = c.title;
        }

        $scope.close = function() {
          if (id) {
            close({
              courseCode: $scope.courseCode,
              courseName: $scope.courseName,
              name: $scope.name,
              startDate: moment($scope.dateRangeStart).format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
              endDate: moment($scope.dateRangeEnd).format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
              questions: $scope.questions,
              author: $scope.author,
              _id: id
            }, 500);
          } else {
            close({
              courseCode: $scope.courseCode,
              courseName: $scope.courseName,
              name: $scope.name,
              startDate: moment($scope.dateRangeStart).format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
              endDate: moment($scope.dateRangeEnd).format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
              questions: $scope.questions,
              author: $scope.author,
              groups: $scope.groups
            }, 500);
          }
        };


        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

        $scope.check = function() {
          return $scope.courseCode && $scope.name && $scope.dateRangeStart && $scope.dateRangeEnd && $scope.questions.length > 0;
        }

        $scope.show = function() {
          openModal(ModalService, "assessment/questionSuite.html", "SelectController", {
            title: "Select questions",
            selected: $scope.questions
          }, function(result) {
            document.body.className += ' modal-open';
            if (result) {
              $scope.questions = result.questions;
            }
          });
        };

        $scope.addGroups = function() {
          openModal(ModalService, "assessment/addGroups.html", "UploadGroupController", {
            title: "Paste the group infomation from CATe",
            groups: $scope.groups
          }, function(result) {
            document.body.className += ' modal-open';
            if (result) {
              $scope.groups = result.groups;
            }
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
    ]);

  function ongoing(time) {
    var now = moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ');
    if (moment(time.startDate).isSameOrBefore(now) && moment(time.endDate).isAfter(now)) {
      return true;
    } else {
      return false;
    }
  }

  function past(time) {
    var now = moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ');
    if (moment(time.endDate).isSameOrBefore(now)) {
      return true;
    } else {
      return false;
    }
  }

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
