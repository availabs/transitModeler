'use strict';

// - Store Boilerp[late]
var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),
    ActionTypes = Constants.ActionTypes,
    CHANGE_EVENT = 'change',

    //utils
    SailsWebApi = require('../utils/sailsWebApi'),
    CrossCtpp = require('../utils/src/crossCtpp'),
    CrossLodes = require('../utils/src/crossLodes'),

    _currentID = null,
    _marketAreas = {},
    _ctppData = {},
    _lodesData = {},
    _nullMarketArea = {name:''};



function _addMarketAreas(rawData) {
  //console.log('stores/marketareaStore/_addMarketAreas',rawData);
  rawData.forEach(function(marketarea) {
    //if (!_marketAreas[marketarea.id]) {
      _marketAreas[marketarea.id] = marketarea;
    //}
  });
  if(_currentID){
    _loadCurrentRouteGeo();
  }
};

function _setCurrentMarketarea(id){
  _currentID = id;
  if(_marketAreas[_currentID] && !_marketAreas[_currentID].routesGeo){
    _loadCurrentRouteGeo();
  }
}

function _loadCurrentRouteGeo(){
  SailsWebApi.getRoutesGeo(_currentID,_marketAreas[_currentID].origin_gtfs,_marketAreas[_currentID].routes)
}

var MarketAreaStore = assign({}, EventEmitter.prototype, {

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
    //console.log('stores/marketareaStore/get',id,_marketAreas[id],_marketAreas);
    return _marketAreas[id];
  },

  getCurrentMarketArea : function(){

    return _marketAreas[_currentID];

  },

  getCurrentMarketAreaTracts : function(){

    return GeodataStore.getMarketAreaTracts();

  },

  getCurrentMarketAreaId : function(){

    return _currentID;

  },

  getCurrentCtpp : function(){
    if(_currentID && _currentID > 0){

        if(_ctppData[_currentID] && _ctppData[_currentID] !== 'loading'){

          CrossCtpp.init(_ctppData[_currentID])
          return CrossCtpp;

        }else if(_ctppData[_currentID] !== 'loading'){
            SailsWebApi.getCtpp(_currentID);
            _ctppData[_currentID] = 'loading'
            return {initialized:false};

        }else{
            //still loading
            return {initialized:false};
        }
    }
    else{ return {initialized:false}; }

  },

  getCurrentLodes : function(){
    if(_currentID && _currentID > 0){

        if(_lodesData[_currentID] && _lodesData[_currentID] !== 'loading'){
          console.log('init crosslodes',_currentID)
          CrossLodes.init(_lodesData[_currentID])
          return CrossLodes;

        }else if(_lodesData[_currentID] !== 'loading'){
            SailsWebApi.getLodes(_currentID);
            _lodesData[_currentID] = 'loading'
            return {initialized:false};

        }else{
            //still loading
            return {initialized:false};
        }
    }
    else{ return {initialized:false}; }

  },

  getAll: function() {
    return _marketAreas;
  }



});

MarketAreaStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.RECEIVE_MARKETAREAS:
      //console.log('RECEIVE_MARKETAREAS',action.data)
      _addMarketAreas(action.data);
      MarketAreaStore.emitChange();
    break;

    case ActionTypes.SET_CURRENT_MARKETAREA:
      _setCurrentMarketarea(action.marketareaID);
      MarketAreaStore.emitChange();
    break;

    case ActionTypes.DELETE_MARKETAREA:
      delete _marketAreas[action.Id];
      MarketAreaStore.emitChange();
    break;


    case ActionTypes.RECEIVE_GTFS_GEOS:
      if(_marketAreas[action.Id]){ //ignore routes from new marketarea
        _marketAreas[action.Id].routesGeo = action.data;
        MarketAreaStore.emitChange();
      }
    break;

    case ActionTypes.RECEIVE_CTPP_DATA:
        //console.log('MarketAreaStore / RECEIVE_CTPP_DATA',action);
        _ctppData[action.marketareaId] = action.rawData;

        MarketAreaStore.emitChange();
    break;

     case ActionTypes.RECEIVE_LODES_DATA:
        //console.log('MarketAreaStore / RECEIVE_LODES_DATA',action);
        _lodesData[action.marketareaId] = action.rawData;

        MarketAreaStore.emitChange();
    break;

    case ActionTypes.DELETE_DATASOURCE: //when a datasource has been deleted
                                        //refresh marketareas just in case
      SailsWebApi.read('marketarea');
    break;


    default:
      // do nothing
  }

});

module.exports = MarketAreaStore;
