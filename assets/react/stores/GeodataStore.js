'use strict';
/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),

    ActionTypes = Constants.ActionTypes,
    CHANGE_EVENT = 'change',

    //--Stores
    MarketareaStore = require('./MarketAreaStore'),

    //--Utils
    sailsWebApi = require('../utils/sailsWebApi.js'),
    topojson =require('topojson');

var _stateTracts = {type:'FeatureCollection',features:[]},
    _stateCounties = {type:'FeatureCollection',features:[]},
    _maTracts = {},
    _maCounties = {},
    _maRoutes = {};

var GeodataStore = assign({}, EventEmitter.prototype, {

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
  getAllTracts:function(){
    return _stateTracts;
  },
  
  getAllCounties:function(){
    return _stateCounties;
  },

  getMarketAreaTracts: function() {

    var maId = MarketareaStore.getCurrentMarketAreaId(),
        zones = MarketareaStore.getCurrentMarketArea();
    
    //if no marketarea send blank
    if(!zones){
      return {type:'FeatureCollection',features:[]};
    }
    //if cached get from cache
    if( _maTracts[maId] ){
      return _maTracts[maId]
    }
    //if not loaded send empty geojson
    if(!_stateTracts.features || _stateTracts.features.length === 0){
      return {type:'FeatureCollection',features:[]};
    }
    //otherwise filter current market area from _stateTracts and cache it
    else{
      zones =  zones.zones;         
      _maTracts[maId] = {type:'FeatureCollection',features:[]};
      
      //filter 
      _stateTracts.features.forEach(function(feat){
          if(zones.indexOf(feat.properties.geoid) !== -1){
              _maTracts[maId].features.push(feat);
          }
      })
     
    }

    return _maTracts[maId];
  },


});

GeodataStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.RECEIVE_RAW_STATE_TRACTS:
      if(action.geoType === 'tracts'){
        _stateTracts = topojson.feature(action.geoData,action.geoData.objects.tracts);
      }
      if(action.geoType === 'counties'){
        _stateCounties = topojson.feature(action.geoData,action.geoData.objects.tracts);
      }
      GeodataStore.emitChange();
    break;

    default:
      // do nothing
  }

});

module.exports = GeodataStore;
