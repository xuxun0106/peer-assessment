
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

              if (data) {
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
              }

              // })
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
