(function() {
  'use strict';

  angular
    .module('app')
    .controller('Question.IndexController', ['QuestionService', 'UserService', '$templateRequest', '$compile', '$scope', '$document', 'FlashService', Controller]);

  function Controller(QuestionService, UserService, $templateRequest, $compile, $scope, $document, FlashService) {

    var vm = this;
    vm.searchText = "";

    vm.emptyQuestion = function() {
      vm.newq = {
        text: null,
        type: null
      };
      UserService.GetCurrent().then(function(user) {
        vm.newq.author = user.username;
      });
    };

    vm.emptyQuestion();

    vm.questions = [];
    vm.types = ['Single choice', 'Multiple choice', 'Text', 'Slider'];
    vm.levels = ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly Agree'];

    UserService.GetCurrent().then(function(user) {
      QuestionService.GetByAuthor(user.username).then(function(q) {
        vm.questions = q;
      })
    });

    vm.setType = function(t) {
      if (vm.newq.type != t) {
        removeDiv();
        var temp = vm.newq.text;
        vm.emptyQuestion();
        vm.newq.text = temp;

        vm.newq.type = t;

        if (t === 'Single choice') {
          vm.newq.levels = vm.levels;
          loadHtml('question/radio.html');
        } else if (t === 'Multiple choice') {
          vm.newq.numCheckbox = ["", ""];
          vm.newq.options = new Array(2);
          loadHtml('question/checkbox.html');
        } else if (t === 'Slider') {
          loadHtml('question/slider.html');
        }
      }
    };

    vm.addCheckbox = function() {
      vm.newq.numCheckbox.push("");
    };

    vm.deleteCheckbox = function(index) {
      if (vm.newq.numCheckbox.length > 2) {
        var myEl = angular.element(document.querySelector('.option')).first();
        for (var n = 0; n < index; n++) {
          myEl = myEl.next();
        }
        myEl.remove();
        vm.newq.numCheckbox.pop();
      }
    };

    vm.saveQuestion = function() {
      var numOptions = 0;
      if (vm.newq.type === 'Multiple choice') {
        for (var i = 0; i < vm.newq.options.length; i++) {
          if (typeof vm.newq.options[i] === 'string') numOptions++;
        }
      }
      if (!vm.newq.text || !vm.newq.type) {
        FlashService.Error('Question not compeled!');
      } else if (vm.newq.type === 'Multiple choice' && numOptions < 2) {
        FlashService.Error('Question not compeled!');
      } else {
        QuestionService.Create(vm.newq).then(function() {
            FlashService.Success('Question saved!');
            QuestionService.GetByAuthor(vm.newq.author).then(function(q) {
              vm.questions = q;
            });
            vm.emptyQuestion();
            removeDiv();
          })
          .catch(function(error) {
            FlashService.Error(error);
          });
      }
    };

    vm.deleteQuestion = function(q) {
      QuestionService.Delete(q._id).then(function() {
          FlashService.Success('Question deleted!')
          QuestionService.GetByAuthor(vm.newq.author).then(function(qs) {
            vm.questions = qs;
          });
        })
        .catch(function(error) {
          FlashService.Error(error);
        });
    };

    // vm.editQuestion = function(q, index){
    //  var myNode = document.querySelector('.panel');
    //  for (var n = 0; n < index; n++) {
    //    myEl = myEl.next();
    //  }
    //
    // };

    function loadHtml(path) {
      $templateRequest(path).then(function(html) {
        var template = angular.element(html);
        angular.element('.question').append(template);
        $compile(template)($scope);
      });
    }

    function removeDiv() {
      var myNode = document.querySelector('.question');
      while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
      }
    }
  }
})();
