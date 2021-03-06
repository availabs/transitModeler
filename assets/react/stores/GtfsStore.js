//'use strict'
/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');
var EventEmitter = require('events').EventEmitter;

var assign = require('object-assign');

var MarketAreaStore = require('./MarketAreaStore');
var DataSourceStore = require('./DatasourcesStore');
var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'change';
var SailsWebApi = require('../utils/sailsWebApi');
var _ = require('lodash');
var _currentGtfs = null,
    _gtfsDataSets = {}, //by gtfs ID
    _gtfsRoutesGeo={},  //by MA ID
    _gtfsStopsGeo={},   //"  "  "
    _gtfsSchedules={},
    _routingData={},
    _loading = false,
    _uploadGtfs = {},
    _editResponse = null,
    _trip_ids = [],
    _frequencyData = {},
    _uFrequencyData = {},
    _frequencyEditResponse = null,
    _editGtfs = null,
    _eGtfsStopsGeo={},
    _eGtfsRoutesGeo={},
    _victimid = '';
    _editorAddedRoutes={},
    _routingWaypoints = [];

function isEmpty(obj){
  if(typeof obj ==='object'){
    for(var k in obj){
      if(obj.hasOwnProperty(k)){
        return false;
      }
    }
  }
  return true;
}

function _addRoutes(id,rawData) {

  //console.log('stores/GtfsStore/_addRoutes',rawData);

  _gtfsDataSets[id].routes = rawData;

}

function _addDatasets(rawData){

  //console.log('GTFS STORE/_addDatasets',rawData);

  rawData.forEach(function(ds){
    if(ds.type === 'gtfs'){
      _gtfsDataSets[ds.id] = ds;
    }
  });
}


function _loadRoutes(gtfsId){
  //console.log('loading Routes')
  SailsWebApi.getGtfsRoutes(_gtfsDataSets[gtfsId].tableName,gtfsId);

}

function _loadRoutesGeo(maId,gtfsId,routes){
  if(!_gtfsRoutesGeo[maId] && _gtfsRoutesGeo[maId] !== 'loading' ){
    SailsWebApi.getRoutesGeo(maId,gtfsId,routes);
    _gtfsRoutesGeo[maId] = 'loading';
  }

}

function _loadStopsGeo(maId,gtfsId,routes){
  if(!_gtfsStopsGeo[maId] && _gtfsStopsGeo[maId] !== 'loading'){
    SailsWebApi.getStopsGeo(maId,gtfsId,routes);
    _gtfsStopsGeo[maId] = 'loading';
  }
}

function _loadEditRoutesGeo(gtfsId,routes,maId){
  if( _eGtfsRoutesGeo[gtfsId] !== 'loading'){
    SailsWebApi.getEditRoutesGeo(gtfsId,routes,maId);
    _eGtfsRoutesGeo[gtfsId] = 'loading';
  }
}


function _loadEditStopsGeo(gtfsId,routes,maId){
  if(_eGtfsStopsGeo[gtfsId] !== 'loading'){
    SailsWebApi.getEditStopsGeo(gtfsId,routes,maId);
    _eGtfsStopsGeo[gtfsId] = 'loading';
  }
}

function _setEditGtfs(gtfsId){
  _editGtfs = gtfsId;
}

function _loadRouteSchedule(gtfsId,routes,maId){
  if( _gtfsSchedules[gtfsId]!=='loading'){
    SailsWebApi.getRoutesSched(gtfsId,routes,maId);
    _gtfsSchedules[gtfsId] = 'loading';
  }

}


//------RoutingData-------------------------------------
  function _loadRoutingData(waypoints){
    if(waypoints.length > 1){ //stipulate greater than 1 to avaoid error
      SailsWebApi.getRoutingGeo(waypoints);
      _routingData = 'loading';
    }
  }

  function _setWaypoints(waypts){
      _routingWaypoints = waypts;
  }
