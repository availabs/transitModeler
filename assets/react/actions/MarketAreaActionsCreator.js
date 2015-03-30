/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

module.exports = {

  setCurrentMarketArea: function(id) {
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_CURRENT_MARKETAREA,
      marketareaID: id
    });
  },

  setActiveCensusVariable: function(data) {
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_ACTIVE_CENSUS_VARIABLE,
      cen_var: data
    });
  },

};
