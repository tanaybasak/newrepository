(function() {
	'use strict';

	angular.module('reliance').controller('LiveTrackingController', LiveTrackingController);

	LiveTrackingController.$inject = [ '$scope','HTTPGETService',
			'HTTPPOSTService', '$rootScope', '$cookies', '$websocket','moment', '$localStorage' ];

	function LiveTrackingController($scope,HTTPGETService, HTTPPOSTService,
			$rootScope, $cookies, $websocket, moment, $localStorage) {

		$scope.realTimeData={
			'startTime':'',
			'currentTime':'00:00',
			'timeConsumed':'0',
			'currentLocation':'',
			'currentSpeed':'0',
			'distance':'0',
			'fuel_consumed':'0',
			'mileage' :'0',
			'start_fuel':''
		};

		$scope.trip_id=0;
		//$scope.realTimeData.currentTime=moment();
//		$scope.rotateAngle=12;

		$scope.mapData = {
				"layerId" : "trace",
				"layerType" : "line",
				"sourceName" : "trace",
				"featureType" : "LineString",
				"featureCoordinates" : [],//[ [-97.74678204618638, 30.398964110941044 ],[ -97.751156, 30.3983384 ]], //from API long, lat
				"isShowPopUP" : false,
				"location" : {
					"state" : "Maharashtra",
					"city" : "Pune",
					"zipcode" : 410401,
					"latitude" : 18.9766678,
					"longitude" : 72.8449593
				}
		};
		
		$scope.startTrip = function(){
			console.log('start trip');
			if($scope.deviceId){
				$scope.allowTripStart = false;
				$scope.mapData.resetMap();
				getTripId('start');
				$localStorage.latLongArray = [];
				$localStorage.starttime = null;
//				getDataFromWS();
			}
		}
		
		$scope.endTrip = function(){
			console.log('stopTrip');
			$scope.allowTripStart = true;
			getTripId('end');
			updateDriverDetails();
			$localStorage.starttime = null;
			$scope.realTimeData.startTime='';
			keepAlive(false);
		}
		

		function updateDriverDetails(){
			$scope.patchBoxContent[0].count=$scope.patchBoxContent[0].count+1;
			$scope.patchBoxContent[1].count=$scope.patchBoxContent[1].count+Math.floor($scope.realTimeData.distance);
			$scope.patchBoxContent[2].count=$scope.patchBoxContent[2].count+Math.floor(($scope.realTimeData.start_fuel-$scope.realTimeData.fuel_consumed));
			
		}

		function getLiveData(wsData) {

			if (!$scope.realTimeData.startTime) {
				if ($localStorage.starttime == null) {
					$scope.realTimeData.startTime = wsData.timestamp;
					$localStorage.starttime = $scope.realTimeData.startTime;
				} else {
					// console.log('local storage start
					// time',$localStorage.starttime);
					$scope.realTimeData.startTime = $localStorage.starttime;
				}

			}
			if (!$scope.realTimeData.start_fuel) {
				$scope.realTimeData.start_fuel = wsData.fuel_level;
			}

			if (wsData.timestamp) {
				$scope.realTimeData.currentTime = wsData.timestamp;
			}

			if (wsData.fuel_level != fuelLevel) {
				$scope.realTimeData.fuel_consumed = wsData.fuel_level;
				var fuelLevel = wsData.fuel_level.fuel_level;
			}

			if (wsData.speed != currSpeed) {
				$scope.realTimeData.currentSpeed = wsData.speed;
				var currSpeed = wsData.speed;
			}

			var starttime = moment($scope.realTimeData.startTime,
					"yyyy-MM-dd'T'HH:mm:ss'Z'");
			var currtime = moment($scope.realTimeData.currentTime,
					"yyyy-MM-dd'T'HH:mm:ss'Z'");
			$scope.realTimeData.timeConsumed = currtime.diff(starttime,
					'minutes');
			
			$scope.mapData.getDistance();
		}


		function getTripId(tripStatus){
			let requestURL =  'https://jio.mybluemix.net/trip/' + $scope.deviceId + '/' + tripStatus; 
			HTTPPOSTService.post(requestURL).then(function(data) {
				console.log('in getTripId : ', data.data.trip_id);
				$scope.trip_id = data.data.trip_id;
				if(data && tripStatus == 'start'){
					getDataFromWS();
				}
			}, function(data) {
				// on error
			});
		}
		
//		let count = 0;
		let wsData;
		let latLong;
		let wsURL;
		function getDataFromWS(){
			console.log('getDataFromWS');
			
			wsURL = $websocket('wss://jio.mybluemix.net/ws/track');
			wsURL.onOpen(function(message) {
		    	  //console.log('on open : ', message);
		    	  wsURL.send({deviceId: $scope.deviceId}); //Send Init
		    	  setInterval(function() {
	            	  wsURL.send({ping: '1'}); //Send Ping
				}, 30000);
			});
		      
			wsURL.onMessage(function(message) {
//				console.log('message.data : ', message.data);
				wsData = JSON.parse(message.data);
				if (wsData.eventType == 'gps') {
					latLong = [wsData.longitude, wsData.latitude];
					$scope.mapData.drawLiveRoute(latLong);
				} else {
					$scope.retrieveGeoLocation(wsData.latitude, wsData.longitude, function (location) {
						if (location != currLocation && location != '') {
							$scope.realTimeData.currentLocation = location;
							var currLocation = $scope.realTimeData.currentLocation;
							getLiveData(wsData);
						}
					});
				}
			});
		      
			wsURL.onClose(function(message) {
		    	  console.log('on close : ', message);
		    	  if(!$scope.allowTripStart){
		    		  keepAlive(true);
		    	  }
			});
		}
		
		function keepAlive(isAlive){
			if(isAlive){
				console.log('WS send');
				getDataFromWS();
			}else{
				wsURL.close(true);
				$scope.mapData.showPinsOnMap();
				$scope.mapData.fitBounds();
			}
		}

	
		function getTripStatus() {
			var requestURL = 'https://jio.mybluemix.net/trip/status/' + $scope.deviceId;
			HTTPGETService.get(requestURL).then(function(data) {
				
				if(data.status==200 && data.statusText=='OK')
				{
					let tripStatus = data.data.status;
					console.log(tripStatus)
					if (tripStatus == 'Running') {
						resumeTrip()
					}
				}else{
					console.log(data)
				}

			}, function(data) {
				// on error
			});
		}

		function resumeTrip() {
			$scope.allowTripStart = false
			getDataFromWS()
		}

		$scope.deviceId = $cookies.get('deviceId');
		//console.log('$scope.deviceId : ', $scope.deviceId);
		$scope.allowTripStart = true;
		getTripStatus()
		$scope.patchBoxContent = [ {
			name : 'No of Trips Made',
			count : '',
			bgColor : 'blue',
			txtcolor : 'text-white',
			imgName : 'icon_tripsmade'
		}, {
			name : 'Distance Travelled',
			count : '',
			unit : 'km',
			bgColor : 'green',
			txtcolor : 'text-white',
			imgName : 'icon_totalcars'
		}, {
			name : 'Fuel Consumption',
			count : '',
			unit : 'ltr',
			bgColor : 'purple',
			txtcolor : 'text-white',
			imgName : 'icon_fuel'
			
		}, {
			name : 'Errors Reported',
			count : '',
			bgColor : 'yellow',
			txtcolor : 'text-white',
			imgName : 'icon_error'
		} ];
		
		var baseURL = 'https://jio.mybluemix.net/db/';

		function getTotalTripDetails() {
			var requestURL = baseURL + 'driver/trips/'+$scope.deviceId;
			HTTPGETService.get(requestURL).then(function(data) {
				
				if(data.status==200 && data.statusText=='OK')
				{
					
					$scope.patchBoxContent[0].count = data.data.trips;

				}else{
					$scope.patchBoxContent[0].count = 0;
				}

			}, function(data) {
				// on error
			});

			requestURL = baseURL + 'distance/'+$scope.deviceId;
			HTTPGETService.get(requestURL).then(function(data) {
				
				if(data.data.distance)
				{
					
					$scope.patchBoxContent[1].count = Math.floor(data.data.distance);

				}
				else{
					$scope.patchBoxContent[1].count = 0;
				}
			}, function(data) {
				// on error
			});

			requestURL = baseURL + 'fuel/'+$scope.deviceId;
			HTTPGETService.get(requestURL).then(function(data) {
				//console.log('total fuel consumed:',data);
				if(data.data.total_fuel_consumed){

					$scope.patchBoxContent[2].count = Math.floor(data.data.total_fuel_consumed);
				}else{
					$scope.patchBoxContent[2].count = 0;
				}
			}, function(data) {
				// on error
			});

			requestURL = baseURL + 'errors/'+$scope.deviceId;
			HTTPGETService.get(requestURL).then(function(data) {
				if(data.data.errors){
					$scope.patchBoxContent[3].count = data.data.errors;
				}else{
					$scope.patchBoxContent[3].count = 0;
				}
			}, function(data) {
				// on error
			});
		}
		getTotalTripDetails();
		
		
		// Retrieve location using latitude and longitude values
		$scope.retrieveGeoLocation = function(lat, lng, callback){
		        var geocoder = new google.maps.Geocoder();
		        var latlng = new google.maps.LatLng(lat, lng);
				var location = '';
				var arrAddress = [];

		        geocoder.geocode({ 'latLng': latlng }, function (results, status) {
		        		if (status == google.maps.GeocoderStatus.OK) {
		                        if (results[0]) {
//									arrAddress = results[0].address_components;

									/*$.each(arrAddress, function (i, address_component) {
//										if (address_component.types[0] == "locality"){								
//											console.log("town:"+address_component.long_name);
											location = address_component.short_name;
//											return false;																
//										} 								
									});*/
//									location = results[0].formatted_address;
		                        	arrAddress = results[0].formatted_address.split(',');
		                        	location = arrAddress.splice(0,arrAddress.length - 2).toString();;
		                        } else {
		                            console.log('Location not found');
		                        }
		                    } else {
		                        console.log('Geocoder failed due to: ' + status);
		                    }	
							callback(location);
		            });				
		}
	}
})();