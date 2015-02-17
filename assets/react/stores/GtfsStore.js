'use strict'
/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');
var EventEmitter = require('events').EventEmitter;

var assign = require('object-assign');

var MarketAreaStore = require('./MarketAreaStore');
var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'change';
var SailsWebApi = require('../utils/sailsWebApi')

var _currentGtfs = null,
    _gftsDataSets = {},  
    _loading = false;

function _addRoutes(id,rawData) {
  
  console.log('stores/GtfsStore/_addRoutes',rawData);
  
  // if(!_gftsDataSets[id]){ //hopefully redundant
  //   _gftsDataSets[id] = {};
  // }

  _gftsDataSets[id].routes = rawData;

};

function _addDatasets(rawData){

  console.log('stores/GtfsStore/_addDatasets',rawData);
  
  rawData.forEach(function(ds){
    if(ds.type === 'gtfs'){
      _gftsDataSets[ds.id] = ds;
    }
  });
};

function _loadRoutes(gtfsId){
 
  SailsWebApi.getGtfsRoutes(_gftsDataSets[gtfsId].tableName,gtfsId)

};

var GtfsStore = assign({}, EventEmitter.prototype, {

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },
  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  get: function(id) {
    console.log('stores/GtfsStore/get',id,_marketAreas[id],_marketAreas);
    return _marketAreas[id];
  },

  getRoutesGeo : function(routeIds){

    return _gftsDataSets[_currentID];

  },
  
  getCurrentRouteList : function(){

    var gtfsId = MarketAreaStore.getCurrentMarketArea().origin_gtfs;
    if(_gftsDataSets[gtfsId]){

      console.log('GTFS STORE / getCurrentRouteList / gtfsid:',_gftsDataSets[gtfsId]);
      if(_gftsDataSets[gtfsId].routes){
        console.log('Do I go here?')
        return _gftsDataSets[gtfsId].routes;
      
      }
      else if(!_loading){
      
        _loadRoutes(gtfsId);
        _loading = true;
        return [];
      
      }else{
        //still loading  
        return [];
      }
      
    }else{
    
      console.log('gtfsStore / getCurrentRouteList ERROR: Invalid Data Set,',gtfsId);
    
    }
  },

  getAll: function() {
    return _gftsDataSets;
  }
  

});

GtfsStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.RECEIVE_DATASOURCES:
      
      _addDatasets(action.data);
      GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_GTFS_ROUTES:
      console.log('GTFS STORE / RECEIVE_GTFS_ROUTES / ',action)
      _addRoutes(action.Id,action.data);
      _loading = false
      GtfsStore.emitChange();
    break;

    default:
      // do nothing
  }

});

module.exports = GtfsStore;
