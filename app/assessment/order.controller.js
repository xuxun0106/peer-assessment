(function() {
  'use strict';

  angular
    .module('app')
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
    ]);
})();
