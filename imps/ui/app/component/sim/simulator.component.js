(function () {
    'use strict';

    angular.module('reliance').controller('SimController', SimController);

    SimController.$inject = ['$scope','$cookies'];

    function SimController($scope, $cookies) {

        $scope.startSimulator = function () {
            console.log('check startSimulator');
            doFunction();
        }


        $scope.deviceId = $cookies.get('deviceId');
        var xhr = new XMLHttpRequest();
        var markers = [];

        var thaneArray = [{ "title": 'Mumbai', "lat": '18.944397', "lng": '72.832167', "description": "Mumabai" }, { "title": 'Thane', "lat": '19.212659', "lng": '73.004558', "description": "Tahne" }];
        var kalyanArray = [{ "title": 'Mumbai', "lat": '18.944397', "lng": '72.832167', "description": "Mumabai" }, { "title": 'Kalyan', "lat": '19.241527', "lng": '73.130392', "description": "Kalyan" }];
        var naviMumArray = [{ "title": 'Mumbai', "lat": '18.944397', "lng": '72.832167', "description": "Mumabai" }, { "title": 'NaviMumbai', "lat": '19.032783', "lng": '73.029575', "description": "NaviMumbai" }];
        var vasaiArray = [{ "title": 'Mumbai', "lat": '18.944397', "lng": '72.832167', "description": "Mumabai" }, { "title": 'Vasai', "lat": '19.402227', "lng": '72.883302', "description": "Vasai" }];
        var miraArray = [{ "title": 'Mumbai', "lat": '18.944397', "lng": '72.832167', "description": "Mumabai" }, { "title": 'MiraBhayandar', "lat": '19.285850', "lng": '72.903107', "description": "MiraBhayandar" }];
        var dadarArray = [{"title": 'Mumbai', "lat": '18.944397', "lng": '72.832167', "description": "Mumabai"}, { "title": 'Dadar', "lat": '19.0213', "lng": '72.8424', "description": "Dadar" }];

        var mapOptions = {
            center: new google.maps.LatLng(19.143010, 73.044616),
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("dvMap"), mapOptions);
        var infoWindow = new google.maps.InfoWindow();
        var lat_lng = new Array();
        var latlngbounds = new google.maps.LatLngBounds();

        //When Click Button press this will run

       function doFunction() {

            var selectedPoint = document.getElementById('end').value;
            var selectedDeviceid = document.getElementById('deviceid').value;
            // var selectedDeviceid= $scope.deviceId;
            // var selectedPoint= $scope.end;
            if (selectedPoint == "Thane") {
                markers = thaneArray;
            }
            else if (selectedPoint == "Kalyan") {
                markers = kalyanArray;
            }
            else if (selectedPoint == "NaviMumbai") {
                markers = naviMumArray;
            }
            else if (selectedPoint == "Vasai") {
                markers = vasaiArray;
            }
            else if (selectedPoint == "MiraBhayandar") {
                markers = miraArray;
            }
            else if (selectedPoint == "Dadar") {
                markers = dadarArray;
            }
            var endPoint = document.getElementById('start').value;
            var mapOptions = {
                center: new google.maps.LatLng(markers[0].lat, markers[0].lng),
                zoom: 10,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map(document.getElementById("dvMap"), mapOptions);
            var infoWindow = new google.maps.InfoWindow();
            var lat_lng = new Array();
            var latlngbounds = new google.maps.LatLngBounds();
            for (i = 0; i < markers.length; i++) {
                var data = markers[i];
                var myLatlng = new google.maps.LatLng(data.lat, data.lng);
                lat_lng.push(myLatlng);
                var marker = new google.maps.Marker({
                    position: myLatlng,
                    map: map,
                    title: data.title
                });
                latlngbounds.extend(marker.position);
                (function (marker, data) {
                    google.maps.event.addListener(marker, "click", function (e) {
                        infoWindow.setContent(data.description);
                        infoWindow.open(map, marker);
                    });
                })(marker, data);
            }
            map.setCenter(latlngbounds.getCenter());
            map.fitBounds(latlngbounds);

            //***********ROUTING****************//

            //Initialize the Path Array
            var path = new google.maps.MVCArray();

            //Initialize the Direction Service
            var service = new google.maps.DirectionsService();

            //Set the Path Stroke Color
            var poly = new google.maps.Polyline({ map: map, strokeColor: '#4986E7' });

            //Loop and Draw Path Route between the Points on MAP
            var drowArraypath = [];
            var countTime = 0;
            for (var i = 0; i < lat_lng.length; i++) {
                if ((i + 1) < lat_lng.length) {
                    var src = lat_lng[i];
                    //console.log(JSON.stringify(lat_lng[i]));
                    //console.log(lat_lng[i]);
                    var des = lat_lng[i + 1];
                    //console.log(JSON.stringify(lat_lng[i+1]));
                    path.push(src);
                    poly.setPath(path);
                    service.route({ origin: src, destination: des, travelMode: google.maps.DirectionsTravelMode.DRIVING }, function (result, status) {

                        if (status == google.maps.DirectionsStatus.OK) {
                            //console.log(JSON.stringify(result.routes[0].overview_path));
                            //sendGPSData(JSON.stringify(result.routes[0].overview_path));
                            for (var i = 0, len = result.routes[0].overview_path.length; i < len; i++) {
                                //console.log(result.routes[0].overview_path[i]);
                                setTimeout(function (y) {
                                    console.log(JSON.stringify(result.routes[0].overview_path[y]));
                                    path.push(result.routes[0].overview_path[y]);
                                    sendGPSData(JSON.stringify(result.routes[0].overview_path[y]), selectedDeviceid);

                                }, i * 1000, i); // we're passing x
                            }





                        }
                    });
                }
            }
            //console.log(drowArraypath[0]);



        }

        function sendGPSData(latAndlong, selectedDeviceid) {

            var arrayNew = JSON.parse(latAndlong);

            var requestArray = [];
            var payloadObj = {};
            payloadObj.lat = arrayNew.lat;
            payloadObj.lng = arrayNew.lng;
            payloadObj.deviceId = selectedDeviceid;
            requestArray.push({ payload: payloadObj });
            //requestArray.push({"lat":arrayNew.lat,"lng":arrayNew.lng,"deviceId":selectedDeviceid});
          //  xhr.open('POST', "https://reliance-jio-sim.mybluemix.net/gps", true);
          xhr.open('POST', "https://ytl-app.mybluemix.net/add", true);
            xhr.setRequestHeader("Content-type", "application/json");

            xhr.send(JSON.stringify(requestArray));
            //xhr.send(requestArray);

        }
    }
})();