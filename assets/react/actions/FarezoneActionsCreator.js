/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

module.exports = {

  setFilter: function(filter) {
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_FAREZONEFILTER,
      data: filter
    });
  },
  saveFilter : function(data){
    AppDispatcher.handleViewAction({
      type : ActionTypes.SAVE_FAREZONEFILTER,
      data : data,
    });
  },
  setStopColors : function(colorMap){
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_FARESTOPCOLORS,
      data:colorMap,
    });
  },
};
