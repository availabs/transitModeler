'use strict';

var React = require('react'),
    Navigation = require('react-router').Navigation,
    // -- Utils
    SailsWebApi = require('../../utils/sailsWebApi'), 
    Geoprocessing = require('../../utils/geoprocessing'),

    // -- Components
    MarketAreaMap = require('../../components/utils/MarketAreaMap.react'),
    RouteListTable = require('../../components/marketarea/RouteListTable.react'),
    RoutesSelector = require('../../components/marketarea/RoutesSelector.react'),
    GtfsSelector = require('../../components/marketarea/new/GtfsSelector.react'),
    
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
    

var emptyGeojson = {type:'FeatureCollection',features:[]};


var MarketAreaNew = React.createClass({

    mixins: [Navigation],

    getInitialState: function(){
        
        return {
            marketarea:{
                name:'',
                zones:[],
                routes:[],
                counties:[],
                origin_gtfs:null,
                stateFips:'34',
                geounit:'tracts',
            },
            routesGeo:{type:'FeatureCollection',features:[]},
            stopsGeo:{type:'FeatureCollection',features:[]},
            gtfs_source:null,
            routeList:[],
            countyFilter:[],
            tractsFilter:[],
            message:null
        };
    },

    setRouteList:function(id,data){
        this.setState({routeList:data});
    },

    setStopsGeo:function(data){
        if(data && data.features.length > 0){
            var countyFilter = Geoprocessing.point2polyIntersect(data,this.props.stateCounties).keys;
            var countyFips = this.props.stateCounties.features.filter(function(d,i){
                return countyFilter.indexOf(d.properties.geoid) > -1
            }).map(function(d){
                return d.properties.geoid;
            })
            var filterTracts = this.props.stateTracts.features.filter(function(d){
                //console.log(parseInt(d.properties.geoid.substr(0,5)));
                return countyFips.indexOf(parseInt(d.properties.geoid.substr(0,5))) > -1;
            })
            //console.log('stateTracts',filterTracts,'fips',countyFips)
            
            var tractsFilter = Geoprocessing.point2polyIntersect(data,{type:'FeatureCollection',features:filterTracts});
            //console.log(tractsFilter,countyFilter)
            this.setState({stopsGeo:data,countyFilter:countyFilter,tractsFilter:tractsFilter.keys});
        }else if(data.features.length === 0){
            //console.log('remove last layer')
            this.setState({stopsGeo:data,countyFilter:[],tractsFilter:[]})
        }
    },

    setRoutesGeo:function(data){
        //console.log('setRoutesGeo',data)
        data.features = data.features.map(function(d,i){
            if(!d.properties.color){
                d.properties.color = d3.scale.category20().range()[i];
            }
            return d
        });
        
        this.setState({routesGeo:data});
    },  
    
    removeRoute:function(route){
        //console.log('removeRoute',route)
        var newState = this.state;
        newState.marketarea.routes =  newState.marketarea.routes.filter(function(d){
            return d !== route;
        })
        if(newState.marketarea.routes.length === 0){
               this.setRoutesGeo(emptyGeojson);
               this.setStopsGeo(emptyGeojson) 
        }else{
            SailsWebApi.getRoutesGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setRoutesGeo);
            SailsWebApi.getStopsGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setStopsGeo);
        }
        this.setState(newState);
    },

    addRoute:function(route){
        var newState = this.state;
        if(newState.marketarea.routes.indexOf(route) === -1){
            newState.marketarea.routes.push(route);
            
            SailsWebApi.getRoutesGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setRoutesGeo);
            SailsWebApi.getStopsGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setStopsGeo);
           
            this.setState(newState);
        }
    },

    gtfsSelect:function(gtfsData){
        if(gtfsData){
            var newState = this.state;
            newState.marketarea.origin_gtfs = gtfsData.id;
            newState.gtfs_source = gtfsData;
            SailsWebApi.getGtfsRoutes(gtfsData.tableName,gtfsData.id,this.setRouteList)
            this.setState(newState);
        }
    },
    
    renderSelectors : function(){
        if(this.state.gtfs_source){
            return (
                <div>
                    <GtfsSelector gtfsData={this.props.datasources.gtfs} gtfsChange={this.gtfsSelect}/>
                    <RoutesSelector addRoute={this.addRoute} routeList={this.state.routeList} />
                    <RouteListTable marketarea={this.state.marketarea} removeRoute={this.removeRoute} />
                </div>
            )
        }
        return (
            <GtfsSelector gtfsData={this.props.datasources.gtfs} gtfsChange={this.gtfsSelect}/>
        )
    },

    clearMessage:function(){
        this.setState({message:null})
    },

    renderMessage:function(){
        if(this.state.message){
            var messageClass = 'alert alert-danger';
            if(this.state.message === 'Loading Data...'){
                
                messageClass = 'alert alert-success';
            
            }
            return (
                <div className={messageClass}>
                    <button type="button" className="close" onClick={this.clearMessage}>×</button>
                    <strong><i class="fa fa-bell-o"></i></strong>{this.state.message}
                </div>
            )
        }
        return (<span />)
    },
    
    editName: function(event) {
        var el = event.target,
            newState = this.state;
            newState.marketarea.name = event.target.value
            this.setState(newState);

    },

    createdMa:function(data){
        //console.log('marketarea create callback',data)
        if(data.id){
            this.transitionTo('MarketAreaIndex', {marketareaID: data.id})
        }else{
            this.setState({message:'Create Failed:'+data})
        }
    },

    createMarketArea: function(){
        var scope = this;
        var marketarea = this.state.marketarea;
        marketarea.zones = this.state.tractsFilter;
        marketarea.counties = this.state.countyFilter;
        if(marketarea.routes.length ===  0){
            this.setState({message:'Market area has no routes, add route.'})
        }
        else if(marketarea.name.length ===  0){
            this.setState({message:'Must add market area name.'})
        }else{
            SailsWebApi.create('marketarea',marketarea,this.createdMa)
        }
    },

    renderStats:function(){
        if(this.state.marketarea.routes.length === 0){
            return <span />
        }
        return (
            <section className="widget">
                <div className="body no-margin">
                    <h4> Market Area Statistics </h4>
                    <table className="table">
                        <tr>
                            <td>Counties</td>
                            <td>{this.state.countyFilter.length}</td>
                        </tr>
                        <tr>
                            <td>Bus Routes</td>
                            <td>{this.state.routesGeo.features.length}</td>
                        </tr>
                        <tr>
                            <td>Bus Stops</td>
                            <td>{this.state.stopsGeo.features.length}</td>
                        </tr>
                        <tr>
                            <td>Tracts</td>
                            <td>{this.state.tractsFilter.length}</td>
                        </tr>
                    </table>
                </div>
            </section> 
        )
    },
    render: function() {
        
        //var routesGeo = this.state.routesGeo || emptyGeojson;
        var scope = this;
        var counties = {type:'FeatureCollection',features:[]};
        
        counties.features = this.props.stateCounties.features;
        
        if(this.state.countyFilter.length > 0){
            counties.features = this.props.stateCounties.features.filter(function(d,i){
                return scope.state.countyFilter.indexOf(d.properties.geoid) > -1;
            })
        }
        
        var tracts = {type:'FeatureCollection',features:[]}
        if(this.state.tractsFilter.length > 0){
            tracts.features = this.props.stateTracts.features.filter(function(d,i){
                return scope.state.tractsFilter.indexOf(d.properties.geoid) > -1;
            })
        }

        return (
        	<div className="content container">
            	<h2 className="page-title">
                    Create Market Area
                    <br />
                    <input className='form-control col-lg-9' style={{background:'none',border:'none',fontSize:'16px'}} value={this.state.marketarea.name} onChange={this.editName} placeholder="Enter Name" /> 
                    
                   
                </h2>
                
                <div className="row">
                	<div className="col-lg-9">
                       
                        <MarketAreaMap 
                            stops={this.state.stopsGeo} 
                            routes={this.state.routesGeo} 
                            tracts ={tracts}
                            counties={counties} />
                        {this.renderMessage()}

                      
                    </div>
                    <div className="col-lg-3">
                        <section className="widget">
                            <div className="body no-margin">
                               {this.renderSelectors()}
                            </div>
                        </section> 
                        {this.renderStats()}
                        <section className="widget">
                            <div className="body no-margin">
                                <button className="btn btn-lg btn-danger btn-block" onClick={this.createMarketArea}>
                                    Create Market Area
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = MarketAreaNew;