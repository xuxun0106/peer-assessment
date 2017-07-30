(function () {
    'use strict';

    angular
        .module('app')
        .factory('ResultService', Service);

    function Service($http, $q) {
        var service = {};

        service.GetByUser = GetByUser;
        service.Create = Create;
        service.Update = Update;
        service.Delete = Delete;

        return service;


        function GetByUser(_user,_group) {
          return $http.get('/api/results?member=' + _user + '&group=' + _group).then(handleSuccess, handleError);
        }

        function Create(result) {
            return $http.post('/api/results', result).then(handleSuccess, handleError);
        }

        function Update(result) {
            return $http.put('/api/results/' + result._id, result).then(handleSuccess, handleError);
        }

        function Delete(_id) {
            return $http.delete('/api/results/' + _id).then(handleSuccess, handleError);
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
