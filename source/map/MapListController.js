﻿"use strict"
angularTraveloggia.controller("MapListController", function (SharedStateService, $scope, $location, DataTransportService, $window, $timeout) {

    $scope.selectedState = {
        addSelected: false,
        editSelected: false,
        deleteSelected:  false,
        siteSelected: false,
        facebookSelected:  false,
        emailSelected: false,
        linkSelected:false
    }
  

  
    $scope.switchMap = function (map) {
        if ($scope.selectedMap.MapID != map.MapID) {
            $scope.selectedMap = map;      
              
            localforage.setItem("MapListItem", map, function (error) {
                $scope.$apply();
                //  SharedStateService.clearMap();
            });
          
         
        }
      
    }


    $scope.switchAndGo = function (map) {
        $scope.switchMap(map);
        $scope.goMapFirstTime(map.MapID);
    }


    var getPreviewPhoto = function () {
        var pic = SharedStateService.Selected.Site.Photos[0];
        var photoURL = "http://www.traveloggia.pro/image/compass.gif";
        var rawURI = "";
        var imageServer1 = "https://s3-us-west-2.amazonaws.com";
        var imageServer2 = "http://www.traveloggia.net";
        var mapName = $scope.selectedMap.MapName;
        var safeName = $window.encodeURIComponent(mapName)
        if (pic != null) {
            var imagePath = SharedStateService.getAuthenticatedMemberID() + "/" + safeName + "/";
            if (pic.StorageURL != null) {
                rawURI = "/traveloggia-guests/" + imagePath + pic.FileName;
                photoURL = imageServer1 + rawURI;
            }
            else {
                rawURI = "/upload/" + imagePath + pic.FileName;
                photoURL = imageServer2 + rawURI;
            }
        }
        return photoURL;
    }


    $scope.sendEmail = function () {
        $window.open('mailto:?body=Sharing a link to my map http://www.traveloggia.pro?MapID='+$scope.selectedMap.MapID);
  }


    $scope.toggleLink = function () {
      $scope.selectedState.linkSelected = ($scope.selectedState.linkSelected == true) ? false : true;
  }


    $scope.facebook = function () {
        var MapID = SharedStateService.getSelectedID("Map");
        var MapName = $scope.selectedMap.MapName;
        var imageURL = getPreviewPhoto();
        var params = {};
      //  params['message'] = 'Check out my map ' + MapName;
        params['name'] = MapName;
        params['description'] = 'check out my map! ' ;
        params['link'] = 'http://www.traveloggia.pro/?MapID='+MapID;
        params['picture'] = imageURL;
        params['picture.height'] = 250;
        params['caption'] = 'made with Traveloggia';
        $window.FB.login(function (response) {
            var x = response;
            if(response.status=="connected")
            // Note: The call will only work if you accept the permission request
            $window.FB.api('/me/feed', 'post', params,
                function (response) {
                    var y = response;
                });
        }, { scope: 'publish_actions' });

        };
    


    // for blog this is why not use this horseshit  
    var getSelectedMap = function (callback) {
        localforage.getItem("Map", function (error, value) {
            if (value != null)
                $scope.selectedMap = value;
            // $scope.$apply(function () {
            callback();

            // })

        })
    }

    var loadMapList = function () {
        localforage.getItem("MapList", function (err, value) {
            var cachedMapList =value;
            if (cachedMapList == null || (cachedMapList[0].MemberID != SharedStateService.getAuthenticatedMemberID()))
                fetchMapList();
            else {
                $scope.MapList = value;
                $scope.ConfirmCancel.question = "Delete " + $scope.selectedMap.MapName + " ?";
                $scope.ConfirmCancel.ccConfirm = deleteMap;
                $scope.ConfirmCancel.ccCancel = dismiss;
                $scope.ConfirmCancel.isShowing = false;
            }
                
        })
    }


    var fetchMapList = function () {
        DataTransportService.getMapList(SharedStateService.getAuthenticatedMemberID()).then(
                    function (result) {
                        SharedStateService.setSelectedAsync("MapList", result.data);
                        $scope.MapList = result.data;
                        $scope.ConfirmCancel.question = "Delete " + $scope.selectedMap.MapName + " ?";
                        $scope.ConfirmCancel.ccConfirm = deleteMap;
                        $scope.ConfirmCancel.ccCancel = dismiss;
                        $scope.ConfirmCancel.isShowing = false;
                    },
                    function (error) {
                        $scope.systemMessage.text = "error loading maps";
                        $scope.systemMessage.activate();
                    } )
    }


    $scope.showMapEditWindow = function (action) {
        if (action == "add") {
            $scope.selectedState.addSelected = true;
            createMap();
        }
        else if (action=="edit")
            $scope.selectedState.editSelected = true;
    }


    $scope.editMap = function () {
        if  ( parseInt($scope.selectedMap.MapID) <= 6088)
        {
            $scope.systemMessage.text = "map name may not be edited";
            $scope.systemMessage.activate();
        }
        else
        $scope.showMapEditWindow("edit")
    }


    var createMap = function () {
        var anotherMap = new Map();
        anotherMap.MemberID = SharedStateService.getAuthenticatedMemberID();
        $scope.selectedMap = anotherMap;
    }


    $scope.confirmDelete=function(){
        $scope.ConfirmCancel.isShowing = true;
    }


    var dismiss = function () {
        $scope.ConfirmCancel.isShowing = false;
    }
   

    var deleteMap = function () {
       
        DataTransportService.deleteMap($scope.selectedMap.MapID).then(
            function (result) {
                SharedStateService.deleteFromCacheAsync("MapList", "MapID", $scope.selectedMap.MapID, function () {
                    $scope.$apply(function(){
                        dismiss();
                        loadMapList();
                        $scope.systemMessage.text = "map deleted successfully";
                        $scope.systemMessage.activate();
                    })
                   
                });
               
            },
            function (error) {
                $scope.systemMessage.text = "error deleting map";
                $scope.systemMessage.activate();
            })

    }



    $scope.saveMapEdit = function () {
        if ($scope.selectedMap.MapID == null) {
            $scope.selectedState.addSelected = false;
            DataTransportService.addMap($scope.selectedMap).then(
                function (result) {
                    SharedStateService.addToCacheAsync("MapList",result.data, function () {
                        SharedStateService.setSelectedAsync("Map", result.data);
                        clearMapChildren();
                        $scope.systemMessage.text = "map was added successfully";
                        $scope.systemMessage.activate();
                        $scope.goMapFirstTime();
                    })
                },
                function (error) {
                    $scope.systemMessage.text = "error adding map";
                    $scope.systemMessage.activate();
                })
        }
        else if ($scope.selectedMap.MapID != null) {
            $scope.selectedState.editSelected = false;
            DataTransportService.updateMap($scope.selectedMap).then(
                function (result) {
                    SharedStateService.setSelectedAsync("Map", $scope.selectedMap);
                    SharedStateService.updateCacheAsync("MapList", "MapID", $scope.selectedMap.MapID, $scope.selectedMap, function () {
                        loadMapList();
                        $scope.systemMessage.text = "map was updated successfully";
                        $scope.systemMessage.activate();
                    })
                },
                function (error) {
                    $scope.systemMessage.text = "error updating map";
                    $scope.systemMessage.activate();
                })
        }
    }


    $scope.cancelMapEdit = function () {
        $scope.selectedState.addSelected = false;
        $scope.selectedState.editSelected = false;
        getSelectedMap();
    }


    //kickoff
    getSelectedMap(loadMapList)


})