//------FrequencyData-----------------------------------
  function _loadFrequencyData(ids,gtfsId){
    if(ids.length > 0){
      SailsWebApi.getFrequencyData(ids,gtfsId);
      _frequencyData = 'loading';
    }
  }
  function _setTrips(trips){
    _trip_ids = trips;
  }

  function _setUploadFrequencyData(data){
    _uFrequencyData = data;
  }
  function _putFrequencyData(data,gtfsId){
    if(data && gtfsId){
      SailsWebApi.putFrequencyData(data,gtfsId);
      _frequencyEditResponse = 'loading';
    }
  }
//-----EditingData---------------------------------------
  function _addEditorRoutes(id){
      
  }
  function _setUploadGtfs(udata){
    _uploadGtfs = udata;
    var route = udata.route.properties.route_short_name;
    var ma = MarketAreaStore.getCurrentMarketArea();
      _resetRoutes(ma.id);
	
    if(udata.gtfsId){
      _victimid = gtfsId;
    }
  }

  function _sendDataToServer(){
      if(_uploadGtfs.name){ //this has slightly different format
          _putAndCloneGtfsData(_uploadGtfs,gtfsId);
      }else{
          _putGtfsData(_uploadGtfs,gtfsId);
      }
  }

  function _killVictimGtfs(){
      if(_victimid){
        delete  _eGtfsStopsGeo[_victimid];
        delete  _eGtfsRoutesGeo[_victimid];
        _victimid = undefined;
      }
  }
  function idCheck(id){
    if(!id){
        var ma = MarketAreaStore.getCurrentMarketArea();
        if(ma)
          id = ma.id;
    }
    return id;
  }
  //delete the routes and stops so on the next request they will be refreshed
  function _resetRoutesAndStops(id){
    id = idCheck(id);
    if(!id)
      return;
    _resetRoutes(id);
    _resetStops(id);
  }
  function _resetRoutes(id){
    id = idCheck(id);
    if(!id)
      return;
    delete _gtfsRoutesGeo[id];
    if(_gtfsDataSets[id] && _gtfsDataSets[id].routes)
	delete _gtfsDataSets[id].routes;
  }
  function _resetStops(id){
    id = idCheck(id);
    if(!id)
      return;
    delete _gtfsStopsGeo[id];
  }

  function _putGtfsData(data,gtfsId){
    if(data && gtfsId){
      SailsWebApi.putGtfsData(data,gtfsId);
      _editResponse = 'loading';
    }
  }
  function _putAndCloneGtfsData(data,gtfsId){
    if(data && gtfsId){
      SailsWebApi.putAndCloneGtfsData(data,gtfsId);
      _editResponse = 'loading';
    }
  }
  function setGtfsRoutes(id,routes){
    var ma = MarketAreaStore.getCurrentMarketArea();
    var colors;
    if(ma){
        colors = ma.routecolors;
    }
    routes.features.forEach(function(d,i){
      if(colors)
        d.properties.color = colors[d.properties.color];
      else {
        d.properties.color = '';
      }
    });
    _gtfsRoutesGeo[id] = routes;
  }
  function setStopColors(colormap){
      var ma = MarketAreaStore.getCurrentMarketArea();
    if(_gtfsStopsGeo && ma && ma.id){
	
	_gtfsStopsGeo[ma.id].features.forEach(function(d){
	    d.farecolor = colormap[parseInt(d.fare_zone).toString()] || '#fff';
	});
    }
  }
