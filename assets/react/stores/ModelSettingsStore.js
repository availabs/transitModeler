/*globals console,require,module*/

'use strict'
/**
 * Survey Store
 *
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,

    assign = require('object-assign'),

    ActionTypes = Constants.ActionTypes,
    CHANGE_EVENT = 'change',
    SailsWebApi = require('../utils/sailsWebApi'),


    //--Store Globals--------------------
    waiting = false,
    _modelSettings = null,
    _tempModelSettings = null;

function requireModelSettings(){
  SailsWebApi.read('modelsettings');
}

var ModelSettingsStore = assign({}, EventEmitter.prototype, {

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

  getAllModelSettings : function(){
    if(!_modelSettings){
      requireModelSettings();
      waiting = true;
      return null;
    }
    return _modelSettings;
  },

  getCurrentModelSettings : function(){
    return _tempModelSettings;
  },



});

ModelSettingsStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  //console.log('action happening',action);

  switch(action.type) {
    case ActionTypes.RECEIVE_MODELSETTINGS:

    break;

    case ActionTypes.SET_MODELSETTINGS:
      _tempModelSettings = action.data;
      ModelSettingsStore.emitChange();
    break;

    case ActionTypes.SAVE_MODELSETTINGS:

    break;

    case ActionTypes.DELETE_MODELSETTINGS:

    break;

    default:
      // do nothing
  }

});

module.exports = ModelSettingsStore;
