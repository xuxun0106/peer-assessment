(function () {
    'use strict';

    angular
        .module('app', ['ui.router', 'angularModalService',
        'ui.bootstrap.datetimepicker', 'rzModule', 'dndLists', 'ngGentle'])
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
            .state('assessment', {
                url: '/',
                templateUrl: 'assessment/index.html',
                controller: 'Assessment.IndexController',
                controllerAs: 'assessmentCtrl',
                data: { activeTab: 'assessment' }
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
            })
            .state('results', {
                url: '/results',
                templateUrl: 'result/index.html',
                controller: 'Result.IndexController',
                controllerAs: 'resultCtrl',
                data: {
                  activeTab: 'results',
                  permissions: ['instructor']
                }
            })
            .state('resultByAssessment', {
                url: '/result/:assessmentId',
                templateUrl: 'result/resultsByAssessment.html',
                controller: 'ResultByAssessmentController',
                data: {
                  activeTab: 'results',
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
