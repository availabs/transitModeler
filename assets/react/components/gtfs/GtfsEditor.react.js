'use strict';

var React = require('react'),
    Navigation = require('react-router').Navigation,
    // -- Utils
    SailsWebApi = require('../../utils/sailsWebApi'),
    Geoprocessing = require('../../utils/geoprocessing'),
    GtfsUtils    = require('./Gtfsutils'),
    Stops = GtfsUtils.Stops,
    Stop = GtfsUtils.Stop,
    Trip = GtfsUtils.Trip,
    Route = GtfsUtils.Route,
    Routes = GtfsUtils.Routes,
    EditTracker = require('./savetracker'),
    SaveMod = require('./savemod'),
    Graph = require('./miniGraph'),
    // -- Components
    GtfsEditorMap = require('./GtfsEditorMap.react'),
    GtfsSelector = require('../../components/marketarea/new/GtfsSelector.react'),
    Databox = require('./Databox.react'),
    Trips   = require('./Trips.react'),
    SaveBox = require('./SaveBox.react'),
    EditBox = require('./EditBox.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),
    GtfsActionsCreator       = require('../../actions/GtfsActionsCreator');
    // -- Stores


var emptyGeojson = {type:'FeatureCollection',features:[]};

var check = function(obj){
    return (obj && obj!=='loading')?obj:emptyGeojson;;
}
var initStops = function(stops){
    var stopColl = new Stops();
    stopColl.addStops(stops);
    return stopColl;
}

var editCheckConfirm = function(obj){
    if(obj.state.edited){
        var check = confirm('Are you sure you\'d like to scrap these edits?')
        if(check===true)
            return true;
        else
            return false
    }else
        return true;
}

var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
            currentRoute:null,
            currentTrip:null,
            stopColl:initStops(this.props.stopsGeo.features),
            graph:new Graph(),
            buffStops:null,
            deltas:null,
            edited:false,
            tracker:new EditTracker(),
            TripObj:undefined,
            buffStopColl:null,
            schedules:null,
            isCreating:false,
            needEdit:false,
            editInfo:{},
            tripChange:false,
        };
    },
    setRoute:function(id){  //on route change
        if(!editCheckConfirm(this))
            return false;
        //reset the trip, that it has not been edited and the appropriate route
        this.setState({currentTrip: null,edited:false,currentRoute:id,tripChange:false});//reset the trip
        return true;
    },
    setTrip:function(ix){
        if(!editCheckConfirm(this))
            return false;
        var T = new Trip();
        T.setId(this.state.schedules[this.state.currentRoute].trips[ix].id);
        if(T.getStops().length === 0)
            this.setState({TripObj:T,currentTrip:ix,graph:new Graph(),edited:false,buffStopColl:new Stops(),isCreating:true});
        else{
            this.setState({
              TripObj:T,
              currentTrip:ix,
              graph:new Graph(),
              edited:false,
              buffStopColl:new Stops(),
              tripChange:true,
              });
        }

        return true;
    },
    _getStop : function(id,newstops){
        if(this.state.stopColl && this.state.stopColl.hasStop(id))
            return this.state.stopColl.getStop(id);
        else if(newstops){
            return newstops.getStop(id);
        }
        else if(this.state.buffStopColl && this.state.buffStopColl.hasStop(id))
            return this.state.buffStopColl.getStop(id);
    },
    _getActiveIds:function(){
        if(this.state.TripObj)
            return this.state.TripObj.getStops();
        else
            return [];
    },
    _requestData:function(ids,newstops){
        var scope = this,
        waypoints=ids.map(function(id){
            var stp = scope._getStop(id,newstops);
            if(!stp) console.log(id);
            return stp.getPoint();
        });
        GtfsActionsCreator.setWaypoints(waypoints);
    },
    _movedStop:function(){
        var ids = this._getActiveIds();
        this._requestData(ids);
        this.setState({edited:true});
    },
    _saveEdits:function(){
        console.log('attempted save');
    },
    _processResponse:function(data){
        if(this.state.currentTrip === null || Object.keys(data).length === 0)
            return emptyGeojson;;
        var routing_geo = data,
        graph = this.state.graph,
        emptyGraph = graph.isEmpty(),
        stops = this.state.TripObj.getStops(),
        deltas = this.state.deltas;
        for(var i =0; i< stops.length-1; i++){//Go through the list of stops on our current route
            try{
                var point_range = routing_geo.getPath(i);
            }catch(err){
                console.log('errored routing',routing_geo);
            }

            var data = {type:'Feature',properties:{},geometry:{type:'LineString',coordinates:point_range}}
            if(emptyGraph)
                graph.addEdge(stops[i],stops[i+1],data);
            else
                graph.updateEdge(stops[i],stops[i+1],data)
        }
        // this.setState({deltas:routing_geo.getAllDeltas()});
        var fc = graph.toFeatureCollection();
        return fc; //graph.getFeatureCollection();
    },
    componentWillReceiveProps:function(nextProps){
        if(((!this.props.stopsGeo.features && nextProps.stopsGeo.features) || (nextProps.stopsGeo.features
            && nextProps.stopsGeo.features.length !== this.props.stopsGeo.features.length))
            && nextProps.stopsGeo.features.length >0){
            console.log('Existing Stops',nextProps.stopsGeo.features)
            var stops = new Stops();
            stops.addStops(nextProps.stopsGeo.features);
            this.setState({stopColl:stops});
        }

        if( ((!this.props.schedules && nextProps.schedules) || (nextProps.schedules
            && Object.keys(nextProps.schedules).length !== Object.keys(this.props.schedules).length))
            && Object.keys(nextProps.schedules).length >0){

            this.setState({schedules:nextProps.schedules});
        }

    },
    componentWillUpdate:function(nextProps, nextState){
        //if the selected trip isn't null and isnt the same as the last trip
        if(nextState.currentTrip !== null && (nextState.currentTrip !== this.state.currentTrip)) {
            var route = this.state.schedules[this.state.currentRoute],
            trip = route.trips[nextState.currentTrip],
            stopTraj = JSON.parse(trip.id);
            if(nextState.buffStopColl !== this.state.buffStopColl)
                this._requestData(stopTraj,nextState.buffStopColl);
            else
                this._requestData(stopTraj);
        }
        else if (nextState.TripObj !== this.state.TripObj){
            stopTraj = nextState.TripObj.getStops();
            if(nextState.buffStopColl !== this.state.buffStopColl)
                this._requestData(stopTraj,nextState.buffStopColl);
            else
                this._requestData(stopTraj);
        }

    },
    delStop : function(stopobj){
        var trip = new Trip(),
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
        victim = this.state.stopColl.getStop(id);
        victim.setDeleted(true)
        victim.setEdited();
        this.state.tracker.addEvent('d',victim);
        this.state.graph.deleteNode(id,stopList)
        this.setState({TripObj:trip,
          edited:true,
          graph:this.state.graph,
          tripChange:false,
          });


        console.log('Attempted Delete',stop);
    },
    insStop : function(stopobj){
        var nStop = new Stop(stopobj),
        stops = this.state.TripObj.getStops(),
        qObj,i1,i2,i,graph,
        trip = new Trip(),
        id='';
        trip.setStops(stops);
        do{
            if(id!=='')
                alert('stop already exists');
            id = prompt('Please Enter new Stop Id');
            if( id === null)
                return;
        }while(this._getStop(id));
        nStop.setId(id);
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


        stops.splice(i,0,id);//this edits the state object TripObj
        this.state.buffStopColl.addStop(nStop);
        this.setState({TripObj:trip,
            graph:graph,buffStopColl:this.state.buffStopColl,
            edited:true,
            tripChange:false,
            }); //so set it
        this.state.tracker.addEvent('i',{id:id,position:i+1,data:nStop});
        console.log('Attempted to Add Stop',map);
        return id;
    },
    _crtTrip : function(endpoints){
        console.log('Attempted Create');
        var buffStops = new Stops(),
        ix = 0, scope = this,
        trip = new Trip();
        endpoints.forEach(function(d,i){
            d.addRoute(scope.state.schedules[scope.state.currentRoute].id);
            buffStops.addStop(d);
            scope.state.tracker.addEvent('i',{id:d.getId(),position:i+1,data:d});
        });
        trip.setStops(endpoints.map(function(d){return d.getId();}));
        trip.setRouteId(this.state.TripObj.getRouteId());
        trip.setNew();
        trip.setServiceId(this.state.TripObj.getServiceId());
        trip.setIds(this.state.TripObj.getIds());
        // this.state.schedules[this.state.currentRoute].trips[this.state.currentTrip] = trip; //change trip entry in the schedule structure;
        this.setState({buffStopColl:buffStops,TripObj:trip,tripChange:true});
    },
    _addRoute : function(formObj){
        var id = formObj['New Route']
        if(this.state.schedules[id])
            return false;
        else{
            this.state.schedules[id] = {trips:[],id:id}
            this.setState({schedules:this.state.schedules});
        }
        console.log(id);
    },
    _addTrip : function(formObj){
        var service_id = formObj.Service_Id,
        trip_id        = formObj.Trip_Id,
        headsign       = formObj.Headsign,
        shape_id       = formObj.Shape_Id;

        if(!(service_id && trip_id && shape_id) ){
            return "All Fields Must be populated"
        }
        else{
            var schedules = this.state.schedules;
            var trip = {
                headsign:headsign,
                id:'[]',
                intervals:[],
                route_id:schedules[this.state.currentRoute].id,
                start_times:[],
                stop_times:[],
                tripids:[trip_id],
                shape_id:shape_id,
                service_id:service_id,
            };
            schedules[this.state.currentRoute].trips.push(trip);
            this.setState({schedules:schedules});
        }
    },
    editTrip : function(trip){
        var info = this.state.editInfo;
        info.trip = trip;
        this.setState({editInfo:info,needEdit:true,tripChagne:true});
    },
    editStop : function(id){
        var info = this.state.editInfo;
        info.stop = id;
        this.setState({editInfo:info,needEdit:true,tripChange:false});
    },
    changeStop : function(sInfo){
        //new stopid, stopName
        if(this._getStop(sInfo.stopId)){
          return "Error Stop Exists"
        }
        var stop = this._getStop(sInfo.oldId); //get the old stop
        stop.setId(sInfo.stopId);
        stop.setName(sInfo.stopName);
    },
    render: function() {
        var scope = this;
        var routesGeo = check(this.props.routesGeo);
        var stopsGeo;
        if(!this.state.TripObj)
            stopsGeo = emptyGeojson;
        else{
            var ids = this.state.TripObj.getStops(),
            tempColl = new Stops();
            tempColl.addStops(ids.map(function(id){return scope._getStop(id)}));
            stopsGeo = tempColl.getFeatureCollection();

        }
        var tracts = check(this.props.tracts) ;
        var scheds = this.state.schedules || {}
        var route = (this.state.schedules)?this.state.schedules[this.state.currentRoute]:{};
        var routingGeo = this._processResponse(this.props.routingGeo);
        return (
        	<div className="content container">
            	<h2 className="page-title">
                    Create Market Area
                    <br />

                </h2>

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
                            isCreating={this.state.isCreating}
                            tripChange={this.state.tripChange}
                            editStop = {this.editStop} />
                    </div>
                    <div className="col-lg-3">
                       <Databox
                           schedules = {scheds}
                           onRouteChange={this.setRoute}
                           addRoute = {this._addRoute}/>
                        <Trips
                            route={route}
                            onTripSelect={this.setTrip}
                            currentTrip={this.state.currentTrip}
                            addTrip = {this._addTrip}/>
                        <EditBox
                            schedules={this.state.schedules}
                            stopSearch={this._getStop}
                            data={this.state.editInfo}
                            saveStop={this.changeStop}
                            active={this.state.needEdit}/>
                       <SaveBox
                        Edited={this.state.edited}
                        onSave={this._saveEdits}/>
                    </div>

                </div>
        	</div>
        );
    }
});
//  {stopsGeo.features.length}
                       // {this.state.currentRoute}
                       // {this.state.currentTrip}
                       // {routingGeo}
module.exports = MarketAreaNew;
