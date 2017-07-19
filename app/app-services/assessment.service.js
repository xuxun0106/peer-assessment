(function () {
    'use strict';

    angular
        .module('app')
        .factory('AssessmentService', Service);

    function Service($http, $q) {
        var service = {};

        service.getById = GetById;
        service.GetByCourse = GetByCourse;
        service.Create = Create;
        service.Update = Update;
        service.Delete = Delete;

        return service;


        function GetById(_id) {
            return $http.get('/api/assessments/' + _id).then(handleSuccess, handleError);
        }

        function GetByCourse(_course) {
            return $http.get('/api/assessments/' + _course).then(handleSuccess, handleError);
        }

        function Create(assessment) {
            return $http.post('/api/assessments', assessment).then(handleSuccess, handleError);
        }

        function Update(question) {
            return $http.put('/api/assessments/' + question._id, assessment).then(handleSuccess, handleError);
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
