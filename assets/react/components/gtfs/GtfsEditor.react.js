/*globals confirm, console,module,require,$*/
/*jshint -W097*/
'use strict';

var React = require('react'),
    Navigation = require('react-router').Navigation,
    // -- Utils
    SailsWebApi = require('../../utils/sailsWebApi'),
    Geoprocessing = require('../../utils/geoprocessing'),
    GtfsUtils    = require('./Gtfsutils'),
    StopsColl = GtfsUtils.StopsColl,
    Stops = GtfsUtils.Stops,
    Stop = GtfsUtils.Stop,
    Trip = GtfsUtils.Trip,
    Route = GtfsUtils.Route,
    Routes = GtfsUtils.Routes,
    RouteObj = GtfsUtils.RouteObj,
    EditTracker = require('./savetracker'),
    SaveObj = require('./savemod'),
    Graph = require('./miniGraph'),
    // -- Components
    GtfsEditorMap = require('./GtfsEditorMap.react'),
    GtfsSelector = require('../../components/marketarea/new/GtfsSelector.react'),
    Databox = require('./Databox.react'),
    Trips   = require('./Trips.react'),
    SaveBox = require('./SaveBox.react'),
    EditBox = require('./EditBox.react'),
    TripSchedule=require('./TripSchedule.react'),
    Download = require('./Download.react'),
    Datasources = require('./DataSourceDrop.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),
    GtfsActionsCreator       = require('../../actions/GtfsActionsCreator'),
    UserActionsCreator       = require('../../actions/UserActionsCreator'),
    // -- Stores
    MarketAreaStore          = require('../../stores/MarketAreaStore'),
    GtfsStore                = require('../../stores/GtfsStore'),
    UserStore                = require('../../stores/UserStore');
var emptyGeojson = {type:'FeatureCollection',features:[]};
var idGen = require('../utils/randomId');
var check = function(obj){
    return (obj && obj!=='loading')?obj:emptyGeojson;
};
var initStops = function(stops){
    var stopColl = new StopsColl();
    stopColl.addStops(stops);
    return stopColl;
};

var initRoutes = function(scheds){
  var routecoll = [];
  Object.keys(scheds).forEach(function(rid){
    var route = new RouteObj(),rsn = scheds[rid].shortName;
    route.setId(rid);
    route.setRouteShortName(rsn);
    routecoll.push(route);
  });
  return routecoll;
};

var arrayFind = function(arr,criterion,type){
  for(var i = 0; i < arr.length; i++){
    if(criterion(arr[i])){
      if(type==='index')
        return i;
      return arr[i];
    }
  }
};


var MarketAreaNew = React.createClass({

    getInitialState:function(){
        return {
            currentGtfs : this.props.marketarea.origin_gtfs,
            currentRoute:null,
            currentService:null,
            currentTrip:null,
            stopColl:initStops([]),
            graph:new Graph(),
            edited:false,
            tracker:new EditTracker(),
            TripObj:undefined,
            schedules:this.props.schedules || null,
            isCreating:false,
            isNewTrip:false,
            needEdit:false,
            editInfo:{},
            tripChange:true,
            routingGeo:emptyGeojson,
            deltas:[],
            lengths:[],
            routeColl:initRoutes(this.props.schedules),
            frequencies:null,
	    killFrequencies:null,
        };
    },
    editCheckConfirm : function(obj){
        if(obj.state.edited){
            var check = confirm('Are you sure you\'d like to scrap these edits?');
            if(check===true){
              this.setGtfs(this.state.currentGtfs);
              return true;
            }
            else
                return false;
        }else
            return true;
    },
    setGtfs : function(id){
      var partialState = this.getInitialState();
      partialState.currentGtfs = id;
      this.setState(partialState);
      GtfsActionsCreator.setGtfsChange(id);
    },
    setRoute:function(id){  //on route change
        if(!this.editCheckConfirm(this))
            return false;
        //reset the trip, that it has not been edited and the appropriate route
        this.setState({currentTrip: null,
          currentService:null,
          TripObj:undefined,
          edited:false,
          currentRoute:id,
          graph:new Graph(),
          editInfo:{}
          });//reset the trip
        return true;
    },
    setService : function(id){
      if(!this.editCheckConfirm(this))
        return false;
      console.log(id);
      this.setState({
                      currentService:id,
                      currentTrip: null,
                      TripObj:undefined,
                      edited:false,
                      graph:new Graph(),
                      editInfo:{},
                    });
        return true;
    },
    setTripEdit : function(){
      if(this.state.currentTrip !== null){
        var partialState = {};
        partialState.editInfo = {};
        partialState.editInfo.trip = this.state.TripObj;
        partialState.needEdit=true;
        partialState.tripChange=false;
        this.setState(partialState);
      }
    },
    setTrip:function(ix){
	var scope = this;
        if(!this.editCheckConfirm(this))
            return false;
	if(this.state.frequencies && this.state.TripObj){
	    var freqids = this.state.frequencies.filter(function(d){
		return d.edited;
	    }).map(function(d){return d.trip_id;});
	    
	    if(freqids.length > 0 ){
		freqids.forEach(function(id){
		    scope.state.TripObj.removeTripId(id);
		});
	    }
	    this.state.TripObj.isEdited = false;
	}
	
        var T = new Trip(this.state.TripObj),
        temp = this.state.schedules[this.state.currentRoute].trips[ix],
        editInfo = {};
        T.setId(temp.id);
        T.setStops(JSON.parse(JSON.stringify(temp.stops)));
        T.setRouteId(temp.route_id);
        T.setIntervals(temp.intervals);
        T.setStartTimes(temp.start_times);
        T.setStopTimes(temp.stop_times);
        T.setHeadSign(temp.headsign);
        T.setIds(temp.tripids);
        T.setServiceId(temp.service_id);
        T.setDirectionId(temp.direction_id);
        GtfsActionsCreator.setTrips(temp.tripids);
        if(this.state.isCreating){

        }
        this.state.stopColl.scrap();
        if(T.getStops().length === 0)
            this.setState({TripObj:T,
              currentTrip:ix,
	      currentRoute:this.state.currentRoute,
              currentService: this.state.currentService,
              graph:new Graph(),
              edited:true,
              isNewTrip:true,
              tracker:new EditTracker(),
              tripChange:true,
              editInfo:editInfo,
              });
        else{
            this.setState({
              TripObj:T,
              currentTrip:ix,
	      currentRoute:this.state.currentRoute,
              currentService: this.state.currentService,
              graph:new Graph(),
              edited:false,
              tripChange:true,
              tracker:new EditTracker(),
              isCreating:false,
              editInfo:editInfo,
              });
        }

        return true;
    },
    _getStop : function(id){
        if(this.state.stopColl){
          return this.state.stopColl.getStop(id);
        }
    },
    _getActiveIds:function(){
        if(this.state.TripObj)
            return this.state.TripObj.getStops();
        else
            return [];
    },
    _requestData:function(ids){
        var scope = this,
        waypoints=ids.map(function(id){
            var stp = scope._getStop(id);
            if(!stp) {
              console.log(id);
            }
            try{
                return stp.getPoint();
            }catch(e){
              console.log(id);
            }

        });
        var noStops = !waypoints.reduce(function(a,b){ return a && b;});
        if( noStops ){ //if all the stops are falsy then the stops didn't loaded
          return; //to avoid failure;
        }
        GtfsActionsCreator.setWaypoints(waypoints);
    },
    _movedStop:function(feat){//if the stop is moved, assume its already on the map
        var ids = this._getActiveIds(), tempStop = new Stop(feat);
        this._requestData(ids);

        var stop = this.state.stopColl.cloneStop(tempStop.getId());
        stop.setPoint(tempStop.getPoint());
        stop.setEdited();
        this.state.stopColl.addTemp(stop,stop.getId());
        this.setState({edited:true,stopColl:this.state.stopColl});
    },
    _buildSave:function(){
      console.log('attempted save');
      var route = this.state.routeColl.filter(function(d){
        return d.isNew || d.isEdited();
      })[0];
      if(route){
        if(route.isNew)
          this.props.marketarea.routes.push(route.getRouteShortName());
        route = route.getFeature();
      }
      var saveObj = new SaveObj(this.state.graph,
                                this.state.stopColl,
                                this.state.tracker.getEventList(),
                                this.state.deltas,
                                this.state.TripObj,
                                route);
      var reqObj = saveObj.getReqObj();
      
      if(this.state.frequencies){
        var changedFrequencies = this.state.frequencies.filter(function(d){
          return d.edited;
        });
        reqObj.frequencies = changedFrequencies;
	reqObj.killFrequencies= this.state.killFrequencies;
      }
      console.log('Request Object', reqObj);
      reqObj.maId = this.props.marketarea.id;
      reqObj.gtfsId = this.state.currentGtfs;
      return reqObj;
    },
    _cloneAndSave:function(name,fips,settings){
      var obj = {},message={};
      var reqObj = this._buildSave();
      obj.name = name;
      obj.fips=fips;
      obj.settings=settings;
      obj.savedata=reqObj;
      message.actiontitle='Created Gtfs: '+obj.name;
      message.actiondesc = obj.settings.description;
      message.maid       = this.props.marketarea.id;
      message.userid     = UserStore.getSessionUser().id;
      UserActionsCreator.userAction(message);
      GtfsActionsCreator.uploadEdit(obj);
    },
    _saveEdits:function(){
        //post edited data to the server
        var reqObj = this._buildSave();
        GtfsActionsCreator.uploadEdit(reqObj);
        this.setState({edited:false,isCreating:false}); //optimistically lock the save button
                                      // and continue
    },
    _processResponse:function(data){
        if(this.state.currentTrip === null || Object.keys(data).length === 0)
            return emptyGeojson;
        console.log(data);
        var routing_geo = data,
        graph = this.state.graph,
        emptyGraph = graph.isEmpty(),
        stops = this.state.TripObj.getStops();


        for(var i =0; i< stops.length-1; i++){//Go through the list of stops on our current route
          var point_range;
            try{
                point_range = routing_geo.getPath(i);
            }catch(err){
                console.log('errored routing',routing_geo);
            }

            var newdata = {type:'Feature',properties:{},geometry:{type:'LineString',coordinates:point_range}};
            if(emptyGraph)
                graph.addEdge(stops[i],stops[i+1],newdata);
            else
                graph.updateEdge(stops[i],stops[i+1],newdata);
        }
        this.setState({routingGeo:graph.toFeatureCollection(),lengths:routing_geo.getAllLengths(),deltas:routing_geo.getAllDeltas(),graph:graph});
    },
    cleanEdits : function(){
      var scope=this,partialState={};
      this.state.stopColl.merge(); //merge changes with the original data
      this.state.stopColl.clean(); //remove edited and new flags
      var route = this.state.routeColl.filter(function(d){
        return d.isNew || d.isEdited();
      }).forEach(function(d){
        //editing props directly to make it obvious 
	//instead of subtly through references
        d.isNew = undefined;
        d.clean();
      });
     
	partialState = this.state;
	//scrap the edit last edit tracker	
        partialState.tracker = new EditTracker(); 
        partialState.TripObj.isNew = false;
        partialState.edited = false;
	partialState.isCreating = false;
	partialState.isNewtrip = false;
	partialState.needEdit = false;
	partialState.editInfo = {};
	partialState.tripChange = true;
	partialState.killFrequencies = [];
	var temp;
	if(partialState.frequencies.length === 0)
	{
	    if(Object.keys(partialState.schedules).length === 0)
	    {
		var dataset = partialState.currentGtfs;
		partialState = scope.getInitialState();
		partialState.currentGtfs = dataset;
	    }
	    
	    //remove the trip
	    var sched = partialState.schedules[partialState.currentRoute];
	    var deadT = sched
	                .trips.splice(partialState.currentTrip,1)[0];
	    if(partialState.schedules[partialState.currentRoute]
		.trips.length === 0 )
	    {   //if no trips left in route wait
		//remove the route from the schedule
		var dataset = partialState.currentGtfs;
		delete partialState.schedules[partialState.currentRoute]; 
		partialState = scope.getInitialState();
		partialState.currentGtfs = dataset;
	    }
	    else
	    {
		
		//set the current trip to the next available
		var ix = 0
		for(var i=0; i < sched.trips.length; i++)
		{
		    if(sched.trips[i].service_id ===
			deadT.service_id)
		    {
			ix = i;
			break;
		    }
		}		
		partialState.currentTrip = ix;
		var T = new Trip(null);
		temp = sched.trips[partialState.currentTrip];
		T.setId(temp.id);
		T.setStops(JSON.parse(JSON.stringify(temp.stops)));
		T.setRouteId(temp.route_id);
		T.setIntervals(temp.intervals);
		T.setStartTimes(temp.start_times);
		T.setStopTimes(temp.stop_times);
		T.setHeadSign(temp.headsign);
		T.setIds(temp.tripids);
		T.setServiceId(temp.service_id);
		T.setDirectionId(temp.direction_id);
		partialState.TripObj = T;
		partialState.graph = new Graph();
		partialState.currentService = temp.service_id;
		SailsWebApi.getFrequencyData(temp.tripids,
					     partialState.currentGtfs);
		var ids = temp.stops;
		var waypoints = ids.map(function(id){
		    var stp = scope._getStop(id);
		    if(!stp)
		    {
			console.log(id);
		    }
		    try
		    {
			return stp.getPoint();
		    }
		    catch(e)
		    {
			console.log(id);
		    }
		});
		var noStops = !waypoints.reduce(function(a,b){return a&&b;});
		if( noStops )
		{
		    return;
		}	
		SailsWebApi.getRoutingGeo(waypoints);
	    }
	}
      this.setState(partialState);
    },
    componentDidMount : function(){
      if(this.props.marketarea){
          GtfsActionsCreator.setGtfsChange(this.props.marketarea.origin_gtfs);
      }
    },
    componentWillReceiveProps:function(nextProps){
      var scope = this;
        if(!this.props.marketarea && nextProps.marketarea){
          this.setState({currentGtfs:nextProps.marketArea.origin_gtfs});
          GtfsActionsCreator.setGtfsChange(nextProps.marketarea.origin_gtfs);
        }
        if(this.state.stopColl.getLength()===0 || ((!this.props.stopsGeo.features && nextProps.stopsGeo.features) || (nextProps.stopsGeo.features &&
             (nextProps.stopsGeo.features.length !== this.props.stopsGeo.features.length || nextProps.stopsGeo.id !== this.props.stopsGeo.id))) &&
             nextProps.stopsGeo.features.length >0 ){
            // console.log('Existing Stops',nextProps.stopsGeo.features)
            var stops = new StopsColl();
            stops.addStops(JSON.parse(JSON.stringify(nextProps.stopsGeo.features)));
            console.log('stop length',nextProps.stopsGeo.features.length);
            this.setState({stopColl:stops});
        }

        if( ((!this.props.schedules && nextProps.schedules) || ( this.props.schedules && nextProps.schedules &&
             (nextProps.schedules.id !== this.props.schedules.id) &&
             Object.keys(nextProps.schedules).length >0)) ){
            var routecoll = [];
            Object.keys(nextProps.schedules).forEach(function(rid){
              var route = new RouteObj(),rsn = nextProps.schedules[rid].shortName;
              route.setId(rid);
              route.setRouteShortName(rsn);
              routecoll.push(route);
            });
            this.setState({schedules:nextProps.schedules,routeColl:routecoll});
        }
        if(nextProps.routingGeo && Object.keys(nextProps.routingGeo).length > 0 &&
           nextProps.routingGeo.legs &&(nextProps.routingGeo.legs.length > 0) &&
           nextProps.routingGeo !== this.props.routingGeo){
            this._processResponse(nextProps.routingGeo);
          }
        // receive a response from the server about the edit push
        if(nextProps.editMessage && nextProps.editMessage !== 'loading'){

          if(nextProps.editMessage.status && nextProps.editMessage.status === 'success'){
            console.log('Data successfully uploaded');
            this.cleanEdits();
            GtfsStore.refreshEdits();
          }
          else{
            console.log('Data upload unsuccessful');
            var routes = this.props.marketarea.routes;
            this.state.routeColl.filter(function(d){return d.isNew;}).forEach(function(d){
              var ix = routes.indexOf(d.getRouteShortName());
              if(ix >=0)
                routes.splice(ix,1);
            });
            this.setState({edited:true});
          }
        }
        if(nextProps.freqMessage && nextProps.freqMessage !== 'loading'){
          if(nextProps.freqMessage.status && nextProps.freqMessage.status === 'success'){
            console.log('Frequency Data Upload Successfull');
          }else{
            console.log('Error uploading frequency data',nextProps.freqMessage);
            this.setState({edited:true});
          }
        }

        if(nextProps.frequencyData && nextProps.frequencyData !=='loading' &&
          (Object.keys(nextProps.frequencyData).length > 0) && (this.props.frequencyData !== nextProps.frequencyData)){
          this.setState({frequencies:nextProps.frequencyData});
        }
    },
    componentWillUpdate:function(nextProps, nextState){
        //if the selected trip isn't null and isnt the same as the last trip
        var stopTraj;
        if(nextState.currentTrip !== null && 
	   (nextState.currentTrip !== this.state.currentTrip) &&
	   (nextState.currentRoute !== null)
	){
            var route = nextState.schedules[nextState.currentRoute],
            trip = route.trips[nextState.currentTrip];
            stopTraj = trip.stops;
            if(trip.stops.length >= 2)
              this._requestData(stopTraj);
        }
        else if (nextState.TripObj && (nextState.TripObj !== this.state.TripObj)){
            stopTraj = nextState.TripObj.getStops();
            if(stopTraj.length >= 2)
              this._requestData(stopTraj);
        }

    },
    _refreshDatasources : function(){
      GtfsActionsCreator.refreshDatasources();
    },
    delStop : function(stopobj){
        var trip = new Trip(this.state.TripObj),
        stop = new Stop(stopobj),
        stopList = [], id = stop.getId(),
        stops = this.state.TripObj.getStops(),
        inx = stops.indexOf(id),
        victim={};

        trip.setStops(stops);

        if(inx === 0)
            stopList.push(stops[1]);
        else if(inx === stops.length-1)
            stopList.push(stops[stops.length-2]);
        else{
            stopList.push(stops[inx-1]);
            stopList.push(stops[inx+1]);
        }
        trip.removeStop(id);
        victim = this._getStop(id);
        victim.setDeleted(true);
        victim.setEdited();
        this.state.tracker.addEvent('d',{id:id,position:inx+1,data:victim});
        this.state.graph.deleteNode(id,stopList);
        this.setState({TripObj:trip,
          edited:true,
          graph:this.state.graph,
          });


        console.log('Attempted Delete',stop);
    },
    insStop : function(stopobj){

        var nStop = new Stop(stopobj),
        stops = this.state.TripObj.getStops(),
        qObj,i1,i2,i,graph,
        trip = new Trip(this.state.TripObj),
        id=nStop.getId();
        trip.setStops(stops);

        //id set in layer add
        nStop.setNew(true);
        nStop.setEdited(true);
        nStop.addRoute(this.state.TripObj.getRouteId());
        nStop.addTrip(this.state.TripObj.getId());
        graph = this.state.graph;
        qObj = graph.queryPoint(nStop.getPoint());
        graph.splitEdge(qObj.v1,qObj.v2,stopobj,qObj.position);
        i1 = stops.indexOf(qObj.v1);
        i2 = stops.indexOf(qObj.v2);
        i = Math.max(i1,i2);


        stops.splice(i,0,nStop.getId());//this edits the state object TripObj
        this.state.stopColl.addNew(nStop);
        this.setState({TripObj:trip,
            graph:graph,stopColl:this.state.stopColl,
            edited:true,
            }); //so set it
        this.state.tracker.addEvent('i',{id:id,position:i+1,data:nStop});
        return id;
    },
    _crtTrip : function(endpoints){
        console.log('Attempted Create');
        var buffStops = this.state.stopColl,
        ix = 0, scope = this,
        trip = new Trip(this.state.TripObj);
        endpoints.forEach(function(d,i){
            d.addRoute(scope.state.schedules[scope.state.currentRoute].id);
            d.setNew(true);
            buffStops.addNew(d);
            scope.state.tracker.addEvent('i',{id:d.getId(),position:i+1,data:d});
        });
        trip.setStops(endpoints.map(function(d){return d.getId();}));
        trip.setRouteId(this.state.TripObj.getRouteId());
        trip.setNew();
        trip.setServiceId(this.state.TripObj.getServiceId());
	trip.setDirectionId(0);
        trip.setIds(this.state.TripObj.getIds());

        // this.state.schedules[this.state.currentRoute].trips[this.state.currentTrip] = trip; //change trip entry in the schedule structure;
        this.setState({isNewTrip:false,stopColl:buffStops,TripObj:trip,tripChange:true,edited:true,isCreating:false});
    },
    _addRoute : function(formObj){
        if(!this.editCheckConfirm(this))
            return false;
	var id = idGen("Route"),shortname=formObj['New Route'],
        service_id = idGen('service'),
        rndmtrip,freq;
        if(this.state.schedules[id])
            return false;
        else{
          //create at least one randomly generated trip to defined this route
          rndmtrip = {
              headsign:idGen('headsign'),
              id:idGen('shape'),
              stops:[],
              intervals:[],
              route_id:id,
              start_times:[],
              stop_times:[],
              tripids:[idGen('trip')],
              service_id:service_id,
              isNew:true,
          };
          freq = this.createNewFreq(rndmtrip.tripids[0]);
            this.state.schedules[id] = {trips:[rndmtrip],id:id,service_id:service_id,shortName:shortname};
            var route = new RouteObj();
            route.setId(id);
            route.setRouteShortName(shortname);
            route.isNew = true;
            this.state.routeColl.push(route);
            this.setState({
              schedules:this.state.schedules,
              routeColl:this.state.routeColl,
              currentRoute:id,frequencies:[freq],
              currentService:service_id,
              currentTrip:0,
              isCreating:true,
              });
        }
        console.log(id);
    },
    _addFreq : function(){
	if(this.state.currentRoute && this.state.currentService && 
	   this.state.currentTrip !== null){
	    var freq_id = idGen('Trip');
	    var freq = this.createNewFreq(freq_id);
	    this.state.TripObj.addTripId(freq_id);
	    this.state.TripObj.isEdited = true;
	    var partialState= this.state;
	    partialState.frequencies = partialState.frequencies || [];
	    partialState.frequencies.push(freq);
	    partialState.edited=true;
	    this.setState(partialState);
	}
    },
    _addTrip : function(formObj){
	
        if(!this.editCheckConfirm(this)){
          return false;
        }
	
	


        var service_id = this.state.currentService,
        trip_id        = idGen('Trip'),
        headsign       = formObj.Headsign,
        shape_id       = idGen('Shape');

        if(!(service_id && trip_id && shape_id) ){
            return "All Fields Must be populated";
        }
        else{
            var schedules = this.state.schedules,freq;
            var trip = {
                headsign:headsign,
                id:shape_id,
                stops:[],
                intervals:[],
                route_id:schedules[this.state.currentRoute].id,
                start_times:[],
                stop_times:[],
                tripids:[trip_id],
                service_id:service_id,
                isNew:true,
		
            };

            var loc = schedules[this.state.currentRoute].trips.push(trip) - 1;
            var freq = this.createNewFreq(trip.tripids[0]);
	    trip.intervals.push(freq);
            this.setState({isCreating:true,routingGeo:emptyGeojson,schedules:schedules,frequencies:[freq],currentTrip:loc});
        }
    },
    editTripAction : function(trip){
        var info = this.state.editInfo;
        info.trip = trip;
        this.setState({editInfo:info,needEdit:true});
    },
    editStopAction : function(id){//
        var info = {};
        info.stop = this._getStop(id);
        this.setState({editInfo:info,needEdit:true});
    },
    changeStop : function(sInfo){
        //new stopid, stopName
        if(sInfo.stopId !== sInfo.oldId && this._getStop(sInfo.stopId)){
          return "Error Stop Exists";
        }
        var stop = this._getStop(sInfo.oldId); //get the old stop
        var buffStops = this.state.stopColl;
        var graph = this.state.graph;
        if(sInfo.stopId !== sInfo.oldId){ //if it has a different id now
          if(!stop){//add a new stop if it does not exist;
            stop = new Stop();
            buffStops.addNew(stop);
          }
          else{
            var traj = this.state.TripObj.stops;
            traj[traj.indexOf(sInfo.oldId)] = sInfo.stopId;
            graph.changeNode(sInfo.oldId,sInfo.stopId);
            stop = stop.cloneCopy(); //clone the object
          }
        }
        stop.setId(sInfo.stopId);//then set the stops info
        stop.setName(sInfo.stopName);
        stop.setStopCode(sInfo.stopCode);
        stop.setStopDesc(sInfo.stopDesc);
        stop.setZoneId(sInfo.stopZoneId);
        stop.setStopUrl(sInfo.stopUrl);
        stop.setEdited();
        buffStops.addTemp(stop,sInfo.oldId);
        if(stop.isNew()){
          var tracker = this.state.tracker;
          tracker.editEvent(sInfo.oldId,sInfo.stopId,stop);
        }
        this.setState({editInfo:{stop:stop},edited:true,stopColl:buffStops,graph:graph});
    },
    changeTrip : function(tInfo){
      var trip = this.state.TripObj;
      if(trip.getHeadSign() !== tInfo.headsign){
          trip.setHeadSign(tInfo.headsign);
          trip.isEdited = true;
          this.setState({edited:true,TripObj:trip});
      }
     if(trip.getDirectionId() !== tInfo.direction_id){
	 trip.setDirectionId(tInfo.direction_id);
	 trip.isEdited = true;
	 this.setState({edited:true,TripObj:trip});
     }
    },
    setRouteEdit : function(id){
      var info = {},route = this.state.routeColl.filter(function(d){return d.getId()===id;})[0];
      info.route = route;
      this.setState({editInfo:info,needEdit:true});
    },

    changeRoute : function(rInfo){
      var criterion = function(val){return function(d){return d.getId()===val;};};
      var route, exists = this.state.routeColl.filter(criterion(rInfo.route_id))[0];
      if(rInfo.route_id !== rInfo.oldId && exists ){
        return 'ERROR Route EXISTS';
      }
      if(rInfo.route_id !== rInfo.oldId){
        var ix = arrayFind(this.state.routeColl,criterion(rInfo.oldId),'index');
        route = new RouteObj();
        route.setOldId(rInfo.oldId);
        this.state.routeColl.splice(ix,1);//remove old route
        this.state.routeColl.push(route); //add the changed one
        this.state.schedules[rInfo.route_id] = this.state.schedules[rInfo.oldId]; //get its schedule
        this.state.schedules[rInfo.route_id].id=rInfo.route_id; //set the schedules new route id
        delete this.state.schedules[rInfo.oldId];             //delete the association with old id
      }else{
        route = exists;
      }
      if(rInfo.route_short_name !== rInfo.oldName){
        this.state.schedules[rInfo.route_id].shortName=rInfo.route_short_name;
      }
      route.setId(rInfo.route_id);
      route.setRouteShortName(rInfo.route_short_name);
      route.setRouteLongName(rInfo.route_long_name);
      route.setRouteDesc(rInfo.route_desc);
      route.setRouteType(rInfo.route_type);
      route.setRouteUrl(rInfo.route_url);
      route.setRouteColor(rInfo.route_color);
      route.setRouteTextColor(rInfo.route_text_color);
      route.setEdited();
      this.setState({edited:true,currentRoute:rInfo.route_id,schedules:this.state.schedules,routeColl:this.state.routeColl});
    },
    routeClick : function(data){
      console.log('route_click',data);
      var allowEdit = this.editCheckConfirm(this),scope = this;
      if(this.state.schedules && allowEdit){
        var tripobj,service;
        tripobj = this.state.schedules[data.route_id].trips[0];
        service = tripobj.service_id;
        this.setState({ //set the state of the route and service
                        currentRoute:data.route_id,
                        currentService:service,
                        currentTrip:null ,
                        TripObj:undefined,
                        edited:false,
                        graph:new Graph(),
                        editInfo:{},
                      },function(){scope.setTrip(0);});//once that is complete
                      //set the trip to the first one available
      }
    },
    getTrips : function(){
      var collection  = {},scope=this;
      if( this.state.currentRoute && this.state.currentService ){
        collection.id = this.state.currentRoute;
        collection.trips = this.state.schedules[this.state.currentRoute].trips
                                     .reduce(function(prev,cur,i){
                                       if(cur.service_id === scope.state.currentService)
                                          prev[i] = cur;
					  return prev;
                                     },{});
      }
      return collection;
    },
    freqChange : function(editStatus){
      if(editStatus){
        this.setState({edited:true});
      }
    },
    createNewFreq : function(tripid, initObj){
      var starttime = (initObj) ? (initObj.start || '05:30:00'): '05:30:00',
      endtime =      (initObj) ? (initObj.end || '16:00:00') : '16:00:00',
      headway =            (initObj) ? (initObj.headway || 3600) : 3600;
      var freq = {
        trip_id:tripid,
        start_time:starttime,
        end_time:endtime,
        headway_secs:headway,
        edited:true,
      };
      return freq;
    },
    componentDidUpdate : function(prevProps,prevState){
      if(this.state.tripChange && prevState.routingGeo !== this.state.routingGeo){
        this.setState({tripChange:false});
      }
    },
    deleteFreq : function(freq){
	var partialState = this.state;
	partialState.killFrequencies = partialState.killFrequencies || [];
	partialState.killFrequencies.push(freq);
	partialState.frequencies = 
	             partialState.frequencies.filter(function(d){
			 return d.trip_id !== freq.trip_id;
		     });
	partialState.edited= true;
	this.setState(partialState);
    },
    render: function() {
        var scope = this;
        var routesGeo = check(this.props.routesGeo);
        var stopsGeo;
        if(!this.state.TripObj || (this.state.stopColl.getLength() <= 0))
            stopsGeo = emptyGeojson;
        else{
            var ids = this.state.TripObj.getStops(),
            tempColl = new Stops();
            tempColl.addStops(ids.map(function(id){return scope._getStop(id);}));
            stopsGeo = tempColl.getFeatureCollection();

        }
        var gtfs = null;
        if(this.state.currentGtfs){
          gtfs = this.props.datasources[this.state.currentGtfs];
        }
        var tracts = check(this.props.tracts) ;
        var scheds = this.state.schedules || {};
        var route = this.getTrips();
        var routingGeo = this.state.routingGeo;
        var gtfsName = (this.props.datasources[this.state.currentGtfs])? this.props.datasources[this.state.currentGtfs].tableName:'';
        var colors = this.props.marketarea.routecolors;
        routesGeo.features.forEach(function(d){
           if(colors && colors[d.properties.short_name]){
             d.properties.color = colors[d.properties.short_name];
           }
        });
        return (
        	<div>
                <div className="row">
                	<div className="col-lg-9">

                        <GtfsEditorMap
                            stops={stopsGeo}
                            routes={routesGeo}
                            tracts ={tracts}
                            routingGeo={routingGeo}
                            onStopMove={this._movedStop}
                            deleteStop={this.delStop}
                            addStop={this.insStop}
                            createTrip={this._crtTrip}
                            isCreating={this.state.isNewTrip}
                            tripChange={this.state.tripChange}
                            editStop = {this.editStopAction}
                            onRouteClick={this.routeClick}/>
	                <section className='widget'>            
                          <TripSchedule
                            frequencies={this.state.frequencies}
                            deltas={this.state.deltas}
                            lengths={this.state.lengths}
	                    addFreq={this._addFreq}
	                    deleteFreq={this.deleteFreq}
                            notifyChange={this.freqChange}/>
                         </section>
                    </div>
                    <div className="col-lg-3">
                      <Datasources
                        data={this.props.datasources}
                        marketarea={this.props.marketarea}
                        setDataSource={this.setGtfs}
	                currentDataSource={this.state.currentGtfs}
	                />

                       <Databox
                           schedules = {scheds}
                           onRouteChange={this.setRoute}
                           onServiceChange={this.setService}
                           EditRoute = {this.setRouteEdit}
                           addRoute = {this._addRoute}
                           currentRoute={this.state.currentRoute}
                           currentService={this.state.currentService}/>
                        <Trips
                            route={route}
                            onTripSelect={this.setTrip}
                            currentTrip={this.state.currentTrip}
                            addTrip = {this._addTrip}
                            editTrip={this.setTripEdit}
                            editing={this.state.edited}
                            isCreating={this.state.isCreating}/>
                        <EditBox
                            schedules={this.state.schedules}
                            stopSearch={this._getStop}
                            data={this.state.editInfo}
                            saveStop={this.changeStop}
                            saveRoute={this.changeRoute}
                            saveTrip={this.changeTrip}
                            active={this.state.needEdit}/>
                       <SaveBox
                        Edited={this.state.edited}
                        onSave={this._saveEdits}
                        cloneSave={this._cloneAndSave}
                        fips={this.props.marketarea.stateFips}
                        gtfs = {gtfs}/>

                      <Download
                        tableName={gtfsName}/>
                    </div>

                </div>
        	</div>
        );
    }
});

module.exports = MarketAreaNew;
