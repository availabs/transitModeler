/*globals require,module,console*/
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
    newModelOptions = require('../utils/src/newModelOptions.js');


var _currentSettings = {
      time:'am',
      type:'ctpp',
      od:'bus',
      forecast:'current',
      tract_forecasts:{
        population:{},
        employment:{}
      },
      forecastType:'mpo',
      regressionId:null,
      datasources:{
        // datasources get loaded and set
        // in Datasource Store
        acs:null,
        ctpp:null,
        gtfs:null
      },
      marketarea: MarketareaStore.getCurrentMarketArea()
    },
    _currentTripTable = {tt:[],failed:[]},
    _finishedList = {},
    _tableStore = {},
    _modelRuns = {},
    _mode = 'Origin';

function addModelRuns(rawData){

  //console.log('GTFS STORE/_addDatasets',rawData);

  rawData.forEach(function(ds){
      _modelRuns[ds.id] = ds;
  });
}

function addTable(data,id){
  _tableStore[id] = data;
}

var TripTableStore = assign({}, EventEmitter.prototype, {

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

  setDatasource:function(type,id){
    _currentSettings.datasources[type] = id;
    TripTableStore.emitChange();
  },

  getCurrentTripTable:function(){
    return _currentTripTable;
  },

  getCurrentSettings: function() {
    return _currentSettings;
  },
  getSettings : function(id){
    if(_tableStore[id])
      return _tableStore[id];
    else{
      sailsWebApi.get('triptable',id);
    }
  },
  getOptions:function(){
    return newModelOptions;
  },

  getMode:function(){
    return _mode;
  }

});



TripTableStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.SET_NEW_MODEL_OPTION:
      _currentSettings[action.option] = action.value;
      TripTableStore.emitChange();
    break;

    case ActionTypes.SET_TRIPTABLE_MODE:
      _mode = action.value;
      TripTableStore.emitChange();
    break;

    case ActionTypes.RECEIVE_TRIPTABLE_LISTS:
      //console.log('RECEIVE_TRIPTABLE_LISTS',action)
      _currentTripTable = action.data;
      TripTableStore.emitChange();
    break;

    case ActionTypes.RECEIVE_TRIPTABLES:
      action.data.info = JSON.parse(action.data.info);
      addTable(action.data,action.Id);
      TripTableStore.emitChange();
    break;


    default:
      // do nothing
  }

});

module.exports = TripTableStore;
