
(function() {
  'use strict';

  angular
    .module('app')
    .controller('Assessment.IndexController', ['AssessmentService', 'FlashService', 'UserService', 'ModalService', '$scope',
      function(AssessmentService, FlashService, UserService, ModalService, $scope) {
        var vm = this;

        vm.user = null;
        vm.usertype = null;

        initController();

        function initController() {
          UserService.GetCurrent().then(function(user) {
            vm.user = user.username;
            vm.usertype = user.type;
            if (vm.usertype === 'instructor') {
              instructorGet();
            }
            if (vm.usertype === 'student') {
              //UserService.GetCourses().then(function(data) {
              var data = user.course;
              vm.studentOngoing = [];
              vm.studentPast = [];
              for (var n = 0; n < data.length; n++) {
                AssessmentService.GetByCourse(data[n].code).then(function(a) {
                  var now = moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ');
                  for (var i = 0; i < a.length; i++) {
                    if (moment(a[i].startDate).isSameOrBefore(now) && moment(a[i].endDate).isAfter(now)) {
                      vm.studentOngoing.push(a[i]);
                    } else if (moment(a[i].endDate).isSameOrBefore(now)) {
                      vm.studentPast.push(a[i]);
                    }
                  }
                });
              }
              //})
              // .catch(function(err) {
              //   console.log(err);
              // });
            }
          });
        }

        vm.formGroup = function(a) {
          ModalService.showModal({
            templateUrl: "assessment/formGroup.html",
            controller: "GroupController",
            preClose: (modal) => {
              modal.element.modal('hide');
            },
            inputs: {
              user: vm.user,
              assessment: a._id
            }
          }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {});
          });
        };

        vm.doAssessment = function(a) {
          ModalService.showModal({
            templateUrl: "assessment/doAssessment.html",
            controller: "AssessmentController",
            preClose: (modal) => {
              modal.element.modal('hide');
            },
            inputs: {
              user: vm.user,
              assessment: a
            }
          }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
              console.log(result);
              //result, author, group
            });
          });
        };

        vm.show = function() {
          ModalService.showModal({
            templateUrl: "assessment/newAssessment.html",
            controller: "NewController",
            preClose: (modal) => {
              modal.element.modal('hide');
            },
            inputs: {
              title: "Create a new assessment",
              author: vm.user
            }
          }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
              if (result) {
                AssessmentService.Create(result).then(function() {
                    FlashService.Success('Assessment saved!');
                    instructorGet();
                  })
                  .catch(function(error) {
                    FlashService.Error(error);
                  });
              }
            });
          });
        };

        function instructorGet() {
          AssessmentService.GetByAuthor(vm.user).then(function(a) {
            vm.instructorUpcoming = [];
            vm.instructorOngoing = [];
            vm.instructorPast = [];
            var now = moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ');
            for (var i = 0; i < a.length; i++) {
              if (moment(a[i].startDate).isSameOrBefore(now) && moment(a[i].endDate).isAfter(now)) {
                vm.instructorOngoing.push(a[i]);
              } else if (moment(a[i].endDate).isSameOrBefore(now)) {
                vm.instructorPast.push(a[i]);
              } else {
                vm.instructorUpcoming.push(a[i]);
              }
            }
          });
        }
      }
    ])
    .controller('NewController', [
      '$scope', '$element', 'title', 'close', 'author', 'ModalService', 'UserService',
      function($scope, $element, title, close, author, ModalService, UserService) {

        $scope.courses = null;
        $scope.courseCode = null;
        $scope.courseName = null;
        $scope.name = null;
        $scope.dateRangeStart = null;
        $scope.dateRangeEnd = null;
        $scope.questions = [];
        $scope.author = author;
        $scope.title = title;

        UserService.GetAllCourses().then(function(data) {
            $scope.courses = data;
          })
          .catch(function(err) {
            console.log(err);
          });

        $scope.setCourse = function(c) {
          $scope.courseCode = c.code;
          $scope.courseName = c.title;
        }

        $scope.close = function() {
          close({
            courseCode: $scope.courseCode,
            courseName: $scope.courseName,
            name: $scope.name,
            startDate: moment($scope.dateRangeStart).format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
            endDate: moment($scope.dateRangeEnd).format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
            questions: $scope.questions,
            author: $scope.author
          }, 500);
        };


        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

        $scope.check = function() {
          return $scope.courseCode && $scope.name && $scope.dateRangeStart && $scope.dateRangeEnd && $scope.questions.length > 0;
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
    ])
    .controller('GroupController', [
      '$scope', '$element', 'close', 'GroupService', 'user', 'assessment',
      function($scope, $element, close, GroupService, user, assessment) {

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
                console.log(err);
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
              console.log(error);
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
                console.log(error);
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
                    console.log(error);
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
                    console.log(err);
                  });
              }
            })
            .catch(function(err) {
              console.log(err);
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
    ])
    .controller('AssessmentController', [
      '$scope', '$element', 'close', 'user', 'assessment', 'GroupService',
      function($scope, $element, close, user, assessment, GroupService) {
        $scope.title = assessment.courseName + " " + assessment.name;
        $scope.status = "";
        $scope.locked = false;
        $scope.questions = [];
        $scope.members = [];
        $scope.results = [];
        $scope.result = {};
        $scope.slider_toggle = {
          options: {
            floor: 0,
            ceil: 100
          }
        };

        GroupService.GetByUser(user, assessment._id)
          .then(function(g) {
            if (g) {
              if (g.locked) {
                $scope.locked = true;
                $scope.questions = assessment.questions;
                $scope.members = g.member;
                for (var i = 0, len = $scope.members.length; i < len; i++) {
                  $scope.results[i] = new Array($scope.questions.length);
                  for (var j = 0, len2 = $scope.questions.length; j < len2; j++) {
                    if ($scope.questions[j].type === 'Multiple choice') {
                      $scope.results[i][j] = [];
                    }
                  }
                }
              } else {
                $scope.status = "Please lock your group!";
              }
            } else {
              $scope.status = "Please join a group first!";
            }
          })
          .catch(function(err) {
            console.log(err);
          });

        $scope.toggle = function(item, list) {
          console.log(list);
          var index = -1;
          for (var i = 0, len = list.length; i < len; i++) {
            if (list[i].text === item) {
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


        $scope.canSubmit = function() {
          return $scope.locked && finished();
        };

        function finished() {
          for (var i = 0, len = $scope.results.length; i < len; i++) {
            for (var j = 0, len2 = $scope.results[i].length; j < len2; j++) {
              if ($scope.results[i][j] === undefined || $scope.results[i][j] === null) {
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
            result: $scope.result
          }, 500);
        };

        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

      }
    ]);

})();
