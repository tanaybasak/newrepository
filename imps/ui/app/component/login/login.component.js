(function() {
	'use strict';

	angular.module('reliance').controller('LoginController', LoginController);

	LoginController.$inject = [ '$scope', '$state', '$rootScope','HTTPPOSTService', 'dialogs', '$cookies' ];

	function LoginController($scope, $state, $rootScope, HTTPPOSTService, dialogs, $cookies, $modalInstance) {

		$scope.login = {};
		var baseURL = 'https://jio.mybluemix.net/api/v1/';
		var requestURL;
		

		// $scope.openTermsCondition= function(){
		// 	dialogs.create('/dialogs/terms.html','LoginController',$scope.data);	
		// }

		$scope.doLogin = function() {
			var payload = {};
			requestURL = baseURL + 'login';
			payload = $scope.login;
					
			HTTPPOSTService.post(requestURL, payload).then(function(response) {
//				console.log('response',response);
				if(response.data.status!='Success'){
					$scope.error=response.data.description;
					$scope.login = {};
					dialogs.notify('Login Failed', $scope.error );
				}				
				else{
					$cookies.put('driverLicenseNo',response.data.driverLicenseNo);
					$cookies.put('deviceId',response.data.deviceId);
					$cookies.put('driverName',response.data.userName);
					$cookies.put('firstName',response.data.driverName);
					$state.go('reliance.liveTracking');
				}
				$scope.login = {};
			}, function(data) {
				$scope.login = {};
				dialogs.error('Error', 'An error has occured while login');
			});

		}

		$scope.doRegister= function() {
				$state.go('registration');
		}

		// $scope.agreed = function(){
		// 	console.log('agreed');
		// 	$scope.termCheckbox=true;
		// 	$modalInstance.close();
		// }; 
	}

	// angular.module('reliance').run(['$templateCache',function($templateCache){
  	
  	// 	$templateCache.put('/dialogs/terms.html','<div class="modal-header"><h4 class="modal-title">Terms and Conditons </h4></div><div class="modal-body"><span class="help-block">Terms amd condtions Terms amd condtions Terms amd condtions Terms amd condtions Terms amd condtions Terms amd condtionsTerms amd condtions Terms amd condtions.</span></div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="agreed()">I Agree</button></div>')
	// }]); 

})();