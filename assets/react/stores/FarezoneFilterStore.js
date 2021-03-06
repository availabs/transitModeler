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
    MarketAreaStore = require('./MarketAreaStore'),
    waiting = false,
    _filterSets = {},
    _currentFilterSet = {};


function requireFilters(maid){

  SailsWebApi.read({type:'farezonefilter',options:{
    where:'{"maid":'+maid+'}',
    sort:'id%20ASC'}});
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
  marketAreaWait : function(){
    var scope = this;
    return function(){
      var ma = MarketAreaStore.getCurrentMarketArea();
      if(ma){
        waiting = true;
        requireFilters(ma.id);
        MarketAreaStore.removeChangeListener(scope.marketAreaWait());
      }
    };
  },
  getFarezoneFilters : function(){
    var scope = this;
    var ma= MarketAreaStore.getCurrentMarketArea();
    if(!ma){
      MarketAreaStore.addChangeListener(scope.marketAreaWait());
      return [];
    }

    if(_filterSets[ma.id] && Object.keys(_filterSets[ma.id]).length > 0){
      waiting = false;
      console.log('farezoneFiltersets',_filterSets[ma.id]);
      return _filterSets[ma.id];
    }else if(!waiting && ma.id ){
      waiting = true;
      requireFilters(ma.id);
      return [];
    }else{
      return [];
    }
  },

  curretZoneFilters : function(){
    return _currentFilterSet;
  },

});

function saveFilter(filter){
  if(!filter.id || filter.id < 0){
    console.log('CREATING FILTER');
    delete filter.id;
    SailsWebApi.create('farezonefilter',filter,function(){
      requireFilters(filter.maid);
    });
  }
  else if(filter.id && filter.id >= 0){
    console.log('UPDATING FILTER');
    SailsWebApi.update('farezonefilter',filter,function(){
      requireFilters(filter.maid);
    });
  }
}

function setFilters(filters){
  var ma = MarketAreaStore.getCurrentMarketArea();
  if(!ma)
    return console.log('FAREZONE FILTER ADDS: error - no market area');
  _filterSets[ma.id] = filters;
  return true;
}

FarezoneFilterStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  //console.log('action happening',action);

  switch(action.type) {

    case ActionTypes.SET_FAREZONEFILTER:
      //console.log('Got filter list');
      _currentFilterSet = action.data;
    break;

    case ActionTypes.SAVE_FAREZONEFILTER:
      //console.log('saving farezone filter',action.data);
      //save the data;
      saveFilter(action.data);
    break;
    case ActionTypes.RECEIVE_FAREZONEFILTERS:
      //console.log('Receive farezone filters',action.data);
      var worked = setFilters(action.data);
      if(worked)
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
