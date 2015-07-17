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

  selectUser: function(id) {
    AppDispatcher.handleViewAction({
      type: ActionTypes.SELECT_USER,
      userID: id
    });
  },
  
  /*
  /Actions WILL Be Dispatched
  /Based on Server Response
  */
  createUser: function(data){
    
    sailsWebApi.createUser(data);
  },
  updateUser: function(data){
    
    sailsWebApi.updateUser(data);
  },
  deleteUser: function(id){

    sailsWebApi.deleteUser(id);
  
  },
  deleteMarketArea:function(id){
    sailsWebApi.delete('marketarea',id)
  },
  deleteRegression:function(id){
    sailsWebApi.delete('regression',id)
  }

};
