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
        };
    },
    setRoute:function(id){  //on route change
        if(!editCheckConfirm(this))
            return false;
        this.setState({currentRoute:id});  //set state to current route id
        // this.setState({graph:new Graph()});//set graph object to an empty one
        this.setState({currentTrip: null,edited:false});//reset the trip
        return true;
    },
    setTrip:function(ix){
        if(!editCheckConfirm(this))
            return false;
        this.setState({currentTrip:ix,graph:new Graph(),edited:false});
        var T = new Trip();
        T.setId(this.props.schedules[this.state.currentRoute].trips[ix].id);
        this.setState({TripObj:T});
        return true;
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
            var stp = scope.state.stopColl.getStop(id);
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
            console.log('update stops',nextProps.stopsGeo.features.length);
            var stops = new Stops();
            stops.addStops(nextProps.stopsGeo.features);
            this.setState({stopColl:stops});
        }
    },
    componentWillUpdate:function(nextProps, nextState){
        //if the selected trip isn't null and isnt the same as the last trip
        if(nextState.currentTrip !== null && (nextState.currentTrip !== this.state.currentTrip)){
            var route = this.props.schedules[this.state.currentRoute],
            trip = route.trips[nextState.currentTrip],
            stopTraj = JSON.parse(trip.id);
            this._requestData(stopTraj);
        }
        else if (nextState.TripObj !== this.state.TripObj){
            stopTraj = nextState.TripObj.getStops();
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
        this.setState({TripObj:trip,edited:true})
        this.state.graph.deleteNode(id,stopList)
        
        console.log('Attempted Delete',stop);  
    },
    insStop : function(stopobj){
        console.log('Attempted to Add Stop',map)
        this.state.tracker.addEvent('i',stopobj);
    },
    crtStop : function(stopobj){
        console.log('Attempted Create',map);
        this.state.tracker.addEvent('i',stopobj);
    },
    render: function() {
        var routesGeo = check(this.props.routesGeo);  
        var stopsGeo;
        if(!this.state.TripObj)
            stopsGeo = emptyGeojson;
        else{
            var ids = this.state.TripObj.getStops();
            stopsGeo = this.state.stopColl.getSubCollByIds(ids).getFeatureCollection();
        }
        var tracts = check(this.props.tracts) ;
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
                            createStop={this.crtStop} />
                        

                    </div>
                    <div className="col-lg-3">
                       <Databox
                           schedules = {this.props.schedules}
                           onRouteChange={this.setRoute}/>
                        <Trips
                            route={this.props.schedules[this.state.currentRoute]}
                            onTripSelect={this.setTrip}
                            currentTrip={this.state.currentTrip}/>
                       <SaveBox
                        Edited={this.state.edited}
                        onSave={this._saveEdits}/>
                       //  {stopsGeo.features.length}
                       // {this.state.currentRoute}
                       // {this.state.currentTrip}
                       // {routingGeo}
                       
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = MarketAreaNew;