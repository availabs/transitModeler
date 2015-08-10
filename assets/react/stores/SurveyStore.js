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
    _surveys = {},
    MarketAreaStore = require('./MarketAreaStore'),
    _crossSurvey = require('../utils/src/crossSurvey');





var SurveyStore = assign({}, EventEmitter.prototype, {

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

  getGeo: function(maId) {
    console.log('SurveyStore get',maId);
    if(maId){
      if(_surveys[maId] && _surveys[maId] !== 'loading'){
        return _surveys[maId];
      }else if(!_surveys[maId]){
        console.log('loading ',maId);
        sailsWebApi.loadSurvey(maId);
        _surveys[maId] = 'loading';
      }
    }
    return {type:'FeatureCollection',features:[]};
  },

  getData:function(maId){
    if(!_surveys[maId] || _surveys[maId] === 'loading'){ //if current data isn't loaded
      _crossSurvey.initialized = false;
    }
    if(_surveys[maId] && _surveys[maId]!== 'loading'){
      _initCrossSurvey(maId);
    }
    return _crossSurvey;
  }



});

function _initCrossSurvey(id){
  var ma = MarketAreaStore.get(id);
  var data = _surveys[id].features;//.filter(function(d){return ma.routes.indexOf(d.properties.busroute) >=0;});
  _crossSurvey.init(data.map(function(d){return d.properties;}));
}

SurveyStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  //console.log('action happening',action);

  switch(action.type) {

    case ActionTypes.RECEIVE_SURVEYS:
      console.log('RECEIVE_SURVEYS ',action);
      _surveys[action.Id] = action.data;
      _initCrossSurvey(action.Id);
      SurveyStore.emitChange();
    break;


    default:
      // do nothing
  }

});

module.exports = SurveyStore;
