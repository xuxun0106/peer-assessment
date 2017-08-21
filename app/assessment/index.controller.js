
(function() {
  'use strict';

  angular
    .module('app')
    .controller('Assessment.IndexController', ['AssessmentService', 'FlashService',
      'UserService', 'ModalService', '$scope', 'ResultService', 'GroupService',
      function(AssessmentService, FlashService, UserService, ModalService, $scope, ResultService, GroupService) {
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
                  for (var i = 0; i < a.length; i++) {
                    if (ongoing(a[i])) {
                      vm.studentOngoing.push(a[i]);
                    } else if (past(a[i])) {
                      vm.studentPast.push(a[i]);
                    }
                  }
                });
              }
              //})
              // .catch(function(err) {
              //   FlashService.Error(err);
              // });
            }
          });
        }

        vm.formGroup = function(a) {
          openModal(ModalService, "assessment/formGroup.html", "GroupController", {
            user: vm.user,
            assessment: a._id
          });
        };

        vm.editGroup = function(a) {
          openModal(ModalService, "assessment/editGroup.html", "EditGroupController", {
            title: "You can view and edit groups here",
            assessment: a
          });
        };

        vm.doAssessment = function(a) {
          openModal(ModalService, "assessment/doAssessment.html", "AssessmentController", {
            user: vm.user,
            assessment: a
          }, function(result) {
            if (result) {
              if (result.first === true) {
                ResultService.Create({
                    author: result.author,
                    group: result.group,
                    result: result.result,
                    comments: result.comments
                  })
                  .then(function() {
                    FlashService.Success('Assessment completed!');
                  })
                  .catch(function(err) {
                    FlashService.Error(err);
                  });
              } else {
                ResultService.Update(result)
                  .then(function() {
                    FlashService.Success('Assessment saved!');
                  })
                  .catch(function(err) {
                    FlashService.Error(err);
                  });
              }
            }
          });
        };

        vm.createAssessment = function() {
          openModal(ModalService, "assessment/newAssessment.html", "NewController", {
            title: "Create a new assessment",
            author: vm.user,
            courseCode: null,
            courseName: null,
            questions: [],
            name: null,
            startDate: null,
            endDate: null,
            id: null,
            groups: null
          }, function(result) {
            if (result) {
              var groups = result.groups;
              delete result.groups;
              AssessmentService.Create(result).then(function(assessmentId) {
                  FlashService.Success('Assessment saved!');
                  instructorGet();
                  if (groups !== []) {
                    for (var n = 0, len = groups.length; n < len; n++) {
                      GroupService.Create({
                          assessment: assessmentId,
                          member: groups[n],
                          locked: true
                        })
                        .catch(function(error) {
                          FlashService.Error(error);
                        });
                    }
                  }
                })
                .catch(function(error) {
                  FlashService.Error(error);
                });
            }
          });

        };

        vm.viewAssessment = function(a) {
          openModal(ModalService, "assessment/viewAssessment.html", "ViewController", {
            assessment: a
          });
        };

        vm.copyAssessment = function(a) {
          GroupService.GetByAssessment(a._id).then(function(groups) {
              if (groups) {
                for (var n = 0, len = groups.length; n < len; n++) {
                  groups[n] = groups[n].member;
                }
                openModal(ModalService, "assessment/newAssessment.html", "NewController", {
                  title: "Create a new assessment",
                  author: vm.user,
                  courseCode: a.courseCode,
                  courseName: a.courseName,
                  questions: a.questions,
                  name: null,
                  startDate: null,
                  endDate: null,
                  id: null,
                  groups: groups
                }, function(result) {
                  if (result) {
                    var groups = result.groups;
                    delete result.groups;
                    AssessmentService.Create(result).then(function(assessmentId) {
                        FlashService.Success('Assessment saved!');
                        instructorGet();
                        if (groups !== []) {
                          for (var n = 0, len = groups.length; n < len; n++) {
                            GroupService.Create({
                                assessment: assessmentId,
                                member: groups[n],
                                locked: true
                              })
                              .catch(function(error) {
                                FlashService.Error(error);
                              });
                          }
                        }
                      })
                      .catch(function(error) {
                        FlashService.Error(error);
                      });
                  }
                });
              }
            })
            .catch(function(err) {
              FlashService.Error(err);
            });
        };

        vm.editAssessment = function(a) {
          openModal(ModalService, "assessment/newAssessment.html", "NewController", {
            title: "Edit this assessment",
            author: vm.user,
            courseCode: a.courseCode,
            courseName: a.courseName,
            questions: a.questions,
            name: a.name,
            startDate: a.startDate,
            endDate: a.endDate,
            id: a._id,
            groups: null
          }, function(result) {
            if (result) {
              AssessmentService.Update(result).then(function() {
                  FlashService.Success('Assessment updated!');
                  instructorGet();
                })
                .catch(function(error) {
                  FlashService.Error(error);
                });
            }
          });
        }

        vm.deleteAssessment = function(a) {
          if (confirm("Are you sure?")) {
            AssessmentService.Delete(a._id)
              .then(function() {
                FlashService.Success('Assessment deleted!');
                instructorGet();
              })
              .catch(function(error) {
                FlashService.Error(error);
              });
          }
        };

        function instructorGet() {
          AssessmentService.GetByAuthor(vm.user).then(function(a) {
            vm.instructorUpcoming = [];
            vm.instructorOngoing = [];
            vm.instructorPast = [];
            for (var i = 0; i < a.length; i++) {
              if (ongoing(a[i])) {
                vm.instructorOngoing.push(a[i]);
              } else if (past(a[i])) {
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
    ])
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
    ])
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
    ])
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
    ])
    .controller('ViewController', [
      '$scope', '$element', 'assessment', 'close', 'FlashService',
      function($scope, $element, assessment, close, FlashService) {

        $scope.title = assessment.courseCode + " " + assessment.courseName + " " + assessment.name;
        $scope.questions = assessment.questions;


        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

      }
    ])
    .controller('OrderController', [
      '$scope', '$element', 'title', 'close', 'selected',
      function($scope, $element, title, close, selected) {

        $scope.title = title;
        $scope.selected = selected;
        var init = null;

        $scope.close = function() {
          close({
            selected: $scope.selected
          }, 500);
        };

        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

        $scope.moved = function(index, q) {
          if ($scope.selected[index].text === init) {
            $scope.selected.splice(index, 1);
          } else {
            $scope.selected.splice(index + 1, 1);
          }
          init = null;
        };

        $scope.start = function(q) {
          init = q;
        };

      }
    ])
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
    ])
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
          openModal(ModalService, "assessment/addGroup.html", "UploadController", {
            title: "Paste the group infomation from CATe"
          }, function(result) {
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
    ])
    .controller('UploadController', [
      '$scope', '$element', 'title', 'close',
      function($scope, $element, title, close) {

        $scope.title = title;
        $scope.text = "";

        $scope.close = function() {
          if ($scope.text === "") {
            close(null, 500);
          } else {
            var groups = $scope.text.split("\n");
            close({
              groups
            }, 500);
          }
        };

        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

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
