/*globals require,module,console,d3*/
'use strict';

var React = require('react'),
    Navigation = require('react-router').Navigation,
    _   = require('lodash'),
    // -- Utils
    SailsWebApi = require('../../utils/sailsWebApi'),
    Geoprocessing = require('../../utils/geoprocessing'),

    // -- Components
    MarketAreaMap = require('../../components/utils/MarketAreaMap.react'),
    RouteListTable = require('../../components/marketarea/RouteListTable.react'),
    RoutesSelector = require('../../components/marketarea/RoutesSelector.react'),
    GtfsSelector = require('../../components/marketarea/new/GtfsSelector.react'),
    DescriptionArea = require('../../components/utils/DescriptionArea.react'),

    // -- Stores
    UserStore                = require('../../stores/UserStore'),
    GeoDataStore             = require('../../stores/GeodataStore'),
    // -- Actions
    UserActionsCreator       = require('../../actions/UserActionsCreator'),
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');




var emptyGeojson = {type:'FeatureCollection',features:[]};
var transfer = function(src,dest,id){
  var ix,ids;
  ix = src.indexOf(id);
  if(ix > -1){
    ids = src.splice(ix,1);
    dest.push(ids[0]);
  }
};

var MarketAreaNew = React.createClass({

    mixins: [Navigation],

    componentDidMount : function(){
      GeoDataStore.addChangeListener(this._onChange);
    },
    componentWillUnmount : function(){
      GeoDataStore.removeChangeListener(this._onChange);
    },
    _onChange : function(){
      var scope = this;
      if(this.state.marketarea.origin_gtfs){
        var agency = this.props.datasources.gtfs[this.state.marketarea.origin_gtfs].settings.agencyid;
        var routes = this.state.marketarea.routes;
        console.log('tract id',agency,routes);
        this.setState({
                        tracts:GeoDataStore.getTempTracts(agency,routes),
                        counties:GeoDataStore.getTempCounties(agency,routes),
                      },function(){
                        if(scope.state.tracts && scope.state.counties && scope.state.stopsGeo.features.length){
                          scope.setStopsGeo(scope.state.stopsGeo);
                        }
                      });
      }
    },
    getInitialState: function(){

        return {
            marketarea:{
                name:'',
                zones:[],
                routes:[],
                counties:[],
                origin_gtfs:null,
                routecolors:{},
                stateFips:'',
                center:[],
                geounit:'tracts',
                description:'',
            },
            routesGeo:{type:'FeatureCollection',features:[]},
            stopsGeo:{type:'FeatureCollection',features:[]},
            gtfs_source:null,
            routeList:[],
            countyFilter:[],
            tractsFilter:[],
            outerTractsFilter:[],
            message:null,
            tracts: null,
            counties: null,
        };
    },
    //function to set the set of routes for the gtfs dataSet
    //does so by setting the state of this component.
    setRouteList:function(id,data){
        this.setState({routeList:data});
    },
    //function to set the set of stops for the gtfs dataSet
    setStopsGeo:function(data){
        var counties = this.state.counties,tracts = this.state.tracts;
        if(data && data.features.length > 0 && counties && counties.features.length > 0 &&
            tracts && tracts.features.length > 0){//make sure the data is non empty
            //Get the list of state counties that contain stops for the current routes
            var countyFilter = Geoprocessing.point2polyIntersect(data,counties).keys;
            // get the fips codes for the counties that contain stops
            // var countyFips = counties.features.filter(function(d,i){
            //     return countyFilter.indexOf(d.properties.geoid) > -1;
            // }).map(function(d){ //and generate a list with their geoIds
            //     return d.properties.geoid;
            // });
            //Get the state tracts whose geoIds match the geoIds of the state FIPS
            // var filterTracts = tracts.features.filter(function(d){
            //     //console.log(parseInt(d.properties.geoid.substr(0,5)));
            //     return countyFips.indexOf(parseInt(d.properties.geoid.substr(0,5))) > -1;
            // });
            //console.log('stateTracts',filterTracts,'fips',countyFips)
            //Get the list of tracts whose geometries contain the stops
            var tractsFilter = Geoprocessing.point2polyIntersect(data,tracts/*{type:'FeatureCollection',features:filterTracts}*/);
            //console.log(tractsFilter,countyFilter)
            var nonSelectTracts = tracts.features.filter(function(d){ //filter the tracts within our fips regions
                var matches = tractsFilter.keys.filter(function(geoId){//check each track id
                  return d.properties.geoid === geoId;                //against the stop associated ones
                });
                return matches.length === 0;                          //if no matches return it;
            }).map(function(d){return d.properties.geoid;});
            var ma = this.state.marketarea;
            ma.center = Geoprocessing.center(data);
            this.setState({
              stopsGeo:data,
              countyFilter:countyFilter,
              tractsFilter:tractsFilter.keys,
              outerTractsFilter:nonSelectTracts,
              marketarea:ma,
              });
        }else{ //if there are no stops simply set to empty lists
            //console.log('remove last layer')

            this.setState({
              stopsGeo:data,
              countyFilter:[],
              tractsFilter:[],
              outerTractsFilter:[],

              });
        }
    },

    setRoutesGeo:function(data){
        console.log('setRoutesGeo',data);
        var colors = this.state.marketarea.routecolors;
        if(!colors)
          colors = {};
        data.features = data.features.map(function(d,i){
            if(colors && colors[d.properties.short_name]){
              d.properties.color = colors[d.properties.short_name];
            }
            if(!d.properties.color){
              console.log(colors);
                d.properties.color = d3.scale.category20().range()[i%20];
                colors[d.properties.short_name] = d.properties.color;
            }
            return d;
        });
        this.state.marketarea.routecolors = colors;
        this.setState({routesGeo:data,marketarea:this.state.marketarea});
    },
    colorChange : function(route,color){
      d3.selectAll('.route_'+route).style('stroke',color);
      this.state.marketarea.routecolors[route] = color;
      this.colors = this.state.marketarea.routecolors;
      this.colors[route] = color;
    },
    removeRoute:function(route){
        //console.log('removeRoute',route)
        var newState = this.state;
        newState.marketarea.routes =  newState.marketarea.routes.filter(function(d){
            return d !== route;
        });
        this.setState({marketarea:newState.marketarea});
        if(newState.marketarea.routes.length === 0){
               this.setRoutesGeo(emptyGeojson);
               this.setStopsGeo(emptyGeojson);
        }else{
            SailsWebApi.getRoutesGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setRoutesGeo);
            SailsWebApi.getStopsGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setStopsGeo);
        }

    },

    addRoute:function(route){
        var newState = this.state;
        if(newState.marketarea.routes.indexOf(route) === -1){
            newState.marketarea.routes.push(route);
            newState.marketarea.routes.sort(); //sort the routes to match the ordering from database
            var dsid = newState.marketarea.origin_gtfs;
            SailsWebApi.getRouteCounties(this.props.datasources.gtfs[dsid].settings.agencyid,route,this.state.countyFilter);
            SailsWebApi.getRouteTracts(this.props.datasources.gtfs[dsid].settings.agencyid,route,_.union(newState.tractsFilter,newState.outerTractsFilter) );
            SailsWebApi.getRoutesGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setRoutesGeo);
            SailsWebApi.getStopsGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setStopsGeo);

            this.setState(newState);
        }
    },

    gtfsSelect:function(gtfsData){
        if(gtfsData){
            var newState = this.getInitialState();
            newState.marketarea.origin_gtfs = gtfsData.id;
            newState.gtfs_source = gtfsData;
            this.setState(newState);
            SailsWebApi.getGtfsRoutes(gtfsData.tableName,gtfsData.id,this.setRouteList);

        }
    },
    routeFilter : function(rsn){
      if(this.state.routesGeo.features.length > 0){
        var list = this.state.routesGeo.features.filter(function(d){
          return d.properties.short_name === rsn;
        });
        return list.length > 0;
      }else{
        return true;
      }
    },
    renderSelectors : function(){
        if(this.state.gtfs_source){

            return (
                <div>
                    <GtfsSelector currentSelection={this.state.marketarea.origin_gtfs} gtfsData={this.props.datasources.gtfs} gtfsChange={this.gtfsSelect}/>
                    <RoutesSelector addRoute={this.addRoute} routeList={this.state.routeList} />
                    <RouteListTable marketarea={this.state.marketarea} rfilter={this.routeFilter} colorChange={this.colorChange} removeRoute={this.removeRoute} />
                </div>
            );
        }
        return (
            <GtfsSelector gtfsData={this.props.datasources.gtfs} gtfsChange={this.gtfsSelect}/>
        );
    },

    clearMessage:function(){
        this.setState({message:null});
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
            );
        }
        return (<span />);
    },

    editName: function(event) {
        var el = event.target,
            newState = this.state;
            newState.marketarea.name = event.target.value;
            this.setState(newState);

    },

    createdMa:function(data){
        //console.log('marketarea create callback',data)
        if(data.id){
          var message = {
            actiondesc:data.description,
            actiontitle:'Created new Market Area: '+data.name,
            stateFips : data.stateFips,
            userid : UserStore.getSessionUser().id,
            maid : data.id,
          };
          UserActionsCreator.userAction(message);

            this.transitionTo('MarketAreaIndex', {marketareaID: data.id});
        }else{
            this.setState({message:'Create Failed:'+data});
        }
    },

    createMarketArea: function(){
        var scope = this;
        var marketarea = this.state.marketarea;
        marketarea.zones = this.state.tractsFilter;
        marketarea.counties = this.state.countyFilter;
        if(marketarea.routes.length ===  0){
            this.setState({message:'Market area has no routes, add route.'});
        }
        else if(marketarea.name.length ===  0){
            this.setState({message:'Must add market area name.'});
        }else{
            var agency = this.props.datasources.gtfs[marketarea.origin_gtfs].settings.agencyid;
            MarketAreaActionsCreator.createMarketArea(marketarea,this.createdMa,agency);
            // SailsWebApi.create('marketarea',marketarea,this.createdMa);
        }
    },
    toggleTracts : function(feature){
      var ma = this.state.marketarea, tf = this.state.tractsFilter, otf = this.state.outerTractsFilter;
      if(feature.properties.type){
        transfer(otf,tf,feature.properties.geoid);
      }else{
        transfer(tf,otf,feature.properties.geoid);
      }
      this.setState({
        tractsFilter:tf,
        outerTractsFilter:otf,
        });
    },
    renderStats:function(){
        if(this.state.marketarea.routes.length === 0){
            return <span />;
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
        );
    },
    onDescChange : function(text){
      console.log(text);
      var ma = this.state.marketarea;
      ma.description = text;
      this.setState({marketarea:ma});
    },
    render: function() {

        //var routesGeo = this.state.routesGeo || emptyGeojson;
        var scope = this;
        var counties = {type:'FeatureCollection',features:[]};

        //counties.features = this.props.stateCounties.features;

        if(this.state.countyFilter.length > 0){
            counties.features = this.state.counties.features.filter(function(d,i){
                return scope.state.countyFilter.indexOf(d.properties.geoid) > -1;
            });
        }

        var tracts = {type:'FeatureCollection',features:[]};
        if(this.state.tractsFilter.length > 0){
            tracts.features = this.state.tracts.features.filter(function(d,i){
                var isInner = scope.state.tractsFilter.indexOf(d.properties.geoid) > -1;
                if(isInner){
                  d.properties.type = 0;
                }
                return isInner;
            });
        }
        if(this.state.outerTractsFilter.length > 0){
          this.state.tracts.features.forEach(function(d,i){
              var isOuter = scope.state.outerTractsFilter.indexOf(d.properties.geoid) > -1;
              if(isOuter){
                d.properties.type = 1;
                tracts.features.push(d);
              }
          });
        }
        console.log('Tractfilter length',this.state.tractsFilter.length);
        console.log(tracts.features.filter(function(d){return d.properties.type===0;}).length);
        return (
        	<div className="content container">
            	<h2 className="page-title">
                    Create Market Area
                    <br />
                </h2>

                <div className="row">
                	<div className="col-lg-9">

                        <MarketAreaMap
                            stops={this.state.stopsGeo}
                            routes={this.state.routesGeo}
                            tracts ={tracts}
                            counties={counties}
                            toggleTracts={this.toggleTracts}
                            routeColors={this.state.marketarea.routecolors}
                            changeTractsWithStops={true} />
                        {this.renderMessage()}


                    </div>
                    <div className="col-lg-3">
                        <section className="widget">
                            <div className="body no-margin">
                               {this.renderSelectors()}
                            </div>
                        </section>
                        {this.renderStats()}
                        <section className='widget'>
                                <div className='row'>
                                  <input className='form-control col-lg-9' style={{background:'none',border:'none',fontSize:'16px'}} value={this.state.marketarea.name} onChange={this.editName} placeholder="Enter Name" />
                                </div>
                              </section>
                        <section className='widget'>
                          <div className='row'>
                          <DescriptionArea
                            text={this.state.marketarea.description}
                            onChange={this.onDescChange}
                            />
                        </div>
                        </section>
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
