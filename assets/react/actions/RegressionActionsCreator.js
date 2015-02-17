/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher'),
	Constants = require('../constants/AppConstants'),
	
	// --- Server API
    sailsWebApi = require('../utils/sailsWebApi.js');

var ActionTypes = Constants.ActionTypes;

module.exports = {

  selectRegression: function(id) {
    AppDispatcher.handleViewAction({
      type: ActionTypes.SELECT_REGRESSION,
      RegressionID: id
    });
  },
  
  /*
  /Actions WILL Be Dispatched
  /Based on Server Response
  */
  createRegression: function(data){
    
    sailsWebApi.createRegression(data);
  },
  updateRegression: function(data){
    
    sailsWebApi.updateRegression(data);
  },
  deleteRegression: function(id){

    sailsWebApi.deleteRegression(id);
  
  }

};
