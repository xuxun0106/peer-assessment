(function () {
    'use strict';

    angular
        .module('app')
        .factory('FormService', Service);

    function Service($http, $q) {
        var service = {};

        service.GetAll = GetAll;
        service.getByAuthor = getByAuthor;
        service.Create = Create;
        service.Update = Update;
        service.Delete = Delete;

        return service;


        function GetAll() {
            return $http.get('/api/forms').then(handleSuccess, handleError);
        }

        function getByAuthor(_author) {
            return $http.get('/api/forms/' + _author).then(handleSuccess, handleError);
        }

        function Create(form) {
            return $http.post('/api/forms', form).then(handleSuccess, handleError);
        }

        function Update(form) {
            return $http.put('/api/forms/' + form._id, form).then(handleSuccess, handleError);
        }

        function Delete(_id) {
            return $http.delete('/api/forms/' + _id).then(handleSuccess, handleError);
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
