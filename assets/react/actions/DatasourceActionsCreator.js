/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

module.exports = {

  setActiveYear: function(data) {

    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_ACTIVE_DATA_YEAR,
      year: data
    });

  },

};
