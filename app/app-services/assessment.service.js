(function () {
    'use strict';

    angular
        .module('app')
        .factory('AssessmentService', Service);

    function Service($http, $q) {
        var service = {};

        service.GetById = GetById;
        service.GetByAuthor = GetByAuthor;
        service.GetByCourse = GetByCourse;
        service.Create = Create;
        service.Update = Update;
        service.Delete = Delete;

        return service;


        function GetById(_id) {
            return $http.get('/api/assessments?id=' + _id).then(handleSuccess, handleError);
        }

        function GetByAuthor(_username) {
            return $http.get('/api/assessments/' + _username).then(handleSuccess, handleError);
        }

        function GetByCourse(_code) {
            return $http.get('/api/assessments?code=' + _code).then(handleSuccess, handleError);
        }

        function Create(assessment) {
            return $http.post('/api/assessments', assessment).then(handleSuccess, handleError);
        }

        function Update(assessment) {
            return $http.put('/api/assessments/' + assessment._id, assessment).then(handleSuccess, handleError);
        }

        function Delete(_id) {
            return $http.delete('/api/assessments/' + _id).then(handleSuccess, handleError);
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
