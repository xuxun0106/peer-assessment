(function() {
  'use strict';

  angular
    .module('app')
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
    ]);
})();
