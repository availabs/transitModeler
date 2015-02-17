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
    currentData = require('../utils/censusDataParser');

var _rawDataSets = {},
    _currentYear = 2010,
    _loading = false;

function _addCensusData(marketAreaId,year,rawData) {
  
  if(!_rawDataSets[marketAreaId]){
    _rawDataSets[marketAreaId] = {};
  }
  _rawDataSets[marketAreaId][year] = rawData;
};

function _loadData(){
  sailsWebApi.getRawCensus(MarketareaStore.getCurrentMarketAreaId(),_currentYear)
}


var CensusStore = assign({}, EventEmitter.prototype, {

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

  getCurrentInfo: function(){
    return {
      currentYear:_currentYear,
      marketareaId: MarketareaStore.getCurrentMarketAreaId()
    }
  },

  getCurrentDataSet: function() {
    var marketAreaId = MarketareaStore.getCurrentMarketAreaId();
    if(_rawDataSets[marketAreaId] && _rawDataSets[marketAreaId][_currentYear]){

        currentData.update_data(_rawDataSets[marketAreaId][_currentYear]);
        return currentData;
    
    }else if(!_loading){
      _loadData();
      _loading = true;
    }
    currentData.update_data([])
    return currentData;
  },


});

CensusStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.RECEIVE_RAW_CENSUS_DATA:
      _addCensusData(action.marketareaId,action.year,action.rawData);
      _loading = false;
      CensusStore.emitChange();
    break;

    default:
      // do nothing
  }

});

module.exports = CensusStore;
