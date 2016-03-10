/*globals require,console,module,window*/
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
    _      = require('lodash'),
    ActionTypes = Constants.ActionTypes,
    CHANGE_EVENT = 'change',
    njTractMap   = require('../../geo/states/34/tractMap.js'),
    
    //--Stores
    MarketareaStore = require('./MarketAreaStore'),
    DatasourcesStore= require('./DatasourcesStore'),
    //--Utils
    sailsWebApi = require('../utils/sailsWebApi.js'),
    Geoprocessing = require('../utils/geoprocessing'),
    topojson =require('topojson');

var countyFipsLength = 5;
var _stateTracts = {type:'FeatureCollection',features:[]},
    _stateCounties = {type:'FeatureCollection',features:[]},
    _tempCountyTracts={},
    _tempCounties={},
    _tempCountyMap={},
    _geoidMap = {},
    _maTracts = {},
    _maCounties = {},
    _loading = {},
    _tempLoading=false,
    _maRoutes = {};

function setStateSettings(tracts){
    tracts.features.forEach(function(d){
	var id = d.properties.geoid;
	if(njTractMap[id]){
	    d.properties.pop2020_growth = njTractMap[id].pop2020_growth;
	    d.properties.emp2020_growth = njTractMap[id].emp2020_growth;
	}
	else{
	    d.properties.pop2020_growth = 0;
	    d.properties.emp2020_growth = 0;
	}
    });
}

var GeodataStore = assign({}, EventEmitter.prototype, {

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
  getAllTracts:function(){
    return _stateTracts;
  },

  getAllCounties:function(){
    return _stateCounties;
  },

  purgeMarketTracts : function(id){
    var maId = id;
    if(!id){
      maId = MarketareaStore.getCurrentMarketAreaId();
    }
    delete _maTracts[maId];
  },
  getTempTracts : function(aid,rids){
    var tracts = {type:'FeatureCollection',features:[]};
    if(Object.keys(_tempCountyMap).length ===0)
      return tracts;
    var counties = rids.reduce(function(a,b){return _.union(a,_tempCountyMap[aid][b]);},[]);
    counties.filter(function(x){return _tempCountyTracts[x];}).map(function(cid){
        if(_tempCountyTracts[cid]){
          Object.keys(_tempCountyTracts[cid]).reduce(function(a,tid){
              if(!tracts.features.filter(function(d){return d.properties.geoid === tid;}).length){
                tracts.features.push(_tempCountyTracts[cid][tid]);
              }
          },[]);
        }
    });
    return tracts;
  },
  getTempCounties : function(aid,rids){
    var counties = {type:'FeatureCollection', features:[]};
    if(Object.keys(_tempCountyMap).length ===0)
      return counties;
    var countyIds = rids.reduce(function(a,b){return _.union(a,_tempCountyMap[aid][b]);},[]);

    countyIds.forEach(function(cid){
      if(_tempCounties[cid])
        counties.features.push(_tempCounties[cid]);
    });
    return counties;
  },
  getTractsNearMarketArea : function(){
    var temp = this.getMarketAreaTracts();
    if(temp.features.length > 0){
      var maId = MarketareaStore.getCurrentMarketAreaId();
      return _maTracts[maId];
    }else{
      return {type:'FeatureCollection',features:[]};
    }
  },
  getMarketAreaTracts: function() {

    var maId = MarketareaStore.getCurrentMarketAreaId(),
        datas= DatasourcesStore.getType('gtfs'),
        zones = MarketareaStore.getCurrentMarketArea();

    //if no marketarea send blank
    if(!zones ||  Object.keys(datas).length === 0){
      return {type:'FeatureCollection',features:[]};
    }
    //if cached get from cache
    if( _maTracts[maId] ){
      _loading.tracts=false;

      return {
        type:'FeatureCollection',
        features: _maTracts[maId].features.filter(function(d){return zones.zones.indexOf(d.properties.geoid) > -1;}),
      };
    }

    if(_loading.tracts){
      return {type:'FeatureCollection',features:[]};
    }
    //otherwise get the tract data from the server
    else{

      _maTracts[maId] = {type:'FeatureCollection',features:[]};

      sailsWebApi.getMAGeodata(window.User.group,maId,datas[zones.origin_gtfs].settings.agencyid);

      _loading.tracts = true;
    }

    return _maTracts[maId];
  },
  getMarketAreaCounties : function(){
    var maId = MarketareaStore.getCurrentMarketAreaId(),
    datas = DatasourcesStore.getType('gtfs'),
    zones = MarketareaStore.getCurrentMarketArea();

    if(!zones || Object.keys(datas).length === 0 ){
      return {type:'FeatureCollection',features:[]};
    }
    if( _maCounties[maId] ){
      _loading.county = false;
      return _maCounties[maId];
    }

    if(_loading.counties){
      return {type:'FeatureCollection',features:[]};
    }

    else{
      _maCounties[maId] = {type:'FeatureCollection',features:[]};

      sailsWebApi.getMAGeodata(window.User.group,maId,datas[zones.origin_gtfs].settings.agencyid);

      _loading.county = true;
    }
    return _maCounties[maId];
  },
});

