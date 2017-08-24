(function() {
  'use strict';

  angular
    .module('app')
    .controller('Result.IndexController', ['UserService', 'AssessmentService',
      '$scope', '$state', 'FlashService', 'GroupService', 'ModalService',
      function(UserService, AssessmentService, $scope, $state, FlashService, GroupService, ModalService) {
        $scope.assessments = [];
        $scope.groups = [];
        $scope.user = {};

        UserService.GetCurrent()
          .then(function(user) {
            $scope.user = user;
            if (user.type === 'instructor') {
              AssessmentService.GetByAuthor(user.username)
                .then(function(a) {
                  var now = moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ');
                  for (var i = 0; i < a.length; i++) {
                    if (moment(a[i].endDate).isSameOrBefore(now)) {
                      $scope.assessments.push(a[i]);
                    }
                  }
                })
                .catch(function(err) {
                  FlashService.Error(err);
                });
            } else {
              //UserService.GetCourses().then(function(course) {
              var course = user.course;
              for (var n = 0; n < course.length; n++) {
                AssessmentService.GetByCourse(course[n].code).then(function(assessments) {
                  for (var i = 0; i < assessments.length; i++) {
                    var assessment = assessments[i];
                    if (assessment.publish) {
                      publish(user.username, assessment);
                    }
                  }
                });
              }
              //})
              // .catch(function(err) {
              //   FlashService.Error(err);
              // });
            }
          })
          .catch(function(err) {
            FlashService.Error(err);
          });

        $scope.show = function(index) {
          openModal(ModalService, "result/feedback.html", "FeedbackController", {
            group: $scope.groups[index]._id,
            assessment: $scope.assessments[index],
            weightings: null,
            user: $scope.user,
            numSummertive: null
          });
        };

        $scope.resultByAssessment = function(id) {
          $state.go('resultByAssessment', {
            assessmentId: id
          });
        };

        function publish(username, assessment) {
          GroupService.GetByUser(username, assessment._id).then(function(group) {
              if (group) {
                $scope.assessments.push(assessment);
                $scope.groups.push(group);
              }
            })
            .catch(function(err) {
              FlashService.Error(err);
            });
        }
      }
    ])
    .controller('ResultByAssessmentController', ['$scope', '$stateParams',
      'GroupService', 'AssessmentService', 'ModalService', 'FlashService', 'ResultService',
      function($scope, $stateParams, GroupService, AssessmentService, ModalService,
        FlashService, ResultService) {

        $scope.assessment = null;
        $scope.groups = [];
        $scope.prettyMembers = [];
        $scope.weightings = [];
        $scope.groupResults = [];
        $scope.groupMembers = [];
        $scope.overallSPA = {};
        $scope.overallSAPA = {};
        $scope.groupGrades = {};
        $scope.publishState = false;
        $scope.numSummertive = 0;
        var spa = {};
        var sapa = {};
        var scoreQuestions = [];
        var assessmentId = $stateParams.assessmentId;

        AssessmentService.GetById(assessmentId)
          .then(function(a) {
            $scope.assessment = a;
            $scope.publishState = a.publish || false;
            var count = 0;
            for (var n = 0, len = a.questions.length; n < len; n++) {
              if (a.questions[n].type === 'Single choice' || a.questions[n].type === 'Slider') {
                count++;
                scoreQuestions.push(a.questions[n].text);
              }
            }
            $scope.numSummertive = count;
            $scope.weightings = Array.apply(null, Array(count)).map(function(item, i) {
              return Number((100 / count).toFixed(2));
            });
          });

        GroupService.GetByAssessment(assessmentId)
          .then(function(g) {
            $scope.groups = g;
            for (var i = 0; i < g.length; i++) {
              if (g[i].grade !== undefined || g[i].grade !== null) {
                $scope.groupGrades[g[i]._id] = g[i].grade;
              }
              ResultService.GetByGroup(g[i]._id).then(function(results) {
                  var result = calOverallFactors(results.groupMember, $scope.weightings, $scope.assessment, results.results);
                  for (var n = 0, len = results.groupMember.length; n < len; n++) {
                    var member = results.groupMember[n];
                    $scope.overallSPA[member] = result.overallSPA[member];
                    $scope.overallSAPA[member] = result.overallSAPA[member];
                    $scope.groupResults.push(results);
                  }
                })
                .catch(function(err) {
                  FlashService.Error(err);
                });
              var member = g[i].member;
              $scope.groupMembers[i] = member;
              $scope.prettyMembers[i] = renderMember(member);
            }
          })
          .catch(function(err) {
            FlashService.Error(err);
          });

        $scope.flag = function(sapa) {
          return isSuspicious(sapa);
        };

        $scope.freeRider = function(spa) {
          return isFreeRider(spa);
        };

        $scope.isOk = function(spa, sapa) {
          return !isFreeRider(spa) && !isSuspicious(sapa);
        };

        $scope.show = function(groupId) {
          openModal(ModalService, "result/feedback.html", "FeedbackController", {
            group: groupId,
            assessment: $scope.assessment,
            weightings: $scope.weightings,
            user: {
              type: 'instructor'
            },
            numSummertive: $scope.numSummertive
          });
        };

        $scope.setWeightings = function() {
          openModal(ModalService, "result/setWeightings.html", "WeightingController", {
            weightings: $scope.weightings,
            questions: scoreQuestions
          }, function(result) {
            if (result) {
              $scope.weightings = result.weightings;
              for (var i = 0, len = $scope.groupResults.length; i < len; i++) {
                var result = calOverallFactors($scope.groupResults[i].groupMember, $scope.weightings, $scope.assessment, $scope.groupResults[i].results);
                for (var n = 0, len = $scope.groupResults[i].groupMember.length; n < len; n++) {
                  var member = $scope.groupResults[i].groupMember[n];
                  $scope.overallSPA[member] = result.overallSPA[member];
                  $scope.overallSAPA[member] = result.overallSAPA[member];
                }
              }
            }
          });
        };

        $scope.saveGrades = function() {
          for (var n = 0, len = $scope.groups.length; n < len; n++) {
            var group = $scope.groups[n];
            group.grade = $scope.groupGrades[group._id] || 0;
            GroupService.Update(group).then(function() {
                FlashService.Success("Grades saved.");
              })
              .catch(function(err) {
                FlashService.Error(err);
              });
          }
        };

        $scope.downloadGrades = function() {
          var weighting = Number(prompt("How much percent of marks should be influenced by peer assessment result?"));
          if (isNaN(weighting) || weighting <= 0 || weighting > 100) {
            FlashService.Error("Invalid input!");
          } else {
            var grades = [];
            for (var n = 0, len = $scope.groups.length; n < len; n++) {
              var group = $scope.groups[n]._id;
              var groupGrade = $scope.groupGrades[group];
              for (var i = 0, len2 = $scope.groups[n].member.length; i < len2; i++) {
                var member = $scope.groups[n].member[i];
                var spa = $scope.overallSPA[member];
                var grade = Number((spa * groupGrade * weighting / 100 + groupGrade * (1 - weighting / 100)).toFixed(2));
                var pair = Array(member, grade);
                grades.push(pair);
              }
            }
            var csvContent = "data:text/csv;charset=utf-8,";
            grades.forEach(function(infoArray, index) {
              var dataString = infoArray.join(",");
              csvContent += dataString + "\n";
            });
            var filename = $scope.assessment.courseCode + " " + $scope.assessment.courseName + " " + $scope.assessment.name;
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement('a');
            document.body.appendChild(link);
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', filename);
            link.click();
          }
        };

        $scope.publishResults = function() {
          var toState = {
            _id: assessmentId,
            publish: !$scope.publishState
          };
          AssessmentService.Update(toState).then(function() {
              if ($scope.publishState) {
                FlashService.Success("Results are private now!");
              } else {
                FlashService.Success("Results published to students!");
              }
              $scope.publishState = !$scope.publishState;
            })
            .catch(function(err) {
              FlashService.Error(err);
            });
        }

        $scope.uploadGrades = function() {
          openModal(ModalService, "result/uploadFile.html", "UploadController", {}, function(result) {
            if (result && result.grades) {
              var uploadedGrades = result.grades.split('\n');
              uploadedGrades.forEach(function(item, i) {
                uploadedGrades[i] = uploadedGrades[i].split(',');
                var grade = uploadedGrades[i].splice(-1, 1);
                GroupService.GetByUser(uploadedGrades[i], $scope.assessment._id).then(function(g) {
                    $scope.groupGrades[g._id] = Number(grade);
                  })
                  .catch(function(err) {
                    FlashService.Error("Please check the file you uploaded!");
                  });
              });
            }
          });
        };

      }
    ])
    .controller('FeedbackController', [
      '$scope', '$element', 'group', 'close', 'assessment', 'ResultService',
      'weightings', 'FlashService', 'user', 'numSummertive',
      function($scope, $element, group, close, assessment, ResultService, weightings, FlashService, user, numSummertive) {
        $scope.groupMembers = [];
        $scope.noComplete = "None";
        $scope.assessment = assessment;
        $scope.comments = [];
        $scope.results = [];
        $scope.rawResults = [];
        $scope.overallSPA = {};
        $scope.overallSAPA = {};
        $scope.user = user;
        $scope.numSummertive = numSummertive;

        ResultService.GetByGroup(group)
          .then(function(data) {
            $scope.groupMembers = data.groupMember;
            $scope.noComplete = renderMember(data.noComplete);
            $scope.comments = data.comments;
            $scope.results = data.results;
            $scope.rawResults = data.rawResultForIndividual;
            if (user.type === 'instructor') {
              var factors = calOverallFactors($scope.groupMembers, weightings, assessment, $scope.results);
              $scope.overallSPA = factors.overallSPA;
              $scope.overallSAPA = factors.overallSAPA;
            }
          })
          .catch(function(err) {
            FlashService.Error(err);
          })

        $scope.isSelf = function(person) {
          if (person === user.username) {
            return 'You';
          } else {
            return 'Member'
          }
        };

        $scope.flag = function(sapa) {
          return isSuspicious(sapa);
        };

        $scope.freeRider = function(spa) {
          return isFreeRider(spa);
        };

        $scope.isOk = function(spa, sapa) {
          return !isFreeRider(spa) && !isSuspicious(sapa);
        };

        $scope.deleteText = function(questionIndex, receiver, author) {
          ResultService.GetByUser(author, group).then(function(result) {
            result.result[receiver].splice(questionIndex, 1);
            ResultService.Update(result).then(function() {
              $scope.results[questionIndex][receiver] = null;
            });
          })
          .catch(function(err) {
            console.log(err);
          });
        };

        $scope.deleteComment = function(questionIndex, author) {
          ResultService.GetByUser(author, group).then(function(result) {
            result.comments[questionIndex] = null;
            ResultService.Update(result).then(function() {
              $scope.comments[questionIndex][author] = null;
            });
          })
          .catch(function(err) {
            console.log(err);
          });
        };

        $scope.close = function() {
          close(null, 500);
        };

        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };

      }
    ])
    .controller('UploadController', [
      '$scope', '$element', 'close', '$timeout',
      function($scope, $element, close, $timeout) {

        var grades = null;

        $timeout(function() {
          var input = document.getElementById("file");
          input.onchange = function() {
            var file = this.files[0];
            if (file) {
              var reader = new FileReader();
              reader.readAsText(file, "gbk");
              reader.onload = function() {
                grades = this.result;
              }
            }
          }
        });

        $scope.close = function() {

          close({
            grades
          }, 500);
        };

        $scope.cancel = function() {

          $element.modal('hide');

          close(null, 500);
        };
      }
    ])
    .controller('WeightingController', [
      '$scope', '$element', 'weightings', 'close', 'questions',
      function($scope, $element, weightings, close, questions) {

        $scope.weightings = weightings;
        $scope.questions = questions;

        $scope.close = function() {
          var sum = 0;
          $scope.weightings.forEach(function(item) {
            item = item || 0;
            sum += item;
          });
          $scope.weightings = $scope.weightings.map(function(item, i) {
            return Number((item * 100 / sum).toFixed(2));
          });
          close({
            weightings: $scope.weightings
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

  function isSuspicious(sapa) {
    if (sapa >= 0.90 && sapa <= 1.10)
      return false;
    return true;
  }

  function isFreeRider(spa) {
    return spa < 0.8;
  }

  function calOverallFactors(groupMembers, weightings, assessment, results) {
    var w = weightings.slice();
    var overallSPA = {};
    var overallSAPA = {};
    for (var i = 0, len2 = groupMembers.length; i < len2; i++) {
      var member = groupMembers[i];
      overallSPA[member] = 0;
      overallSAPA[member] = 0;
    }
    for (var n = 0, len = assessment.questions.length; n < len; n++) {
      var type = assessment.questions[n].type;
      if (type === 'Single choice' || type === 'Slider') {
        var weighting = w.shift();
        for (var i = 0, len2 = groupMembers.length; i < len2; i++) {
          var member = groupMembers[i]
          overallSPA[member] += results[n].spa[member] * weighting / 100;
          overallSAPA[member] += results[n].sapa[member] * weighting / 100;
        }
      }
    }
    for (var i = 0, len2 = groupMembers.length; i < len2; i++) {
      var member = groupMembers[i];
      overallSPA[member] = Number(overallSPA[member].toFixed(2));
      overallSAPA[member] = Number(overallSAPA[member].toFixed(2));
    }
    return {
      overallSPA,
      overallSAPA
    };
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
