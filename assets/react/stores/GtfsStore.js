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
    _gftsDataSets = {}, //by gtfs ID
    _gtfsRoutesGeo={},  //by MA ID
    _gtfsStopsGeo={},   //"  "  "
    _loading = false;

function _addRoutes(id,rawData) {
  
  //console.log('stores/GtfsStore/_addRoutes',rawData);

  _gftsDataSets[id].routes = rawData;

};


function _addDatasets(rawData){

  //console.log('GTFS STORE/_addDatasets',rawData);
  
  rawData.forEach(function(ds){
    if(ds.type === 'gtfs'){
      _gftsDataSets[ds.id] = ds;
    }
  });
};


function _loadRoutes(gtfsId){
  //console.log('loading Routes')
  SailsWebApi.getGtfsRoutes(_gftsDataSets[gtfsId].tableName,gtfsId)

};

function _loadRoutesGeo(maId,gtfsId,routes){
  SailsWebApi.getRoutesGeo(maId,gtfsId,routes)
};

function _loadStopsGeo(maId,gtfsId,routes){
  SailsWebApi.getStopsGeo(maId,gtfsId,routes)
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
    return _marketAreas[id];
  },

  getRoutesGeo : function(){
    
    if( MarketAreaStore.getCurrentMarketArea() ){
        var _currentID = MarketAreaStore.getCurrentMarketArea().id;
        
        return _gtfsRoutesGeo[_currentID] ? _gtfsRoutesGeo[_currentID] : {type:'FeatureCollection',features:[]};
    }
    return {type:'FeatureCollection',features:[]}

  },

  getStopsGeo : function(){
    
    if( MarketAreaStore.getCurrentMarketArea() ){
        var _currentID = MarketAreaStore.getCurrentMarketArea().id;
        
        return _gtfsStopsGeo[_currentID] ? _gtfsStopsGeo[_currentID] : {type:'FeatureCollection',features:[]};
    }
    return {type:'FeatureCollection',features:[]}

  },
  
  getCurrentRouteList : function(){

    var getCurrentMarketArea = MarketAreaStore.getCurrentMarketArea(),
        gtfsId = getCurrentMarketArea.origin_gtfs,
        routes =  getCurrentMarketArea.routes,
        maId = getCurrentMarketArea.id;

    if(_gftsDataSets[gtfsId]){

      if(_gftsDataSets[gtfsId].routes){
        return _gftsDataSets[gtfsId].routes;
      }
      else if(!_loading){
      
        _loadRoutes(gtfsId);
        _loadRoutesGeo(maId,gtfsId,routes);
        _loadStopsGeo(maId,gtfsId,routes);
        _loading = true;
        return [];
      
      }else{
        //still loading  
        return [];
      }
      
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
        _addRoutes(action.Id,action.data);
        _loading = false
        GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_GTFS_GEOS:    
        _gtfsRoutesGeo[action.Id] = action.data
        GtfsStore.emitChange();
    break;
    
    case ActionTypes.RECEIVE_GTFS_STOPS_GEOS:
        //console.log('gtfsStore / RECEIVE_GTFS_STOPS_GEOS',action)  
        _gtfsStopsGeo[action.Id] = action.data
        GtfsStore.emitChange();
    break;


    default:
      // do nothing
  }

});

module.exports = GtfsStore;
