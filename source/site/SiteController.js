﻿angularTraveloggia.controller('SiteController', function (SharedStateService,DataTransportService,$scope,$location,$window,debounce) {

  
    var VM = this;

    // sorry this is so hideous but angular monster digests the control
    // entirely directives wont help
    $window.setDateTime = function (strDate, prop) {
        if (VM.Site == null)
            return;

        switch (prop) {
            case "Arrival":
                VM.Site.Arrival = strDate;
                break;
            case "Departure":
                VM.Site.Departure = strDate;
                break;
        }
        $scope.$apply();
    }
   


    VM.Site = SharedStateService.Selected.Site;

    if (VM.Site == null) {
        var siteID = SharedStateService.getSelectedID("Site");
        if(siteID != null && siteID != "null")
        DataTransportService.getSiteByID(siteID).then(
            function (result)
            {
                VM.Site = result.data;
            },
            function (error)
            {
                $scope.systemMessage.text = "error reloading site data"
                $scope.systemMessage.activate();
            })


    }

    $scope.stateMachine = {
        state: SharedStateService.getAuthorizationState()
    }
 


    VM.saveSite = function () {
        if (VM.Site.SiteID == null)
            VM.addSite();
        else
            VM.updateSite();
    }
 

    VM.addSite = function () {
        DataTransportService.addSite(VM.Site).then(
        function (result) {
            var cachedSites = SharedStateService.Repository.get('Sites');
            cachedSites.push(result.data);
            SharedStateService.Repository.put('Sites', cachedSites);

            var cachedMap = SharedStateService.Repository.get("Map");

            SharedStateService.setSelected("Site", result.data);
            // invalidate cache of child records
            SharedStateService.Repository.put('Photos', []);
            SharedStateService.Repository.put('Journals', []);
            $scope.systemMessage.text = "Location saved successfully"
            $scope.systemMessage.activate();
            $location.path("/Album");
        },
        function (error) {
            $scope.systemMessage.text = "Error saving location";
            $scope.systemMessage.activate();
        }
        );
    }


    VM.updateSite = function () {
        DataTransportService.updateSite(VM.Site).then(
                     function (result) {
                         $scope.systemMessage.text = "Location edits saved successfully";
                         $scope.systemMessage.activate();
                     },
                     function (error) {
                         $scope.systemMessage.text = "Error saving location";
                         $scope.systemMessage.activate();
                         //to do log error
                     }
         );
    }


    VM.deleteSite = function () {
        DataTransportService.deleteSite(VM.Site.SiteID).then(
            function (result) {
                SharedStateService.deleteFromCache("Sites", "SiteID", VM.Site.SiteID);
                SharedStateService.setSelected("Site",null)
                $scope.systemMessage.text = "Location deleted successfully";
                $scope.systemMessage.activate();
                VM.Site = null;
            },
            function (error) {
                $scope.systemMessage.text = "Error deleteing location";
                $scope.systemMessage.activate();
            }

            )
    }

    VM.openURL = function () {
        if(VM.Site != null && VM.Site.URL != null)
        $window.open(VM.Site.URL)
    }


    $scope.$watch(
       function (scope) {
           if (SharedStateService.Selected.Site != null)
               return SharedStateService.Selected.Site.Latitude;
       },
       function (newValue, oldValue) {
           if (newValue != null && newValue != oldValue) {
               VM.Site = SharedStateService.Selected.Site;
           }
       });

})