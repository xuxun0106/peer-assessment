(function () {
    'use strict';

    angular
        .module('app')
        .factory('GroupService', Service);

    function Service($http, $q) {
        var service = {};

        service.GetByUser = GetByUser;
        service.GetByAssessment = GetByAssessment;
        service.Create = Create;
        service.Delete = Delete;
        service.Update = Update;

        return service;

        function GetByUser(_user,_assessment) {
          return $http.get('/api/groups?member=' + _user + '&assessment=' + _assessment).then(handleSuccess, handleError);
        }

        function GetByAssessment(_assessment) {
          return $http.get('/api/groups/' + _assessment).then(handleSuccess, handleError);
        }

        function Update(_group) {
            return $http.put('/api/groups/' + _group._id, _group).then(handleSuccess, handleError);
        }

        function Create(_group) {
            return $http.post('/api/groups', _group).then(handleSuccess, handleError);
        }


        function Delete(_id) {
            return $http.delete('/api/groups/' + _id).then(handleSuccess, handleError);
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
