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
    _ = require('lodash'),
    assign = require('object-assign'),

    ActionTypes = Constants.ActionTypes,
    CHANGE_EVENT = 'change',
    SailsWebApi = require('../utils/sailsWebApi'),


    //--Store Globals--------------------
    waiting = false,
    _currentTract = null,
    _templateModelSettings = null,
    _templates = null,
    _originalModelSettings = null,
    _tempModelSettings = null;


function requireModelSettings(){
  SailsWebApi.read('modelsettings');
}

function editSettings(props){
  if(!_tempModelSettings[props.geoid])
    console.log('Error Editing Model Settings');
  Object.keys(props).forEach(function(d){
    _tempModelSettings[props.geoid][d] = props[d];
  });
}

function undo(live,backups){
    Object.keys(live).forEach(function(id){
      Object.keys(backups[id]).forEach(function(prop){
        live[id][prop] = backups[id][prop];
      });
    });
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
    if(!_currentTract || !_tempModelSettings[_currentTract])
      return undefined;
    return _tempModelSettings[_currentTract];
  },



});

ModelSettingsStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  //console.log('action happening',action);

  switch(action.type) {
    case ActionTypes.RECEIVE_MODELSETTINGS:

    break;

    case ActionTypes.SET_MODELSETTINGS:
      _tempModelSettings = _tempModelSettings || {};
      _tempModelSettings[action.data.properties.geoid] = action.data.properties;
      _originalModelSettings = _originalModelSettings || {};
      _originalModelSettings[action.data.properties.geoid] = _.cloneDeep(action.data.properties);
      _currentTract = action.data.properties.geoid;
      ModelSettingsStore.emitChange();
    break;

    case ActionTypes.EDIT_MODELSETTINGS:
      editSettings(action.data);
      ModelSettingsStore.emitChange();
    break;

    case ActionTypes.COMMIT_MODEL_EDITS:
      _originalModelSettings = {};
    break;

    case ActionTypes.UNDO_MODEL_EDITS:
      undo(_tempModelSettings,_originalModelSettings);
    break;

    case ActionTypes.SAVE_MODELSETTINGS:

    break;

    case ActionTypes.CREATE_MODELSETTING:

    break;

    case ActionTypes.DELETE_MODELSETTINGS:

    break;

    default:
      // do nothing
  }

});

module.exports = ModelSettingsStore;
