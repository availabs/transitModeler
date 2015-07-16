'use strict'
/**
 * Datasources Store
 * /api/models/Datasource.js
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,

    assign = require('object-assign'),

    ActionTypes = Constants.ActionTypes,
    CHANGE_EVENT = 'change',
    SailsWebApi = require('../utils/sailsWebApi'),

    //-----------------------------------------
    TripTableStore = require('./TripTableStore'),
    JobStore = require('./JobStore'),
    //--Store Globals--------------------
    _currentACS = null,
    _currentCTPP = null,
    _DataSets = {
      acs:{},
      ctpp:{},
      gtfs:{}
    },
    _refresh = false,
    _lastjob = '',
    _loading = false;


function _addDatasets(rawData){

  rawData.forEach(function(ds){
      if(ds.settings[0]){
        ds.settings = ds.settings[0];
      }
      _DataSets[ds.type][ds.id] = ds;

  });

  Object.keys(_DataSets).forEach(function(source){
    if(Object.keys(_DataSets[source])[0]){
      var tableName = _DataSets[source][Object.keys(_DataSets[source])[0]].tableName;
      TripTableStore.setDatasource(source,tableName);
    }
  });
}



var DatasourcesStore = assign({}, EventEmitter.prototype, {

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },
  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  refresh : function(){
    var jobs = JobStore.getType('clone gtfs');
    var newestjob = '';
    if(jobs.length === 0){
      _refresh = false;
    }
    else if(jobs.length === 1){
      _refresh = !_refresh && jobs[0].isFinished;
      newestjob = jobs[jobs.length-1].id;
    }
    else{
      _refresh = !_refresh && jobs.reduce(function(p,c){return p.isFinished && c.isFinished;});
      newestjob = jobs[jobs.length-1].id;
    }
    if(_refresh && newestjob !== _lastjob){
      SailsWebApi.read('datasource');
      _lastjob = newestjob;
    }
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  get: function(type,id) {
    return _DataSets[type][id];
  },

  getAll: function() {
    this.refresh();
    return _DataSets;
  }

});

DatasourcesStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  //console.log('action happening',action);

  switch(action.type) {

    case ActionTypes.RECEIVE_DATASOURCES:
      _addDatasets(action.data);
      DatasourcesStore.emitChange();
    break;

    case ActionTypes.REFRESH_DATASOURCES:
      _refresh = true;
      DatasourcesStore.emitChange();
    break;
    default:
      // do nothing
  }

});

module.exports = DatasourcesStore;