function getGeoId(feat){
  return feat.properties.geoid;
}

function getRouteCounties(aid,rid){
  var ids = _tempCountyMap[aid][rid];
  return ids.map(function(id){return _tempCounties[id];});
}

function receiveTracts(data){
  var Tracts = topojson.feature(data,data.objects.objs);

  Tracts.features.forEach(function(tract){
    var cid = tract.properties.geoid.substr(0,countyFipsLength);
    _tempCountyTracts[cid] = _tempCountyTracts[cid] || {};
    if(!_tempCountyTracts[cid][tract.properties.geoid]){
      _tempCountyTracts[cid][tract.properties.geoid] = tract;
    }
  });
}
function processCounties(data,agency){
  var counties = topojson.feature(data,data.objects.objs);
  counties.features.forEach(function(county){
    var rid = county.properties.route;
    _tempCounties[county.properties.geoid] = county;
    _tempCountyMap[agency] = _tempCountyMap[agency] || {};
    _tempCountyMap[agency][rid] = _tempCountyMap[agency][rid] || [];

    if(_tempCountyMap[agency][rid].indexOf(county.properties.geoid) <0 ){
      _tempCountyMap[agency][rid].push(county.properties.geoid);
    }
  });
}

function saveAndReset(data,agency){
  _maTracts[data.id] = GeodataStore.getTempTracts(agency,data.routes); //shift temporary tracts and counties
  _maCounties[data.id] = GeodataStore.getTempCounties(agency,data.routes); //to that marketarea's data
  _tempCountyTracts={};
  _tempCounties={};
  _tempCountyMap={};
}

GeodataStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.RECEIVE_RAW_STATE_TRACTS:
      if(action.geoType === 'tracts'){
        _stateTracts = topojson.feature(action.geoData,action.geoData.objects.tracts);
      }
      if(action.geoType === 'counties'){
        _stateCounties = topojson.feature(action.geoData,action.geoData.objects.tracts);
      }
      GeodataStore.emitChange();
    break;

    case ActionTypes.REMOVE_GEO_ROUTE:
       GeodataStore.emitChange();
    break;

    case ActionTypes.RECEIVE_RAW_MA_TRACTS:

      console.log(action.type,action);
      if(action.geoType==='tracts'){
        _maTracts[action.id] = topojson.feature(action.geoData,action.geoData.objects.objs);
	setStateSettings(_maTracts[action.id]);
        receiveTracts(action.geoData);
      }

      if(action.geoType==='counties'){
        _maCounties[action.id] = topojson.feature(action.geoData,action.geoData.objects.objs);
        processCounties(action.geoData,action.agency);
      }

      GeodataStore.emitChange();
    break;

    case ActionTypes.RECEIVE_NEW_TRACTS:
      console.log(action.type);
      receiveTracts(action.data);
      GeodataStore.emitChange();
    break;

    case ActionTypes.DELETE_TRACTS:
      console.log(action.id);
      //delete _tempTracts[action.id];
      GeodataStore.emitChange();
    break;

    case ActionTypes.REQUEST_NEW_TRACTS:
      console.log(action.aid+'_'+action.rid);
      sailsWebApi.getRouteTracts(action.aid,action.rid,action.excludes);
    break;

    case ActionTypes.RECEIVE_NEW_COUNTIES:
      console.log(action.type);
      //_tempCounties[action.id] = topojson.feature(action.data,action.data.objects.objs);
      processCounties(action.data,action.agency);
      GeodataStore.emitChange();
    break;

    case ActionTypes.CREATE_MARKETAREA:
      console.log(action.type);

      sailsWebApi.create('marketarea',action.data,function(data){//after the marketrea is created
        saveAndReset(data,action.agency);
        GeodataStore.emitChange();
        action.finish(data);
      });
    break;

    case ActionTypes.UPDATE_MARKETAREA:
      console.log(action.type);

      sailsWebApi.update('marketarea',action.data,function(data){
        saveAndReset(data,action.agency);
	action.finish(data);
        GeodataStore.emitChange();

      });
    break;

    default:
      // do nothing
  }

});

module.exports = GeodataStore;
