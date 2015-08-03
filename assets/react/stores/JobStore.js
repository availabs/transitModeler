/*globals require,module*/
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

var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'change';
var SailsWebApi = require('../utils/sailsWebApi');

var _history = [],
    _allJobs = [],
    _loading = false;



function _addJobs(rawData){

  //console.log('GTFS STORE/_addDatasets',rawData);

  rawData.forEach(function(ds){
      _allJobs[ds.id] = ds;
  });
}

function _addHistory(rawData){
    _history = rawData;
}


var JobStore = assign({}, EventEmitter.prototype, {

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
    return _allJobs[id];
  },

  getAll: function() {
    return _history;
  },

  getType: function(type) {
    return _allJobs.filter(function(d){
        return d.type===type;
    });
  },

  getActive:function(){
    return _allJobs.filter(function(d){
      return !d.isFinished;
    });
  }


});

JobStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.RECEIVE_ACTIVE_JOBS:
        //console.log("JOBSTORE / RECEIVE_JOBS ",action.data)
      _addJobs(action.data);
      JobStore.emitChange();
    break;
    case ActionTypes.RECEIVE_JOBS:
      _addHistory(action.data);
      JobStore.emitChange();
    break;
    default:
      // do nothing
  }

});

module.exports = JobStore;
