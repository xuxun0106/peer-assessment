(function() {
  'use strict';

  angular
    .module('app')
    .controller('UploadGroupsController', [
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
})();
