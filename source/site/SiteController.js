﻿angularTraveloggia.controller('SiteController', function (SharedStateService,DataTransportService,$scope,$location,$window) {


    var VM = this;
   
    //  in future all the accessors to shared state, should handle requery db if empty, 
    // not the client controlers but I guess its this way because of async and having the then
    // on the controller


    VM.Site = SharedStateService.Selected.Site;

    if (VM.Site == null) {
        var siteID = SharedStateService.getSelectedID("Site");
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


    $scope.$watch(
       function (scope) {
           if (SharedStateService.Selected.Site != null)
               return SharedStateService.Selected.Site.SiteID;
       },
       function (newValue, oldValue) {
           if (newValue != null && newValue != oldValue) {
               VM.Site = SharedStateService.Selected.Site;
           }
       });

})