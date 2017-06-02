(function() {
	'use strict';

	angular.module('reliance').config(appRoute);

	appRoute.$inject = [ '$stateProvider', '$locationProvider',
			'$urlRouterProvider' ];

	function appRoute($stateProvider, $locationProvider, $urlRouterProvider) {

		$urlRouterProvider.otherwise('/');

		$stateProvider.state('login', {
			url : '/',
			templateUrl : 'app/component/login/login.component.html',
			controller : 'LoginController',
			data : { pageTitle: 'Login' },
		}).state('registration', {
			url : '/registration',
			templateUrl : 'app/component/registration/registration.component.html',
			controller : 'RegistrationController',
        	data : { pageTitle: 'Registration' },
		}).state('reliance', {
			url : '/reliance',
			templateUrl : 'app/component/main.component.html',
			controller : 'MainController'
		}).state('reliance.liveTracking', {
			url : '/liveTracking',
			templateUrl : 'app/component/liveTracking/liveTracking.component.html',
			controller : 'LiveTrackingController',
			data : { pageTitle: 'Tracking' },
		}).state('reliance.reports', {
			url : '/reports',
			templateUrl : 'app/component/reports/reports.component.html',
			controller : 'ReportsController',
			data : { pageTitle: 'Reports' },
		}).state('reliance.sim', {
			url : '/simulator',
			templateUrl : 'app/component/sim/simulator.component.html',
			controller : 'SimController',
			data : { pageTitle: 'Simulator' },
		});

	}
})();