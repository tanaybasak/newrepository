angular.module('reliance')
    .factory('HTTPPOSTService',function($http, $q){
        return {
            post: function(url,data){
                var deferred = $q.defer();
                $http({
                    method: 'POST',
                    url: url,
                    data: data
                })
                .then(function(data, status, headers, config){
					deferred.resolve(data);
				})
				.catch(function(data, status, headers, config){
			        deferred.reject("An error occured while fetching items");
				});
			    return deferred.promise;
            }
        }
});