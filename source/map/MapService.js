﻿angularTraveloggia.service('MapService', function ($window) {

    var local_scope = this;
    var map;
    var mapOptions;
    var currentLocation;
    var MarkerArray = [];
    var bounds = null;

    var mapTypeControlOptions = {
        mapTypeIds: [google.maps.MapTypeId.TERRAIN, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.ROADMAP],
        position: google.maps.ControlPosition.BOTTOM_LEFT
    };
    local_scope.initMap = function () {
        // this takes too long
        //if (navigator.geolocation) {
        //    // get the current location using html5 geocoding and pass coords to set opening map view

        //    navigator.geolocation.getCurrentPosition(function (position) {
        //        var lat = position.coords.latitude;
        //        var lng = position.coords.longitude;
        //        currentLocation = new google.maps.LatLng(lat, lng);


        //        mapOptions = {
        //            MapTypeControlOptions: mapTypeControlOptions,
        //            center: currentLocation,
        //            zoom: 13

        //        }


        //        if(!map)
        //        map = new google.maps.Map(document.getElementById("map_canvas"),
        //             mapOptions);

        //    });


        //}
        //else {
        // alert("Geolocation API is not supported in your browser.");
        // hard code a place for the map to start
        lat = 0;// 52.516274;
        lng = 0;//13.377678;
        currentLocation = new google.maps.LatLng(lat, lng);

        mapOptions = {
            MapTypeControlOptions: mapTypeControlOptions,
            center: currentLocation,
            zoom: 2

        }

        // if(!map)
        map = new google.maps.Map(document.getElementById("map_canvas"),
             mapOptions);



        // }





    }


    local_scope.setMapSize =function () {

        var deviceWidth = $window.innerWidth;

    if (deviceWidth > 550)
        deviceWidth = (deviceWidth * 66.66666) / 100;  //-30;

    var deviceHeight = $window.innerHeight;// -30;// $('[data-role="page"]').first().height();

    angular.element(document).find('#map_canvas').css({ 'width': deviceWidth, 'height': deviceHeight });

    if (map) {
        bounds = new google.maps.LatLngBounds();
        google.maps.event.trigger(map, 'resize');
        if (bounds != undefined)
            map.fitBounds(bounds);
    }

}





});