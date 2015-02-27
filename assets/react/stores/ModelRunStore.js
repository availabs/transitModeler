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


var _modelRuns = {},
    _runData= {},
    _activeRuns = [];

function addModelRuns(rawData){

  //console.log('GTFS STORE/_addDatasets',rawData);
  
  rawData.forEach(function(ds){
      ds.info = JSON.parse(ds.info);
      _modelRuns[ds.id] = ds;
  });
};

var ModelRunStore = assign({}, EventEmitter.prototype, {

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
  
  getModelRuns:function(){
    return _modelRuns;
  }


});

ModelRunStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {


    case ActionTypes.RECEIVE_MODEL_RUNS:
        //console.log("JOBSTORE / RECEIVE_JOBS ",action.data)
      addModelRuns(action.data);
      ModelRunStore.emitChange();
    break;

    default:
      // do nothing
  }

});

module.exports = ModelRunStore;
