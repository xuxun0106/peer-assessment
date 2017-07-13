(function () {
    'use strict';

    angular
        .module('app')
        .controller('Question.IndexController', ['QuestionService' ,'UserService', Controller]);

    function Controller(QuestionService, UserService) {
      //var questions = QuestionService.getByAuthor;
      var vm = this;

      vm.emptyQuestion = function() {
        vm.newq = {
          text: null,
          type: null
        };

        UserService.GetCurrent().then(function (user) {
          vm.newq.author = user.username;
        });
      };


    }



})();
