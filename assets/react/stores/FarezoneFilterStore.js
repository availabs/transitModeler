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
    _filterSets = {},
    _currentFilterSet = {};


function requireFilters(){
  SailsWebApi.read('farezonefilter');
}
function deleteLocalFilter(filter){
  var ix = -1;
  _filterSets.forEach(function(d,i){
    if(d.id === filter.id)
      ix = i;
  });
  if(ix >= 0)
    _filterSets.splice(ix,1); //remove filter
}
function deleteRemoteFilter(filter){
  SailsWebApi.delete('farezonefilter',filter.id);
}
var FarezoneFilterStore = assign({}, EventEmitter.prototype, {

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

  getFarezoneFilters : function(){
    if(Object.keys(_filterSets).length > 0){
      waiting = false;
      return _filterSets;
    }else if(!waiting){
      waiting = true;
      requireFilters();
      return [];
    }else{
      return [];
    }
  },

  curretZoneFilters : function(){
    return _currentFilterSet;
  },

});

FarezoneFilterStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  //console.log('action happening',action);

  switch(action.type) {

    case ActionTypes.SET_FAREZONEFILTER:
      console.log('Got filter list');
      _currentFilterSet = action.data;
    break;

    case ActionTypes.SAVE_FAREZONEFILTER:
      console.log('saving farezone filter',action.data);
      SailsWebApi.create('farezonefilter',action.data,function(){
        requireFilters();
      });
    break;
    case ActionTypes.RECEIVE_FAREZONEFILTERS:
      console.log('Receive farezone filters',action.data);
      _filterSets = action.data ;
      FarezoneFilterStore.emitChange();
    break;

    case ActionTypes.DELETE_FAREZONEFILTER:
      console.log('Delete Message',action.data);
      FarezoneFilterStore.emitChange();
    break;

    case ActionTypes.DELETE_THIS_FAREZONEFILTER:
      console.log('Deleting Farezone Filter',action.data);
      deleteLocalFilter(action.data);
      deleteRemoteFilter(action.data);
      FarezoneFilterStore.emitChange();
    break;
    default:
      // do nothing
  }

});

module.exports = FarezoneFilterStore;
