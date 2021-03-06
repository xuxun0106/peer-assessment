﻿(function () {
    'use strict';

    angular
        .module('app')
        .factory('UserService', Service);

    function Service($http, $q) {
        var service = {};

        service.GetCurrent = GetCurrent;
        service.GetAllCourses = GetAllCourses;
        service.GetCourses = GetCourses;


        return service;

        function GetCurrent() {
            return $http.get('/api/users/current').then(handleSuccess, handleError);
        }

        function GetAllCourses() {
            return $http.get('/api/users/allcourses').then(handleSuccess, handleError);
        }

        function GetCourses() {
            return $http.get('/api/users/courses').then(handleSuccess, handleError);
        }

        // private functions

        function handleSuccess(res) {
            return res.data;
        }

        function handleError(res) {
            return $q.reject(res.data);
        }
    }

})();
