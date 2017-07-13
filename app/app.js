(function () {
    'use strict';

    angular
        .module('app', ['ui.router'])
        .config(config)
        .run(run)
        .controller('PermissionCtrl',['$scope', 'UserService',function($scope, UserService){
          $scope.user = {};

          initController();

          function initController() {
            UserService.GetCurrent().then(function (user) {
                  $scope.user = user;
                  $scope.permissions =
                  {
                    instructor : isInstructor()
                  }
              });
            }

          function isInstructor() {
              return ($scope.user.type === 'instructor');
          }
        }]);



    function config($stateProvider, $urlRouterProvider) {
        // default route
        $urlRouterProvider.otherwise("/");

        $stateProvider
            .state('project', {
                url: '/',
                templateUrl: 'project/index.html',
                controller: 'Project.IndexController',
                controllerAs: 'projectCtrl',
                data: { activeTab: 'project' }
            })
            .state('question', {
                url: '/question',
                templateUrl: 'question/index.html',
                controller: 'Question.IndexController',
                controllerAs: 'questionCtrl',
                data: {
                  activeTab: 'question',
                  permissions: ['instructor']
                }
            });
    }

    function run($http, $rootScope, $window) {
        // add JWT token as default auth header
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $window.jwtToken;

        // update active tab on state change
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            $rootScope.activeTab = toState.data.activeTab;
        });
    }

    // manually bootstrap angular after the JWT token is retrieved from the server
    $(function () {
        // get JWT token from server
        $.get('/app/token', function (token) {
            window.jwtToken = token;

            angular.bootstrap(document, ['app']);
        });
    });
})();
