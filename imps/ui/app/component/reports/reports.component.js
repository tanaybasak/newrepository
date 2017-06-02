(function() {
	'use strict';

	angular.module('reliance').controller('ReportsController', ReportsController)
	.filter('msToTime',TimeFilter);

	ReportsController.$inject = [ '$scope', 'HTTPGETService', 'HTTPPOSTService', '$rootScope', '$cookies', 'dialogs', '$timeout'];
	TimeFilter.$inject = ['$filter'];

	function ReportsController($scope, HTTPGETService, HTTPPOSTService, $rootScope, $cookies, dialogs, $timeout) {
		$scope.deviceId = $cookies.get('deviceId');
		$scope.driverName = $cookies.get('driverName');
		$scope.driverLicenseNo = $cookies.get('driverLicenseNo');		$scope.mapData = {};		var baseURL = 'https://jio.mybluemix.net/db/';
		var requestURL;
		$scope.singleTripDetails = {};
		$scope.allTripsDetails = [];
		$scope.avg_speed = 0;
		$scope.time_taken = 0;
		$scope.start_point = '';
		$scope.end_point = '';

// MAP STUFF START
		var map;

		function addRoutes(mapObj) {
			if (mapObj.routes) {
				var routeLayers = mapObj.routes.map(function(routeData, index) {
					return {
						"id": "route" + Math.floor(Math.random() * 10000),
						"type": "line",
						"source": {
							"type": "geojson",
							"data": {
								"type": "Feature",
								"properties": {},
								"geometry": {
									"type": "LineString",
									"coordinates": routeData.coordinates
								}
							}
						},
						"layout": {
							"line-join": "round",
							"line-cap": "round"
						},
						"paint": {
							"line-color": routeData.color,
							"line-width": routeData.title == "Main" ? 8 : 4,
							"line-opacity": routeData.title == "Main" ? 1 : 0.8
						}
					}
				})

				routeLayers.forEach(function(layer) {
					map.addLayer(layer)
				})
			}
		}

		function addMarkers(mapObj) {
			if (mapObj.markerPoints) {

				mapObj.markerPoints.forEach(function(data) {
					var pin = document.createElement('div');
					pin.className = 'pinMarker';
					retrieveGeoLocation(data.coordinates[1], data.coordinates[0], function(location) {
						var popup = new mapboxgl.Popup({offset: 20})
						.setLngLat(data.coordinates)
						.setHTML(location ? "<strong>" + data.title + "</strong>" + ': ' + location : data.title)
						
						new mapboxgl.Marker(pin, {offset: [-15,-22]})
							.setLngLat(data.coordinates)
							.setPopup(popup)
							.addTo(map);
					})
				})
			}
		}
		
		$scope.loadReportMap = function(){
			
			console.log("Loading map")
			mapboxgl.accessToken = 'pk.eyJ1Ijoic3dpemFyZCIsImEiOiJjaW5zNDF3dnQxMHBwdHFrajZpaDlmeGhhIn0.2xJtXDJoaY7iji7hI2PPxA';

			map = new mapboxgl.Map({
				container : 'map-report',
				style : 'mapbox://styles/mapbox/streets-v9',
				center : [ $scope.mapData.location.longitude, $scope.mapData.location.latitude ],
				zoom : 5
			});

			var coordinates = $scope.mainRouteCoordinates
			var bounds = coordinates.reduce(function(bounds, coord) {
				return bounds.extend(coord);
			}, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

			map.fitBounds(bounds, {
				padding: 100
			});
			
			map.on('load', function() {
				map.resize();

				addRoutes($scope.mapData)
				addMarkers($scope.mapData)

				var nav = new mapboxgl.NavigationControl();
				map.addControl(nav, 'top-right');		
				map.scrollZoom.disable();
				map.boxZoom.disable();
				map.doubleClickZoom.disable();
			});
		}

// MAP STUFF END
		
		$scope.retrieveTripDetails = function(){
			$scope.isLoadingReportDetails = true;
			requestURL = baseURL + 'driver/' + $scope.deviceId;
			
			HTTPGETService.get(requestURL).then(function(response) {
				if(response.data && response.data.length>0){
					$scope.allTripsDetails = response.data; 
					$scope.tripId = response.data[0].trip_id;
					$scope.tripIdList = retrieveTripIdList(response.data);					
					$scope.retrieveSingleTripData(response.data[0]);													
					$scope.speedAndTurnDetailData = retrieveDrivingDetails(response.data[0]);
					$timeout(function() {
						$('#speedAndTurnDetails').highcharts().reflow();
					}, 1000);			
					$scope.isLoadingReportDetails = false;
					getMapRoutes();
				} else {
					dialogs.notify('Info', 'No trip details found for the user');
				}
			}, function(data) {
				dialogs.error('Error', 'An error has occured while retrieving trip details');
			});
		}
		
		// Retrieve data for the 'Trip Details' section in reports page
		$scope.retrieveSingleTripData = function(singleTripData){			
			$scope.singleTripDetails = singleTripData;
			$scope.startLocation = {
				latitude: singleTripData.start_latitude,
				longitude: singleTripData.start_longitude
			}
			$scope.endLocation = {
				latitude: singleTripData.end_latitude,
				longitude: singleTripData.end_longitude
			}
			for(i=0; i<singleTripData.trip_features.length; i++){
				if(singleTripData.trip_features[i].feature_name == 'average_speed')
					$scope.avg_speed = singleTripData.trip_features[i].feature_value;
				if(singleTripData.trip_features[i].feature_name == 'time_span'){
					$scope.time_taken = singleTripData.trip_features[i].feature_value;
				}
			}
			retrieveGeoLocation(singleTripData.start_latitude, singleTripData.start_longitude, function (startLocation) {
				$scope.start_point = startLocation;
			});	
			retrieveGeoLocation(singleTripData.end_latitude, singleTripData.end_longitude, function (endLocation) {
				$scope.end_point = endLocation;
			});							
		}
		
		// Reload report page data according to the selected trip id
		$scope.getSelectedTripIdDetails = function(){
		
			for(i=0; i<$scope.allTripsDetails.length; i++){
				if($scope.tripIdList[i].trip_id == $scope.tripId){
				
					$scope.speedAndTurnDetailData = retrieveDrivingDetails($scope.allTripsDetails[i]);				
								
					$scope.retrieveSingleTripData($scope.allTripsDetails[i]);
					
					getMapRoutes();					
					$rootScope.loadBarChart('speedAndTurnDetails', $scope.speedAndTurnDetailData);
					return;
				}
			}
		}
		
		function getMapRoutes() {
			console.log("Loading data for " + $scope.tripId)
			var requestURL = 'https://jio.mybluemix.net/trip/' + $scope.tripId; //here replace '2376265961' with trip id
			var mapCoordinates = [];
			HTTPGETService.get(requestURL).then(function(response) {
				console.log('response : ', response);
				$scope.currentTripCoordinates = response
				angular.forEach( response.data, function(obj, key){
					mapCoordinates.push([obj.longitude, obj.latitude]);
				});
				$scope.mainRouteCoordinates = mapCoordinates
				$scope.mapData = {
					"layerId" : "route",
					"layerType" : "line",
					"sourceName" : "routing",
					"featureType" : "LineString",
					"featureCoordinates" : mapCoordinates,//[ [-97.74678204618638, 30.398964110941044 ],[ -97.751156, 30.3983384 ]], //from API long, lat
					"isShowPopUP" : false,
					"location" : {
						"state" : "Maharashtra",
						"city" : "Pune",
						"zipcode" : 410401,
						"latitude" : $scope.startLocation.latitude,
						"longitude" : $scope.startLocation.longitude
					},
					isReport: true,
					markerPoints: [
						{
							coordinates: $scope.mainRouteCoordinates[0],
							title: "Start"
						},
						{
							coordinates: $scope.mainRouteCoordinates[$scope.mainRouteCoordinates.length - 1],
							title: "End"
						}
					],
					routes: [
						{
							coordinates: mapCoordinates,
							title: "Main",
							color: "#9ce5f4"
						}
					].concat(getRouteData())
				};
				$scope.loadReportMap()
			}, function(data) {
				// on error
			});
		}

		function getRouteData() {
			var colors = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1']
			var behaviors = $scope.speedAndTurnDetailData.map(function(data) {
				return data.name
			})
			var routeData = $scope.DBDetails.map(function(data) {
				var start_time = new Date(data.start_time)
				var end_time = new Date(data.end_time)
				var coordinates = []
				$scope.currentTripCoordinates.data.forEach(function(pointData) {
					var timestamp = new Date(pointData.timestamp)
					if (timestamp >= start_time && timestamp <= end_time) {
						coordinates.push([pointData.longitude, pointData.latitude])
						console.log('Co-ordinates for ' + data.behavior_name)
					}
				})
				var title = data.behavior_name
				var index = behaviors.indexOf(title)
				var color = colors[index]
				return {
					coordinates: coordinates,
					title: title,
					color: color
				}
			})
			return routeData
		}

		// Process a single trip data for the bar chart 
		function retrieveDrivingDetails(drivingDetails) {
				console.log($scope.allTripsDetails);
			var drivingBehaviorDetailsArr = [];
			console.log(drivingDetails);
			// Retrieve driving behavior details from the json array
			for (var j = 0; j < drivingDetails.ctx_sub_trips.length; j++) {
				if (drivingDetails.ctx_sub_trips[j].driving_behavior_details.length > 0) {
					for (var k = 0; k < drivingDetails.ctx_sub_trips[j].driving_behavior_details.length; k++) {
						drivingDetails.ctx_sub_trips[j].driving_behavior_details[k].hits = 0;
						var obj = {
							"behavior_id": drivingDetails.ctx_sub_trips[j].driving_behavior_details[k].behavior_id,
							"behavior_name": drivingDetails.ctx_sub_trips[j].driving_behavior_details[k].behavior_name,
							"start_latitude": drivingDetails.ctx_sub_trips[j].driving_behavior_details[k].start_latitude,
							"start_longitude": drivingDetails.ctx_sub_trips[j].driving_behavior_details[k].start_longitude,
							"end_latitude": drivingDetails.ctx_sub_trips[j].driving_behavior_details[k].end_latitude,
							"end_longitude": drivingDetails.ctx_sub_trips[j].driving_behavior_details[k].end_longitude,
							"start_time": drivingDetails.ctx_sub_trips[j].driving_behavior_details[k].start_time,
							"end_time": drivingDetails.ctx_sub_trips[j].driving_behavior_details[k].end_time,
							"count": 1
						};
						drivingBehaviorDetailsArr.push(obj);
					}
				}
			}
			$scope.DBDetails = drivingBehaviorDetailsArr

			// Create an array containing the full count of each behavior
			var result = drivingBehaviorDetailsArr.reduce(function (res, obj) {
				if (!(obj.behavior_id in res))
					res.arr.push(res[obj.behavior_id] = obj);
				else {
					res[obj.behavior_id].count += obj.count;;
				}
				return res;
			}, { arr: [] });

			// Format the data set as a highcharts data series
			var tempArr = Array.apply(null, new Array(result.arr.length)).map(Number.prototype.valueOf, 0);
			drivingBehaviorDetailsArr = [];

			for (var x = 0; x < result.arr.length; x++) {
				tempArr = Array.apply(null, new Array(result.arr.length)).map(Number.prototype.valueOf, 0);
				tempArr[x] = result.arr[x].count;

				var obj = {
					name: result.arr[x].behavior_name,
					data: tempArr
				}
				drivingBehaviorDetailsArr.push(obj);
			}
			return drivingBehaviorDetailsArr;
		}
		
		
	}
	
	function TimeFilter ($filter){
		 return function (s) {
		        var secs = s % 60;
		        s = (s - secs) / 60;
		        var mins = s % 60;
		        var hrs = (s - mins) / 60;

		        return hrs + ' hrs. ' + mins + ' mins. ' + Math.round(secs) + ' secs. ';        
		};
	}

})();

function retrieveTripIdList(drivingDetails){
	var tripIdArr = [];
	for(i=0; i<drivingDetails.length; i++){
		var obj={
				'trip_id': drivingDetails[i].trip_id
		};
		tripIdArr.push(obj);
	}
	return tripIdArr;
}

// Retrieve location using latitude and longitude values
function retrieveGeoLocation(lat, lng, callback){
	var geocoder = new google.maps.Geocoder();
	var latlng = new google.maps.LatLng(lat, lng);
	var location = '';
	var arrAddress = [];

	geocoder.geocode({ 'latLng': latlng }, function (results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				arrAddress = results[0].formatted_address.split(',');
				location = arrAddress.splice(0,arrAddress.length - 2).toString();
			} else {
				console.log('Location not found');
			}
		} else {
			console.log('Geocoder failed due to: ' + status);
		}	
		callback(location);
	});				
}