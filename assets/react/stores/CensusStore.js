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
    _loading = false,

    _activeVariable = 'car_0';

function _addCensusData(marketAreaId,year,rawData) {

  if(!_rawDataSets[marketAreaId]){
    _rawDataSets[marketAreaId] = {};
  }
  _rawDataSets[marketAreaId][year] = rawData;
};

function _loadData(){
  if(MarketareaStore.getCurrentMarketAreaId()){
    //console.log('load census data',MarketareaStore.getCurrentMarketAreaId())
    sailsWebApi.getRawCensus(MarketareaStore.getCurrentMarketAreaId(),_currentYear)
  }
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
    };
  },

  getCurrentDataSet: function() {
    var marketAreaId = MarketareaStore.getCurrentMarketAreaId();
    if(marketAreaId && _rawDataSets[marketAreaId] && _rawDataSets[marketAreaId][_currentYear]){

        currentData.update_data(_rawDataSets[marketAreaId][_currentYear]);
        //console.log('getCurrentCensusData',marketAreaId,_rawDataSets[marketAreaId],currentData,_loading)
        return currentData;

    }else if(marketAreaId && !_loading){
      _loadData();
      _loading = true;
    }
    currentData.update_data([]);
    //console.log('getCurrentCensusData',marketAreaId,_rawDataSets[marketAreaId],currentData,_loading)
    return currentData;
  },

  getActiveVariable:function(){
    return _activeVariable;
  }

});

CensusStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.RECEIVE_RAW_CENSUS_DATA:
      //console.log('RECEIVE_RAW_CENSUS_DATA',action.rawData)
      _addCensusData(action.marketareaId,action.year,action.rawData);
      _loading = false;
      _currentYear = action.year;
      CensusStore.emitChange();
    break;

    case ActionTypes.SET_ACTIVE_CENSUS_VARIABLE:
      _activeVariable = action.cen_var;
      CensusStore.emitChange();

    default:
      // do nothing
  }

});

module.exports = CensusStore;
