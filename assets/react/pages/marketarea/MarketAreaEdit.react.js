/*globals console,require,module,d3*/
'use strict';

var React = require('react'),
Router = require('react-router'),
    Link = require('react-router').Link,
    Navigation = require('react-router').Navigation,
    // -- Utils
    SailsWebApi = require('../../utils/sailsWebApi'),
    Geoprocessing = require('../../utils/geoprocessing'),

    // -- Components
    MarketareaNav = require('../../components/marketarea/layout/marketareaNav.react'),
    MarketAreaMap = require('../../components/utils/MarketAreaMap.react'),
    RouteListTable = require('../../components/marketarea/RouteListTable.react'),
    RoutesSelector = require('../../components/marketarea/RoutesSelector.react'),
    GtfsSelector = require('../../components/marketarea/new/GtfsSelector.react'),
    DescriptionArea = require('../../components/utils/DescriptionArea.react'),

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),

    // -- Stores
    GeoDataStore = require('../../stores/GeodataStore'),
    MarketAreaStore = require('../../stores/MarketAreaStore');

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
    colors:{},
    mixins: [Router.State],
    statics: {

        willTransitionTo: function (transition, params) {

            if(params.marketareaID){
               MarketAreaActionsCreator.setCurrentMarketArea(params.marketareaID);
            }
        }

    },
    getInitialState: function(){
        var pma = this.props.marketarea;
        this.colors = (this.props.marketarea && this.props.marketarea.routecolors)? this.props.marketarea.routecolors : {};
        return {
            marketarea:{
              id:(pma.id) ? pma.id:'',
              name:(pma.name)?pma.name:'',
              zones:(pma.zones !== undefined)? pma.zones:[],
              routes:(pma.routes !== undefined)? pma.routes:[],
              counties:(pma.counties !== undefined)? pma.counties:[],
              origin_gtfs:(pma.origin_gtfs !== undefined)? pma.origin_gtfs:null,
              routecolors:(pma.routecolors !== null)? pma.routecolors:{},
              stateFips:'34',
              geounit:'tracts',
            },
            routesGeo:emptyGeojson,
            stopsGeo:emptyGeojson,
            routeList:(this.props.routes)?this.props.routes:[],
            countyFilter:(pma.counties)? pma.counties.slice(0):[],
            tractsFilter:(pma.zones)? pma.zones.slice(0):[],
            outerTractsFilter:[],
            stateTracts:(this.props.stateTracts) ? JSON.parse(JSON.stringify(this.props.stateTracts)):[],
            message:null,
            bMessage:'Update Market Area',
            gtfs_source:null,
        };
    },
    componentDidMount : function(){
      if(this.props.routesGeo.features.length > 0){
        this.setRoutesGeo(this.props.routesGeo);
      }
      if(this.props.stopsGeo.features.length > 0 ){
        if(this.state.tractsFilter && this.state.countyFilter){
          this.initTracts();
          this.setState({stopsGeo:this.props.stopsGeo});
        }else{
            this.setStopsGeo(this.props.stopsGeo);
        }
      }
      MarketAreaStore.addChangeListener(this._onChange);
    },
    _onChange : function(){
      var ma = MarketAreaStore.getCurrentMarketArea();
      var sma = this.state.marketarea;
      Object.keys(ma).forEach(function(d){
        sma[d] = (ma[d])?ma[d]:sma[d];
      });
      this.setState({marketarea:sma});
    },
    setRouteList : function(id,data){
      SailsWebApi.getRoutesGeo(-1,this.state.marketarea.origin_gtfs,this.state.marketarea.routes,this.setRoutesGeo);
      SailsWebApi.getStopsGeo(-1,this.state.marketarea.origin_gtfs,this.state.marketarea.routes,this.setStopsGeo);
      this.setState({routeList:data});
    },
    componentWillReceiveProps: function(nextProps){
      if(nextProps.routes && (this.props.routes !== nextProps.routes)){
        this.setState({routeList:nextProps.routes});
      }
      if(nextProps.stopsGeo && nextProps.stopsGeo !== this.props.stopsGeo){
          this.setState({stopsGeo:nextProps.stopsGeo});
      }
      if(this.state.outerTractsFilter.length ===0){
          this.initTracts();
      }
      if(nextProps.routesGeo && (nextProps.routesGeo !== this.props.routesGeo) ){
        this.setRoutesGeo(nextProps.routesGeo);
      }
      if(nextProps.stateTracts && nextProps.stateTracts !== this.state.stateTracts && nextProps.stateTracts.features.length > 0){
        this.setState({stateTracts:nextProps.stateTracts});
      }
      if(nextProps.marketarea && nextProps.marketarea !== this.props.marketarea && nextProps.marketarea.id > 0){
        var nma = this.state.marketarea;
        Object.keys(nextProps.marketarea).forEach(function(d){
          nma[d] = (nextProps.marketarea[d]) ? nextProps.marketarea[d]:{};
        });
        var filter = nma.zones.slice(0);
        var cfilter = nma.counties.slice(0);
        this.colors = nextProps.marketarea.routecolors;

        this.setState({marketarea:nma,tractsFilter:filter,countyFilter:cfilter});

      }
    },
    initTracts : function(){
      if(this.state.countyFilter){
        var fips = this.getCountyFips(this.state.countyFilter);
        var ftracts = this.getFilterTracts(fips);
        if(this.state.tractsFilter){
          var nonZoneTracts = this.getNonZone(ftracts,this.state.tractsFilter);
          this.setState({outerTractsFilter:nonZoneTracts});
        }
      }
    },
    getNonZone : function(filterTracts,tractsFilter){
      var nonSelectTracts = filterTracts.filter(function(d){ //filter the tracts within our fips regions
          var matches = tractsFilter.filter(function(geoId){//check each track id
            return d.properties.geoid === geoId;                //against the stop associated ones
          });
          return matches.length === 0;                          //if no matches return it;
      }).map(function(d){return d.properties.geoid;});
      return nonSelectTracts;
    },
    getCountyFips : function(countyFilter){
      var countyFips = this.props.stateCounties.features.filter(function(d,i){
          return countyFilter.indexOf(d.properties.geoid) > -1;
      }).map(function(d){
          return d.properties.geoid;
      });
      return countyFips;
    },
    getFilterTracts : function(countyFips){
      var filterTracts = this.state.stateTracts.features.filter(function(d){
          //console.log(parseInt(d.properties.geoid.substr(0,5)));
          return countyFips.indexOf(parseInt(d.properties.geoid.substr(0,5))) > -1;
      });
      return filterTracts;
    },
    setStopsGeo:function(data){
        if(data && data.features.length > 0 && this.props.stateCounties && this.props.stateCounties.features.length > 0 &&
               this.props.stateTracts && this.props.stateTracts.features.length > 0){
            console.log('Processing counties',new Date());
            var countyFilter = Geoprocessing.point2polyIntersect(data,this.props.stateCounties).keys;
            console.log('Finished processing counties',new Date());

            var countyFips = this.getCountyFips(countyFilter);
            var filterTracts = this.getFilterTracts(countyFips);

            console.log('Processing tracts',new Date());
            var tractsFilter = Geoprocessing.point2polyIntersect(data,{type:'FeatureCollection',features:filterTracts});
            console.log('Finished Processing tracts',new Date());
            console.log(tractsFilter,countyFilter);
            var nonSelectTracts = this.getNonZone(filterTracts,tractsFilter.keys);
            this.setState({
              stopsGeo:data,
              countyFilter:countyFilter,
              tractsFilter:tractsFilter.keys,
              outerTractsFilter:nonSelectTracts,
              });
        }else if(data.features.length === 0){
            console.log('remove last layer');
            this.setState({
              stopsGeo:data,
            });
        }
    },

    setRoutesGeo:function(data){

        var colors = this.colors;
        if(!colors)
          colors = {};
        data.features = data.features.map(function(d,i){
            if(colors && colors[d.properties.short_name]){
              d.properties.color = colors[d.properties.short_name];
            }
            if(!d.properties.color){
                d.properties.color = d3.scale.category20().range()[i%20];
                colors[d.properties.short_name] = d.properties.color;
            }
            return d;
        });
        this.state.marketarea.routecolors = colors;
        this.setState({routesGeo:data,marketarea:this.state.marketarea});
    },

    removeRoute:function(route){
        var newState = this.state;
        newState.marketarea.routes =  newState.marketarea.routes.filter(function(d){
            return d !== route;
        });
        if(newState.marketarea.routes.length === 0){
               this.setRoutesGeo(emptyGeojson);
               this.setStopsGeo(emptyGeojson);
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
            newState.marketarea.routes.sort();

            SailsWebApi.getRoutesGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setRoutesGeo);
            SailsWebApi.getStopsGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setStopsGeo);

            this.setState(newState);
        }
    },

    colorChange : function(route,color){
      d3.selectAll('.route_'+route).style('stroke',color);
      this.state.marketarea.routecolors[route] = color;
      this.colors = this.state.marketarea.routecolors;
      this.colors[route] = color;
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
            return (
                <div>
                    <GtfsSelector currentSelection={this.state.marketarea.origin_gtfs} gtfsData={this.props.datasources.gtfs} gtfsChange={this.gtfsSelect}/>
                    <RoutesSelector addRoute={this.addRoute} routeList={this.state.routeList} />
                    <RouteListTable marketarea={this.state.marketarea} rfilter={this.routeFilter} colorChange={this.colorChange} removeRoute={this.removeRoute} />
                </div>
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

    updatedMa:function(data){

        if(data.id){
            this.setState({bMessage:'Update Again',marketarea:data});
            GeoDataStore.purgeMarketTracts();
            SailsWebApi.read('marketarea');
            SailsWebApi.getStateGeodata(this.state.marketarea.stateFips);
        }
    },

    updateMarketArea: function(){
        var scope = this;
        this.state.marketarea.routecolors = this.colors;
        var marketarea = JSON.parse(JSON.stringify(this.state.marketarea));
        marketarea.zones = this.state.tractsFilter;
        marketarea.counties = this.state.countyFilter;
        if(marketarea.routes.length ===  0){
            this.setState({message:'Market area has no routes, add route.'});
        }

        else{
            this.setState({bMessage:'Saving ...'});
            SailsWebApi.update('marketarea',marketarea,this.updatedMa);
        }
    },

    renderStats:function(){
        if(typeof this.props.marketarea == 'undefined'){
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
    render: function() {

        //var routesGeo = this.state.routesGeo || emptyGeojson;
        var scope = this;
        var counties = {type:'FeatureCollection',features:[]};
        console.log('marketarea colors',this.state.marketarea.routecolors)

        counties.features = this.props.stateCounties.features;

        if(this.state.countyFilter.length > 0){
            counties.features = this.props.stateCounties.features.filter(function(d,i){
                return scope.state.countyFilter.indexOf(d.properties.geoid) > -1;
            });
        }

        var tracts = {type:'FeatureCollection',features:[]};
        if(this.state.tractsFilter.length > 0){
            tracts.features = this.state.stateTracts.features.filter(function(d,i){
                var isInner = scope.state.tractsFilter.indexOf(d.properties.geoid) > -1;
                if(isInner){
                  d.properties.type = 0;
                }
                return isInner;
            });
        }
        if(this.state.outerTractsFilter.length > 0){
          this.state.stateTracts.features.forEach(function(d,i){
              var isOuter = scope.state.outerTractsFilter.indexOf(d.properties.geoid) > -1;
              if(isOuter){
                d.properties.type = 1;
                tracts.features.push(d);
              }
          });
        }
        return (
        	<div className="content container">
            <MarketareaNav marketarea={this.props.marketarea}/>

                <div className="row">
                	<div className="col-lg-9">

                        <MarketAreaMap
                            stops={this.state.stopsGeo}
                            routes={this.state.routesGeo}
                            tracts ={tracts}
                            counties={counties}
                            toggleTracts={this.toggleTracts}
                            routeColors={this.state.marketarea.routecolors}
                            />
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
                                <button className="btn btn-lg btn-danger btn-block" onClick={this.updateMarketArea}>
                                    {this.state.bMessage}
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
