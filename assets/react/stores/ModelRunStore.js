/*globals require,console.module*/
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

    //--Utils
    sailsWebApi = require('../utils/sailsWebApi.js'),
    crossTrips = require('../utils/src/crossTrips.js');


var _modelRuns = {},
    _runData= {},
    _activeRuns = [],
    _loadingModel = false;

function addModelRuns(rawData){

  //console.log('GTFS STORE/_addDatasets',rawData);
  _loadingModel = false;
  rawData.forEach(function(ds){
      ds.info = JSON.parse(ds.info);
      _modelRuns[ds.id] = ds;
  });
}

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
  },

  addActiveModelRun : function(id){
    if(_activeRuns.indexOf(id) === -1){
      _activeRuns.push(id);
      _runData[id] = 'loading';
      _loadingModel = true;
      console.time('model load');
      sailsWebApi.getModelRun(id,function(){console.timeEnd('model load');});
      ModelRunStore.emitChange();
    }
  },

  delActiveModelRun : function(id){
    var ix = _activeRuns.indexOf(id);
    if(ix >=0){
      _activeRuns.splice(ix,1);
      _runData[id] = null;
      ModelRunStore.emitChange();
    }
  },

  getActiveModelRuns : function(){

    var loading = false;
    _activeRuns.forEach(function(runId){
      if( _runData[runId] === 'loading' ) { loading = true; }
      if(crossTrips.loadedModels.indexOf(runId) === -1 && _runData[runId] !== 'loading'){
        if(!crossTrips.initialized){
          //console.log('init crosstrips',runId);
          crossTrips.init(_runData[runId],runId);
        }else{
          //console.log('add crosstrips',runId);
          crossTrips.addRun(_runData[runId],runId);
        }
      }
    });

    crossTrips.loadedModels.forEach(function(runId){
      if(_activeRuns.indexOf(runId) === -1){
        //console.log('remove crosstrips',runId);
        crossTrips.removeRun(runId);
      }
    });
    //console.log('getActiveModelRuns',loading)
    _loadingModel = loading;
    crossTrips.loading = _loadingModel;
    return crossTrips;
  },

  delActiveModels : function(){

    _activeRuns.forEach(function(id){ //set all the run data to null
      _runData[id] = null;
    });
    _activeRuns = []; //get rid of all the known ids;
    ModelRunStore.emitChange();

  },


});

ModelRunStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {


    case ActionTypes.RECEIVE_MODEL_RUNS:
      //console.log("JOBSTORE / RECEIVE_JOBS ",action.data)
      addModelRuns(action.data);
      ModelRunStore.emitChange();
    break;

    case ActionTypes.RECEIVE_FULL_MODEL_RUNS:
      _runData[action.Id] = action.data;
      //console.log('ModelRunStore / RECEIVE_FULL_MODEL_RUNS',action,_runData);
      ModelRunStore.emitChange();

    break;

    case ActionTypes.DEL_ACTIVE_MODEL_RUN:
      ModelRunStore.delActiveModelRun(action.id);
    break;

    case ActionTypes.DEL_ACTIVE_MODEL_RUNS:
      ModelRunStore.delActiveModels();
    break;

    case ActionTypes.ADD_ACTIVE_MODEL_RUN:
      ModelRunStore.addActiveModelRun(action.id);
    break;

    case ActionTypes.UPDATE_MODEL:
      sailsWebApi.update('triptable/update',action.data,function(data){
        console.log('RESPONSE DATA',data);
        sailsWebApi.getModelRuns();
      });
    break;

    default:
      // do nothing
  }

});

module.exports = ModelRunStore;
