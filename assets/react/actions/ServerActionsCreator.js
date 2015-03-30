/**
 * Server Actions
 *
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

module.exports = {

  //-----------------------------------
  // Market Area
  //-----------------------------------
  receiveMarketAreas: function(marketareas) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_RAW_MARKETAREAS,
      marketareas: marketareas
    });
  },

  receiveCreatedMessage: function(createdMessage) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_RAW_CREATED_MESSAGE,
      rawMessage: createdMessage
    });
  },
  
  //-----------------------------------
  // GeoData
  //-----------------------------------
  receiveStateTracts:function(data){
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_RAW_STATE_TRACTS,
      geoData: data
    });
  },
  //-----------------------------------
  // Data Sources
  //-----------------------------------
  receiveRawCensus:function(marketareaId,year,rawData){
    
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_RAW_CENSUS_DATA,
      marketareaId: marketareaId,
      year:year,
      rawData:rawData
    });

  },
  receiveCtpp:function(marketareaId,rawData){
    
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_CTPP_DATA,
      marketareaId: marketareaId,
      rawData:rawData
    });

  },


  //------------------------------------
  // User
  //------------------------------------

  setSessionUser:function(data){
    AppDispatcher.handleServerAction({
      type: ActionTypes.SET_SESSION_USER,
      user:data
    })
  },
  
  //------------------------------------
  // CRUD Handlers
  //------------------------------------

  receiveData: function(type,data) {
    
    //handles Create,Read & Update
    var actiontype = 'RECEIVE_'+type.toUpperCase()+'S';
    ///console.log(actiontype,data);

    AppDispatcher.handleServerAction({
      type: ActionTypes[actiontype],
      data: data
    });
  },

  receiveDataWithId: function(type,id,data) {
    //handles Create,Read & Update
    var actiontype = 'RECEIVE_'+type.toUpperCase()+'S';

    AppDispatcher.handleServerAction({
      type: ActionTypes[actiontype],
      data: data,
      Id:id
    });
  },
  
  deleteData:function(id){
    AppDispatcher.handleServerAction({
      type: ActionTypes.DELETE_USER,
      Id: id
    });
  }

};
