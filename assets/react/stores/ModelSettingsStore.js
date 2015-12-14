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
    //buffers for page edits
    _currentTract = null,
    _templateModelSettings = null,
    _templates = null,
    _originalModelSettings = null,
    _tempModelSettings = null,
    _customSettingsList = null,

    //buffers for server responses
    _modelSettingsGroupNames = [],
    _modelSettingsGroups = {};

function requireModelSettings(){
  SailsWebApi.read('modelsettings');
}

function editSettings(props){
  if(!_tempModelSettings[props.geoid])
    console.log('Error Editing Model Settings');
  Object.keys(props).forEach(function(d){
    _tempModelSettings[props.geoid][d] = props[d];
  });
  _tempModelSettings[props.geoid].dirty = true;
}

function undo(live,backups){
    Object.keys(live).forEach(function(id){
      var liveFields = Object.keys(live[id]);
      var oldFields  = Object.keys(backups[id]);
      var keepFields = _.intersection(liveFields,oldFields);
      var delFields  = _.difference(liveFields,oldFields);

      keepFields.forEach(function(prop){
        live[id][prop] = backups[id][prop];
      });

      delFields.forEach(function(prop){
        delete live[id][prop];
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

  getModelSettingsList : function(){
    
    if( !_customSettingsList ){
      SailsWebApi.read('modelsettings')
      _customSettingsList = 'loading'
      return {};
    }

    if( _customSettingsList === 'loading' ){
      return {};
    }

    return _customSettingsList
  },

  getCurrentModelSettings : function(){
    if(!_currentTract || !_tempModelSettings[_currentTract])
      return {};
    return _tempModelSettings[_currentTract];
  },

});

function addData(data){
  _tempModelSettings = _tempModelSettings || {};
  _tempModelSettings[data.properties.geoid] = data.properties;
  _originalModelSettings = _originalModelSettings || {};
  if(! _originalModelSettings[data.properties.geoid])
    _originalModelSettings[data.properties.geoid] = _.cloneDeep(data.properties);
}

function addDataBatch(Group){
  _tempModelSettings = _tempModelSettings || {};
  _originalModelSettings = _originalModelSettings || {};

  Group.forEach(function(d){
    if(!_originalModelSettings[d.properties.geoid])
      _originalModelSettings[d.properties.geoid] = d.properties;
  });

  Group.forEach(function(d){
    _tempModelSettings[d.properties.geoid] = d.properties;
  });


}

function saveSettingsGroup(gname){
  Object.keys(_tempModelSettings).forEach(function(d){
    if(_tempModelSettings[d].dirty)
       _tempModelSettings[d].dirty = false;
  });
  var reqObj = {name:gname,settings:[_tempModelSettings]};
  SailsWebApi.create('modelsettings',reqObj,function(){
    requireModelSettings();
  });
}

function processModelSettingGroups(data){
  _modelSettingsGroupNames = data.map(function(d){return d.name;});
  _modelSettingsGroups = data.map(function(d){
      return {
        name:d.name,
        id: d.id,
        settings: d.settings[0],
      };
  });
}

ModelSettingsStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  //console.log('action happening',action);

  switch(action.type) {
    case ActionTypes.RECEIVE_MODELSETTINGSS:
      //console.log('RECEIVED MODEL SETTINGS',action);
      //processModelSettingGroups(action.data);
      //console.log('NAMES',_modelSettingsGroupNames,'Groups',_modelSettingsGroups);
      if(_customSettingsList === 'loading'){
        _customSettingsList = {}
      }
      action.data.forEach(function(set){
        _customSettingsList[set.id] = set;
      })
      ModelSettingsStore.emitChange();

    break;

    case ActionTypes.SET_MODELSETTINGS:
      addData(action.data);
      _currentTract = action.data.properties.geoid;
      ModelSettingsStore.emitChange();
    break;

    case ActionTypes.EDIT_MODELSETTINGS:
      editSettings(action.data);
      ModelSettingsStore.emitChange();
    break;

    case ActionTypes.ADD_MODEL_SETTINGS:
      addData(action);
    break;

    case ActionTypes.ADD_MODEL_SETTINGS_GROUP:
      addDataBatch(action.data);
    break;

    case ActionTypes.COMMIT_MODEL_EDITS:
      _originalModelSettings = {};
    break;

    case ActionTypes.UNDO_MODEL_EDITS:
      undo(_tempModelSettings,_originalModelSettings);
      ModelSettingsStore.emitChange();
    break;

    case ActionTypes.SAVE_MODELSETTINGS:
      addDataBatch(action.data.Group);
      saveSettingsGroup(action.data.Name);
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
