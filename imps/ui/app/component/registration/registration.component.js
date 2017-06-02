(function() {
	'use strict';

	angular.module('reliance').controller('RegistrationController', RegistrationController);

	RegistrationController.$inject = [ '$scope', '$state','HTTPPOSTService', 'dialogs'];

	function RegistrationController($scope, $state, HTTPPOSTService, dialogs) {
		
		var baseURL = 'https://jio.mybluemix.net/api/v1/';
		var requestURL;
		$scope.regForm={};
		$scope.error='';
		
		$scope.clearDetails = function () {
			$scope.regForm={};
			$state.go('login');
		}

		$scope.submitDetails =function(){
			
			if($scope.regForm.password ==$scope.regForm.confirmPassword ){
				$scope.error='';
				var payload = {};
				requestURL = baseURL + 'newUserRegistration';
				payload = $scope.regForm;
				
				HTTPPOSTService.post(requestURL, payload).then(function(response) {
					if(response.data.status!='Success'){
						$scope.error=response.data.description;
						dialogs.notify('Registration Failed', $scope.error );
					}				
					else{
						dialogs.notify('Registration Success', 'Registration done successfully');
						$state.go('login');
					}
					$scope.regForm = {};
				}, function(data) {
					$scope.regForm = {};
					dialogs.error('Error', 'An error has occured during registration');
				});
			}
			else{
				$scope.error='Confirm Password doesn\'t match';
				$scope.regForm.password='';
				$scope.regForm.confirmPassword='';
				dialogs.notify('Password Mismatch', $scope.error );
			}
			

		}
	}
})();