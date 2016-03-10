/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

module.exports = {

  getTracts: function(aid,rid,excludes) {

    AppDispatcher.handleViewAction({
      type: ActionTypes.REQUEST_NEW_TRACTS,
      agency: aid,
      route : rid,
      exclude: excludes, 
    });

  },

  removeRoute : function(aid,rid){
      AppDispatcher.handleViewAction({
	  type:ActionTypes.REMOVE_GEO_ROUTE,
	  agency: aid,
	  route: rid,
      });
  },

};