//======================================================
var GtfsStore = assign({}, EventEmitter.prototype, {

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
    return _marketAreas[id];
  },

  refreshEdits : function(){
    delete _eGtfsRoutesGeo[_editGtfs];
    delete _eGtfsStopsGeo[_editGtfs];
    delete _gtfsSchedules[_editGtfs];
    GtfsStore.emitChange();
  },

  getEditRoutesGeo : function(){
    var ma = MarketAreaStore.getCurrentMarketArea();
    if( ma ){
      if(!_editGtfs){
        return {type:'FeatureCollection',features:[]};
      }
      gtfsId = _editGtfs || ma.origin_gtfs;
      routes = ma.routes;
      //console.log('GTFS Store',gtfsId);
      if(_eGtfsRoutesGeo[gtfsId] && _eGtfsRoutesGeo[gtfsId] !=='loading' && ma.id ===_eGtfsRoutesGeo[gtfsId].maId){
        return _eGtfsRoutesGeo[gtfsId];
      }
      else if(!_eGtfsRoutesGeo[gtfsId] || ma.id !== _eGtfsRoutesGeo[gtfsId].maId){
        _eGtfsRoutesGeo[gtfsId] = _eGtfsRoutesGeo[gtfsId] || {};
        _loadEditRoutesGeo(gtfsId,routes,ma.id);
      }
      return {type:'FeatureCollection',features:[]};
    }
    return {type:'FeatureCollection',features:[]};
  },

  getEditStopsGeo : function(){
    var ma = MarketAreaStore.getCurrentMarketArea();
    if( ma ){
      if(!_editGtfs){
        return {type:'FeatureCollection',features:[]};
      }
      gtfsId = _editGtfs || ma.origin_gtfs;
      routes = ma.routes;
      //console.log('GTFS Store Stops',gtfsId);
      if(_eGtfsStopsGeo[gtfsId] && _eGtfsStopsGeo[gtfsId] !=='loading' && ma.id === _eGtfsStopsGeo[gtfsId].maId){
        return _eGtfsStopsGeo[gtfsId];
      }
      else if(!_eGtfsStopsGeo[gtfsId] || ma.id !==_eGtfsStopsGeo[gtfsId].maId){
        _eGtfsStopsGeo[gtfsId] = _eGtfsStopsGeo[gtfsId] || {};
        _loadEditStopsGeo(gtfsId,routes,ma.id);
      }
      return {type:'FeatureCollection',features:[]};
    }
    return {type:'FeatureCollection',features:[]};
  },

  getRoutesGeo : function(){
    var ma = MarketAreaStore.getCurrentMarketArea();

    if( ma ){
        var _currentID = ma.id,
        gtfsId = ma.origin_gtfs,
        routes = ma.routes;
        if(_gtfsRoutesGeo[_currentID] && _gtfsRoutesGeo[_currentID] !=='loading')
          return  _gtfsRoutesGeo[_currentID];
        else if (!_gtfsRoutesGeo[_currentID]){
          _loadRoutesGeo(_currentID,gtfsId,routes);
        }
        return {type:'FeatureCollection',features:[]};
    }
    return {type:'FeatureCollection',features:[]};
  },

  getStopsGeo : function(){
    var ma = MarketAreaStore.getCurrentMarketArea();

    if( ma ){
        var _currentID = ma.id,
        gtfsId = ma.origin_gtfs,
        routes = ma.routes;
        if(_gtfsStopsGeo[_currentID] && _gtfsStopsGeo[_currentID] !=='loading')
          return  _gtfsStopsGeo[_currentID];
        else if (!_gtfsStopsGeo[_currentID]){
          _loadStopsGeo(_currentID,gtfsId,routes);
        }

        return {type:'FeatureCollection',features:[]};
    }
    return {type:'FeatureCollection',features:[]};

  },
  getRouteSchedules : function(){

    var ma = MarketAreaStore.getCurrentMarketArea();

    if( ma ){
        gtfsId = _editGtfs || ma.origin_gtfs;
        routes = ma.routes;
        if(_gtfsSchedules[gtfsId] && _gtfsSchedules[gtfsId] !=='loading' && _gtfsSchedules[gtfsId].maId === ma.id){
            _gtfsSchedules[gtfsId].sched.id = _gtfsSchedules[gtfsId].id;
            return  _gtfsSchedules[gtfsId].sched;
        }
        else if (!_gtfsSchedules[gtfsId] || ma.id !== _gtfsSchedules[gtfsId].maId){
          _loadRouteSchedule(gtfsId,routes,ma.id);
        }
        return {};
    }
    return {};

  },
  getRoutingGeo : function(){

      if(_routingWaypoints.length === 0 && _routingData && Object.keys(_routingData).length > 0 )
        return _routingData;
      if(_routingWaypoints.length > 0){
        _loadRoutingData(_routingWaypoints); //send requrest
        _routingWaypoints = [];               //reset waypoints to empty
        return {};
      }
      return {};
  },
  getFrequencyData : function(){
    var ma = MarketAreaStore.getCurrentMarketArea(),gtfsId;
    if( !ma )
      return undefined;


    if(_trip_ids.length === 0 && _frequencyData && !isEmpty(_frequencyData))
      return _frequencyData;
    if(_trip_ids.length > 0){
      gtfsId = _editGtfs || ma.origin_gtfs;
      _loadFrequencyData(_trip_ids,gtfsId); //send requrest
      _trip_ids = [];                 //reset TripIds
      return {};
    }
    return {};
  },
  putGtfsData : function(){

    var ma = MarketAreaStore.getCurrentMarketArea(),gtfsId;

    if( !ma )
      return undefined;

    if(_editResponse){
      var retval = _editResponse;     //save the response into a temp variable
      if(_editResponse !== 'loading') //if the response has been fully recieved
        _editResponse = null;         //reset the response variable for latter
      return retval;
    }
    return undefined;
  },

  getCurrentRouteList : function(){

    var getCurrentMarketArea = MarketAreaStore.getCurrentMarketArea(),
        gtfsId = getCurrentMarketArea.origin_gtfs,
        routes =  getCurrentMarketArea.routes,
        maId = getCurrentMarketArea.id;

    if(Object.keys(_gtfsDataSets) === 0){
      _gtfsDataSets = DataSourceStore.getType('gtfs');
    }

    if(_gtfsDataSets[gtfsId]){

      if(_gtfsDataSets[gtfsId].routes){
	
        return _gtfsDataSets[gtfsId].routes
      }
      else if(!_loading){
        //console.log('load stops', maId);
        _loadRoutes(gtfsId);
        // _loadRoutesGeo(maId,gtfsId,routes);

        // _loadRouteSchedule(maId,gtfsId,routes);

      }else{
        //still loading
        return [];
      }

    }
  },
  putFrequencyData : function(){
    var ma = MarketAreaStore.getCurrentMarketArea(),gtfsId;

    if( !ma )
      return undefined;

    if(_frequencyEditResponse){
      var retval = _frequencyEditResponse;     //save the response into a temp variable
      if(_frequencyEditResponse !== 'loading') //if the response has been fully recieved
        _frequencyEditResponse = null;         //reset the response variable for latter
      return retval;
    }
    else if(!_frequencyEditResponse && Object.keys(_uFrequencyData).length > 0){
      gtfsId = ma.origin_gtfs;
      _putFrequencyData(_uFrequencyData,gtfsId);
      _uFrequencyData = {};
      return _frequencyEditResponse;
    }
    return undefined;
  },
  resetRoutesAndStop : function(){
    _resetRoutesAndStops();
  },
  resetRoutes : function(){
    _resetRoutes();
  },
  resetStops : function(){
    _resetStops();
  },
  getAll: function() {
    return _gtfsDataSets;
  }


});

GtfsStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.SET_FREQS:
        _setUploadFrequencyData(action.data);
        GtfsStore.emitChange();
    break;
    case ActionTypes.SET_WAYPOINTS:
        _setWaypoints(action.waypoints);
        GtfsStore.emitChange();
    break;

    case ActionTypes.SET_EDITOR_SAVE:
        _setUploadGtfs(action.data);
        _sendDataToServer();
    break;

    case ActionTypes.SET_TRIPS:
        _setTrips(action.data);
        GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_DATASOURCES:
      _addDatasets(action.data);
      GtfsStore.emitChange();
    break;



    case ActionTypes.RECEIVE_GTFS_EDIT_ROUTES:
        _eGtfsRoutesGeo[action.Id[0]] = action.data;
        _eGtfsRoutesGeo[action.Id[0]].id = action.Id[0];
        _eGtfsRoutesGeo[action.Id[0]].maId = action.Id[1];
        GtfsStore.emitChange();
        //console.log('ID',action.Id,'Editable Routes',_eGtfsRoutesGeo);
    break;

    case ActionTypes.RECEIVE_GTFS_EDIT_STOPS:
        _eGtfsStopsGeo[action.Id[0]] = action.data;
        _eGtfsStopsGeo[action.Id[0]].id = action.Id[0];
        _eGtfsStopsGeo[action.Id[0]].maId = action.Id[1];
        GtfsStore.emitChange();
        //console.log('ID',action.Id,'Editable Stops',_eGtfsStopsGeo);
    break;

    case ActionTypes.SET_GTFS:
        _editGtfs = action.data;
        GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_GTFS_ROUTES:
        _addRoutes(action.Id,action.data);
        _loading = false;
        GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_GTFS_GEOS:
        setGtfsRoutes(action.Id,action.data);
        GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_GTFS_STOPS_GEOS:
        //console.log('gtfsStore / RECEIVE_GTFS_STOPS_GEOS',action)
        _gtfsStopsGeo[action.Id] = action.data;
        GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_GTFS_SCHEDS:
          _gtfsSchedules[action.Id[0]] = {};
          _gtfsSchedules[action.Id[0]].sched = action.data;
          //console.log('Received Gtfs Scheds',action.id, action.data)
          _gtfsSchedules[action.Id[0]].id = action.Id[0];
          _gtfsSchedules[action.Id[0]].maId = action.Id[1];
          GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_ROUTING_GEOS:
        _routingData = action.data;
        //console.log('Received Routing Object',action.data);

        GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_EDITOR_RESPONSES:
        _editResponse = action.data;
        //console.log('Receive Upload Response:',action.data);
        //_killVictimGtfs();
        //_resetRoutesAndStops();
        
        GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_TRIP_FREQUENCIES:
        _frequencyData = action.data;
        GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_FREQ_EDIT_RESPONSES:
        _frequencyEditResponse = action.data;
        GtfsStore.emitChange();
    break;

    case ActionTypes.RECEIVE_MARKETAREAS:
    //when marketares are retreived reset the routes and stops
        _resetRoutesAndStops();
        GtfsStore.emitChange();
    break;

    case ActionTypes.UPDATE_MARKETAREA:
      //When updating a market area check if 
      //new routes were added to put into the editable routes
      
      _updateEditRoutes(action.data);
      GtfsStore.emitChange();
    case ActionTypes.SET_FARESTOPCOLORS:
      setStopColors(action.data);
    break;
    default:
      // do nothing
  }

});

function _updateEditRoutes(ma){
    if(ma && ma.routes && ma.routes.length && Object.keys(_eGtfsRoutesGeo).length > 0)
    {
	var routeMap = {};
	_gtfsRoutesGeo[ma.id].features.forEach(function(d,i){
	                   routeMap[d.properties.short_name] = i;
	               });
	var curEditRoutes = _eGtfsRoutesGeo.features
	                    .map(function(d){return d.properties.short_name});

	var candidateRoutes = _.difference(ma.routes,curEditRoutes);
	
	if(candidateRoutes.length > 0){//if there are routes not in edit
	                               //copy them from the normal bin
	    candidateRoutes.forEach(function(d){
		_eGtfsRoutesGeo.features
		    .push(_.cloneDeep(_gtfsRoutesGeo[ma.id].features[routeMap[d]]));
	    });

	    _gtfsStopsGeo[ma.id].features.forEach(function(d){
		if(candidateRoutes.indexOf(d.properties.line) >= 0)
		{
		    _eGtfsStopsGeo.features.push(_.cloneDeep(d));
		}
	    });

	    
	}
	
    }
}

module.exports = GtfsStore;
