/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

module.exports = {

  setWaypoints: function(waypts) {
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_WAYPOINTS,
      waypoints: waypts
    });
  },
  uploadEdit : function(uploadData){
    AppDispatcher.handleViewAction({
      type : ActionTypes.SET_EDITOR_SAVE,
      data:uploadData,
    });
  },
  uploadEditFreqs : function(freqdata){
    AppDispatcher.handleViewAction({
      type : ActionTypes.SET_FREQS,
      data : freqdata,
    });
  },
  setTrips : function(tripData){
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_TRIPS,
      data:tripData
    });
  },
  setGtfsChange : function(id,ma){
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_GTFS,
      data:id,
    });
  },
  refreshDatasources : function(){
    AppDispatcher.handleViewAction({
      type: ActionTypes.REFRESH_DATASOURCES,
      data:null,
    });
  },
};
