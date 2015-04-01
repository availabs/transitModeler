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
    CHANGE_EVENT = 'change';

var _editRegressionID = null,
    _regressions = {};

function _addRegressions(rawData) {
  console.log('stores/RegressionStore/_addUsers',rawData);
  rawData.forEach(function(regression) {
    
      _regressions[regression.id] = regression;
    
  });
};

function _deleteRegression(id){
  //console.log('stores/RegressionStore/deleteuser',id)
  delete _regressions[id];
  _editRegressionID = null;
}

function _setEditID(id){
    _editRegressionID = id;
};

var RegressionStore = assign({}, EventEmitter.prototype, {

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
    return _regressions[id];
  },

  getAll: function() {
    return _regressions;
  },

  getEditUserId:function(){
    return _editRegressionID;
  },
  getSessionUser:function(){
    return _sessionUser;
  }

});

RegressionStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {


    case ActionTypes.RECEIVE_REGRESSIONS:
      _addRegressions(action.data);
      RegressionStore.emitChange();
    break;

    case ActionTypes.SELECT_REGRESSION:
      _setEditID(action.regressionId);
      RegressionStore.emitChange();
    break;

    case ActionTypes.DELETE_REGRESSION:
      _deleteRegression(action.Id);
      RegressionStore.emitChange();
    break;

    default:
      // do nothing
  }

});

module.exports = RegressionStore;
