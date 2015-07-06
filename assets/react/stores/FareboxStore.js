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
    sailsWebApi = require('../utils/sailsWebApi'),


    //--Store Globals--------------------
    _farebox = {},
    _crossFares = require('../utils/src/crossFares');
    




var FareboxStore = assign({}, EventEmitter.prototype, {

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

  getFarebox: function(maId) {
    console.log('FareboxStore get',maId)
    if(maId){
      if(!_farebox[maId] ){
        sailsWebApi.loadFarebox(maId);
        _farebox[maId] = 'loading';
      }
    }
    
    if(!_farebox[maId] || _farebox[maId] === 'loading'){ //if current data isn't loaded
      _crossFares.initialized = false
    }
    
    return _crossFares;
   
  }

  

  

});

FareboxStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  //console.log('action happening',action);

  switch(action.type) {

    case ActionTypes.RECEIVE_FAREBOXS:
      console.log('RECEIVE_FAREBOXS ',action)   
      _farebox[action.Id] = action.data;
      _crossFares.init( action.data );
      FareboxStore.emitChange();
    break;


    default:
      // do nothing
  }

});

module.exports = FareboxStore;