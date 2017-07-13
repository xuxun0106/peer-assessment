(function () {
    'use strict';

    angular
        .module('app')
        .factory('QuestionService', Service);

    function Service($http, $q) {
        var service = {};

        service.getById = GetById;
        service.getByAuthor = GetByAuthor;
        service.Create = Create;
        service.Update = Update;
        service.Delete = Delete;

        return service;


        function GetById(_id) {
            return $http.get('/api/questions/' + _id).then(handleSuccess, handleError);
        }

        function GetByAuthor(_username) {
            return $http.get('/api/questions/' + _username).then(handleSuccess, handleError);
        }

        function Create(question) {
            return $http.post('/api/questions', question).then(handleSuccess, handleError);
        }

        function Update(question) {
            return $http.put('/api/questions/' + question._id, question).then(handleSuccess, handleError);
        }

        function Delete(_id) {
            return $http.delete('/api/questions/' + _id).then(handleSuccess, handleError);
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
