﻿angularTraveloggia.controller('MapController', function (SharedStateService, canEdit, readOnly, isEditing, $window, $route, $scope, $location, DataTransportService, $timeout, $http, debounce) {


    $scope.stateMachine = {
        state: SharedStateService.getAuthorizationState()
    }
 

    $scope.selectedState = {
        editSelected:false
    }

    var clickHandler = null; 
    var pushpinCollection = null;
    $scope.dialogIsShowing = false;
    $scope.searchAddress = null;
    $scope.confirmCancelQuestion = "Save location permanently to map?";


    // INIT SEQUENCE

    var clearSites = function () {

        for (var i = 0; i<$scope.mapInstance.entities.getLength() ; i++) {
            var pushpin = $scope.mapInstance.entities.get(i);
            if (pushpin instanceof Microsoft.Maps.Pushpin) {
                $scope.mapInstance.entities.removeAt(i);
            }
        }

    }



    var drawSites = function () {
        var sites = $scope.MapRecord.Sites;
        var arrayOfMsftLocs = [];

        for (var i = 0; i < sites.length; i++)
        {
            var loc = new Microsoft.Maps.Location(sites[i].Latitude, sites[i].Longitude)
            var pin = new Microsoft.Maps.Pushpin(loc, { anchor: (17, 17), enableHoverStyle: true, draggable: false, title: sites[i].Name, subTitle: sites[i].Address });

            (function attachEventHandlers(site) {
                Microsoft.Maps.Events.addHandler(pin, 'click', function () {
                    SharedStateService.setSelected("Site", site);
                    $scope.$apply(function () {// $location.path("/Album")
                        $scope.navigateWindowTwo();
            })
                });
                Microsoft.Maps.Events.addHandler(pin, 'mouseover', function () {
                    SharedStateService.setSelected("Site", site);                   
                    $scope.$apply(function () {
                        var currentPath = $location.path();
                        $location.path(currentPath).search({});
                    });
                });
            })(sites[i], $scope, $location)

            arrayOfMsftLocs.push(loc);
            if($scope.mapInstance.entities != null)
                $scope.mapInstance.entities.push(pin);
            else 
                $timeout(function () {
                    $scope.mapInstance.entities.push(pin);
                })
        }
        var viewRect = Microsoft.Maps.LocationRect.fromLocations(arrayOfMsftLocs);
        var selectedSiteID = SharedStateService.getSelectedID("Site")
        var searchObject = $location.search();

        if (selectedSiteID == "null" || selectedSiteID == null || searchObject["ZoomOut"] == "true" )// if loading from a shared link)
        {
          // softy hack because they love me :)
            $scope.mapInstance.setView({ bounds: viewRect, padding: 30 });
            //var badZoom = $scope.mapInstance.getZoom();
           

            //if (searchObject["ZoomOut"] == "true")
            //{
            //   // badZoom = badZoom - 2;
            //    $scope.mapInstance.setView({ center: viewRect.center, zoom: badZoom });
            //}
            if (selectedSiteID == "null" || selectedSiteID == null )
                SharedStateService.setSelected("Site", $scope.MapRecord.Sites[0]);
          
        }
        else {
            for (var i = 0; i < $scope.MapRecord.Sites.length; i++) {
                if ($scope.MapRecord.Sites[i].SiteID == selectedSiteID) {
                    selectedSite = $scope.MapRecord.Sites[i];
                    break;
                }
            }
            var loc = new Microsoft.Maps.Location(selectedSite.Latitude, selectedSite.Longitude)
            $scope.mapInstance.setView({ center: loc, zoom: 17 });
        }
        $scope.systemMessage.loadComplete = true;
    }




  var loadDefaultMap = function () {
            DataTransportService.getMaps(SharedStateService.getAuthenticatedMemberID() ).then(
                function (result) {
                    $scope.MapRecord = result.data;
                    SharedStateService.setSelected("Map", $scope.MapRecord);
                    SharedStateService.Repository.put('Map', result.data);                   
                    SharedStateService.setSelected("Site", null);// clear any previous settings
                    if ($scope.MapRecord.Sites.length > 0) {
                        SharedStateService.Repository.put("Sites", $scope.MapRecord.Sites);
                        drawSites();
                        
                    }
                    else
                        $scope.systemMessage.loadComplete = true;
                },
                function (error) {
                    $scope.systemMessage.text = "error loading map data";
                    $scope.systemMessage.activate();
                }
            )// end then

    }
    
  var reloadMap = function () {
        var cachedMap = SharedStateService.Repository.get("Map");
        $scope.MapRecord = cachedMap;
        if ($scope.MapRecord.Sites.length > 0)
            drawSites();
        else
            $scope.systemMessage.loadComplete = true;
    }

  var loadSelectedMap = function (mapID) {
      var selectedMapID=null;
      if (mapID == null)
          selectedMapID = SharedStateService.getSelectedID("Map")
      else
          selectedMapID = mapID;
        DataTransportService.getMapByID(selectedMapID).then(
            function (result) {
                if (mapID != null)// this is passed by a query string param on a shareable link
                {
                    SharedStateService.setAuthorizationState(readOnly);
                    SharedStateService.setAuthenticatedMember({ MemberID: result.data.MemberID });
                    SharedStateService.setSelected("Map", result.data);
                    SharedStateService.Repository.put("Sites", []);
                    SharedStateService.Repository.put("Map", null);
                    SharedStateService.Repository.put("Journals", []);
                    SharedStateService.Repository.put("Photos", [])
                }

                $scope.MapRecord = result.data;
                SharedStateService.Repository.put('Map', result.data);
             
              
                    SharedStateService.setSelected("Site", null)
                 
                    $timeout(function () {
                        clearSites();
                    },3000)
          
              
                if ($scope.MapRecord.Sites.length > 0)
                  
                        drawSites();
                
                    
                else
                    $scope.systemMessage.loadComplete = true;

            },
            function (error) {
                $scope.systemMessage.text = "error loading selected map";
                $scope.systemMessage.activate();
            }
            )
}


 var loadMap = function () {
        var requestedMap = null;
        var searchObject = $location.search();// if loading from a shared link
        if (searchObject["MapID"]) {
            requestedMap = searchObject["MapID"];
        }
           
        var cachedMap = SharedStateService.Repository.get("Map");
        var selectedMapID = SharedStateService.getSelectedID("Map");
        if (requestedMap != null)
            loadSelectedMap(requestedMap);
       else if (cachedMap == null && (selectedMapID == null || selectedMapID =="null"))
            loadDefaultMap();
        else if (cachedMap == null && selectedMapID != null)
            loadSelectedMap();
        else if (cachedMap != null && selectedMapID !== null && cachedMap.MapID == selectedMapID)
            reloadMap();
        else if (cachedMap != null && selectedMapID != null && cachedMap.MapID != selectedMapID)
            loadSelectedMap();
    }

 var redraw = debounce(500, function () {
     console.log("debounced resize on map page");
     if ($location.path() != "/Map" && $location.path() != "/")
         return;
     // this sizes the outer container defined in notification controller the base container
     $scope.setDimensions();
          // when in doubt use a timeout :(
        $timeout(afterLoaded(),2000);
    });


  var  afterLoaded = function () {
        if ($http.pendingRequests.length > 0) {
            $timeout(afterLoaded,200); // Wait for all templates to be loaded
        }
        else {
                    if ($scope.mapInstance == null) 
                    {

                        var mapType = "a"
                        if ($scope.Capabilities.currentDevice.deviceType == "mobile")
                            mapType = "r";


                            $scope.mapInstance = new Microsoft.Maps.Map(document.getElementById('bingMapRaw'), {
                                credentials: 'AnDSviAN7mqxZu-Dv4y0qbzrlfPvgO9A-MblI08xWO80vQTWw3c6Y6zfuSr_-nxw',
                                mapTypeId:mapType,
                                showLocateMeButton: false,
                                showTermsLink: false,
                                enableClickableLogo: false
                            });
                      }

                    if ($scope.mapInstance != null)// of course its not, just checking
                        loadMap();
                    else
                        $timeout($scope.afterLoaded);

            }
  };


  $scope.$watch(
      function (scope) {
          if (SharedStateService.Selected.Site != null)
              return SharedStateService.Selected.Site.SiteID;
      },
      function (newValue, oldValue) {
          if (newValue != null && newValue != oldValue)
          {
              var searchObject = $location.search()
              if (($location.path() != "/MapList") && searchObject["ZoomIn"] == "true")
              {
                  var selectedSiteID = SharedStateService.getSelectedID("Site")
                      for (var i = 0; i < $scope.MapRecord.Sites.length; i++) {
                          if ($scope.MapRecord.Sites[i].SiteID == selectedSiteID) {
                              selectedSite = $scope.MapRecord.Sites[i];
                              break;
                          }
                      }
                      var loc = new Microsoft.Maps.Location(selectedSite.Latitude, selectedSite.Longitude)
                      $scope.mapInstance.setView({ center: loc, zoom: 17 });
              }
          }
      });



    // loading the data if they change sites but stay on the page
  $scope.$watch(
      function (scope) {
          if (SharedStateService.Selected.Map != null)
              return SharedStateService.Selected.Map.MapID;
      },
      function (newValue, oldValue) {
          if (newValue != null && newValue != oldValue) {
              loadSelectedMap()
          }

      });




/******MAP EDITING ************************************************/

    //ADD CURRENT LOCATION
    $scope.getLocation = function () {
        $scope.systemMessage.text = "working...";
        $scope.systemMessage.activate();
        navigator.geolocation.getCurrentPosition(function (pos) {
            $scope.systemMessage.dismiss();
                addLocation(pos.coords);
            });
    }

    var addLocation = function (pos) {
        var siteRecord = createSiteRecord(pos.latitude, pos.longitude);
        SharedStateService.setSelected("Site", siteRecord);
        $scope.$apply(function () {
            var currentPosition = new Microsoft.Maps.Location(pos.latitude, pos.longitude);
            var marker = createMarker(pos.latitude, pos.longitude);
            if (pushpinCollection == null) {
                pushpinCollection = new Microsoft.Maps.Layer();
                $scope.mapInstance.layers.insert(pushpinCollection);
            }
            pushpinCollection.add(marker);

            $scope.mapInstance.setView({ center: currentPosition, zoom: 16 })

            if (SharedStateService.getAuthorizationState() == "CAN_EDIT")
                $scope.dialogIsShowing = true;

         
        });


    }

    var createSiteRecord = function (lat, lng) {
        var site = new Site();
        site.MapID = $scope.MapRecord.MapID;
        site.MemberID = SharedStateService.getAuthenticatedMemberID();
        site.Latitude = lat;
        site.Longitude = lng;
        return site;
    }

    var createMarker = function (latitude, longitude) {
        var loc = new Microsoft.Maps.Location(latitude, longitude)
        var pin = new Microsoft.Maps.Pushpin(loc, { anchor: (17, 17), enableHoverStyle: true, draggable: false });
        return pin;
    }

    $scope.dismiss = function () {
        $scope.dialogIsShowing = false;
    }

    $scope.saveCurrentLocation = function () {
        $location.path("/Site");
    }

    setView = function () {
        SharedStateService.setSelected("Site", $scope.MapRecord.Sites[0]);
    }

  // CLICK TO ADD LOCATION
    $scope.enterEdit = function () {
        // add crosshair cursor
        $scope.selectedState.editSelected = true;
       // angular.element("#bingMapRaw").style.cursor = "crosshair";
     clickHandler =   Microsoft.Maps.Events.addHandler($scope.mapInstance, "click", function (e) {

            if (e.targetType === "map") {
                // Mouse is over Map
                var loc = e.location;
                addLocation(loc)
                exitEdit();
            } else {
                // Mouse is over Pushpin, Polyline, Polygon
              
            }
        });
    }

    var exitEdit = function () {
        $scope.selectedState.editSelected = false;
        Microsoft.Maps.Events.removeHandler(clickHandler);
    }

    $scope.geocodeAddress = function () {
        var geocoder = SharedStateService.geocoder;
        var address = $scope.searchAddress;
        var resultsMap =  SharedStateService.googleMap;
        geocoder.geocode({ 'address': address }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK)
            {
                var lat = results[0].geometry.location.lat();
                var lng = results[0].geometry.location.lng();
                var siteRecord = $scope.createSiteRecord(lat, lng);
                siteRecord.Address = results[0].formatted_address;
                SharedStateService.setSelected("Site", siteRecord);
                resultsMap.setCenter(results[0].geometry.location);
                resultsMap.setZoom(13);
                var marker = new google.maps.Marker({
                    map: resultsMap,
                    position: results[0].geometry.location
                });
                if (SharedStateService.readOnlyUser == false)
                $scope.dialogIsShowing = true;
                angular.element('#accordion .in').collapse('hide');
                $scope.$apply();
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }








    // the kickoff

     afterLoaded();

    if($scope.Capabilities.cantResize == false)
        $window.addEventListener("resize", redraw)

}); 