'use strict';
/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');
var EventEmitter = require('events').EventEmitter;

var assign = require('object-assign');

var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'change';

var _currentID = null,
    _marketAreas = {},
    _nullMarketArea = {name:''};

function _addMarketAreas(rawData) {
  console.log('stores/marketareaStore/_addMarketAreas',rawData);
  rawData.forEach(function(marketarea) {
    if (!_marketAreas[marketarea.id]) {
      _marketAreas[marketarea.id] = marketarea;
    }
  });
};

function _setCurrentMarketarea(id){
  console.log('stores/marketareaStore/_setCurrentMarketarea',id);
  _currentID = id;
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
  
  getCurrentMarketAreaId : function(){

    return _currentID;

  },

  getAll: function() {
    return _marketAreas;
  }
  

});

MarketAreaStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.RECEIVE_MARKETAREAS:
      _addMarketAreas(action.data);
      MarketAreaStore.emitChange();
    break;

    case ActionTypes.SET_CURRENT_MARKETAREA:
      _setCurrentMarketarea(action.marketareaID);
      MarketAreaStore.emitChange();
    break;
      

    default:
      // do nothing
  }

});

module.exports = MarketAreaStore;
