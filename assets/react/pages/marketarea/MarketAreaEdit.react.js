/*globals console,require,module,d3*/
'use strict';

var React = require('react'),
Router = require('react-router'),
    Link = require('react-router').Link,
    Navigation = require('react-router').Navigation,
    _   = require('lodash'),
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
    UserActionsCreator       = require('../../actions/UserActionsCreator'),
    CountyTractActionsCreator= require('../../actions/CountyTractActionsCreator'),
    // -- Stores
    UserStore    = require('../../stores/UserStore'),
    GeoDataStore = require('../../stores/GeodataStore'),
    MarketAreaStore = require('../../stores/MarketAreaStore');

var stateFipsLength = 2;
var oldCounties, oldTracts,oldStops;
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
        this.colors = (pma && pma.routecolors)? pma.routecolors : {};
              return {
            marketarea:{
              id:(pma.id) ? pma.id:'',
              name:(pma.name)?pma.name:'',
              zones:(pma.zones !== undefined)? _.cloneDeep(pma.zones):[],
              routes:(pma.routes !== undefined)?_.cloneDeep( pma.routes):[],
              counties:(pma.counties !== undefined)? _.cloneDeep(pma.counties):[],
              origin_gtfs:(pma.origin_gtfs !== undefined)? pma.origin_gtfs:null,
              routecolors:(pma.routecolors !== null)? _.cloneDeep(pma.routecolors):{},
              center : pma.center || [],
              stateFips:pma.stateFips || [],
              geounit:'tracts',
              description:(pma.description) || '',
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
            tracts: null,
            counties: null,
            isLoading:false,
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
      GeoDataStore.addChangeListener(this._onGeoChange);
      MarketAreaStore.addChangeListener(this._onChange);

    },
    _onGeoChange : function(){
      var scope = this;
      if(this.state.marketarea.origin_gtfs && this.props.datasources.gtfs[this.state.marketarea.origin_gtfs]){
        var agency = this.props.datasources.gtfs[this.state.marketarea.origin_gtfs].settings.agencyid;
        var routes = this.state.marketarea.routes;
        console.log('tract id',agency,routes);
        var partialState = this.state;
        var counties = GeoDataStore.getTempCounties(agency,routes);
	var tracts = GeoDataStore.getTempTracts(agency,routes);
	if(!_.isEqual(this.state.counties,counties) 
		|| this.state.countyFilter.length === 0)
	{
            if(counties.features.length > 0){
		var states = _.uniq(counties.features.map(function(d){
		return d.properties.geoid.substr(0,stateFipsLength);
	    }));

	    var temp = 
	    scope.calcStopsCounts(scope.state.stopsGeo,counties || null);
		partialState.counties = counties;
		partialState.stateFips = states;
		partialState.countyFilter = temp;
            }
	}
	var countyFilter = partialState.countyFilter || scope.state.countyFilter;
	if((!_.isEqual(this.state.tracts,tracts) || 
	    this.state.tractsFilter.length === 0) && 
	   countyFilter )
	{
	    
	    if(tracts.features.length > 0)
	    {
		var temp = 
	            scope.calcStopsTracts(scope.state.stopsGeo,
				 partialState.countyFilter || scope.state.countyFilter,
				 tracts);
		partialState.tracts = tracts;
		partialState.tractsFilter = temp.tractsFilter;
		partialState.outerTractsFilter = temp.outerTractsFilter;
	    }
	}	
        this.setState(partialState);
      }
    },
    _onChange : function(){
      var ma = MarketAreaStore.getCurrentMarketArea();
      if(ma){
	  var sma = this.state.marketarea;
	  Object.keys(ma).forEach(function(d){
              sma[d] = (ma[d])?_.cloneDeep(ma[d]):sma[d];
	  });
	  this.setState({marketarea:sma});
      }
    },
    componentWillUnmount:function(){
      GeoDataStore.removeChangeListener(this._onGeoChange);
      MarketAreaStore.removeChangeListener(this._onChange);
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
      if(!this.state.outerTractsFilter || 
	 this.state.outerTractsFilter.length ===0)
	{
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
          nma[d] = (nextProps.marketarea[d] || Array.isArray(nextProps.marketarea[d])) ? _.cloneDeep(nextProps.marketarea[d]):{};
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
    getNonZone : function(tracts,tractsFilter){
      if(!tracts.features){
        return [];
      }
      var nonSelectTracts = tracts.features.filter(function(d){ //filter the tracts within our fips regions
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
    
    calcStopsCounts: function(data,counts){
	var counties = counts || this.state.counties;
	if(data && data.features.length > 0 && 
	   counties && counties.features.length > 0)
	{
	    console.time('counties');
            var countyFilter = 
	    Geoprocessing.point2polyIntersect(data,counties).keys;
	    console.timeEnd('counties');

	   
	   return countyFilter;
	}
	return [];
    },

    calcStopsTracts: function(data,countyFilter,trs){
	var tracts = trs || this.state.tracts;
	var retobj = {};
	if(data && data.features.length > 0 && 
          tracts && tracts.features.length > 0)
	{
	    var equalTracts = _.isEqual(tracts,oldTracts);
	    var equalStops  = _.isEqual(data,oldStops);
	    if(!equalTracts || !equalStops)
	    {
		if(!equalTracts)
		{
		    oldTracts = tracts;
		}
		if(!equalStops)
		{
		    oldStops = data;
		    retobj.stopsGeo = data;
		}
		console.time('tracts');
		var tractsFilter = 
		Geoprocessing.point2polyIntersect(data,tracts).keys;
		console.timeEnd('tracts');
		if(this.state.tractsFilter){
		    tractsFilter = 
		         _.union(tractsFilter,this.state.tractsFilter);
		    
		    tractsFilter = tractsFilter.filter(function(d){
			return countyFilter.indexOf(d.substr(0,5)) !== -1;
		    });
		}
		var nonSelectTracts = this.getNonZone(tracts,tractsFilter);
		retobj.tractsFilter = tractsFilter;
		retobj.outerTractsFilter = nonSelectTracts;

	   }
	}
	retobj.tractsFilter = retobj.tractsFilter || [];
	retobj.outerTractsFilter = retobj.outerTractsFilter || [];
	return retobj;
    },

    setStopsGeo:function(data,counts,trs){
      var counties = counts || this.state.counties,tracts = trs || this.state.tracts;
      if(data && data.features.length > 0 && counts && counts.features.length > 0 &&
          tracts && tracts.features.length > 0){
	    partialState = this.state;
	    partialState.countyFilter = this.calcStopCounts(data,counts);

	    var temp = 
	      this.calcStopTracts(data,partialState.countyFilter,tracts);
	     
	    Object.keys(temp).forEach(function(d){
		if(temp[d])
		    partialState[d] = temp[d];
	    });

            var ma = this.state.marketarea;
            ma.center = Geoprocessing.center(data);
	    partialState.marketarea = ma;
	    partialState.isLoading = false;
            this.setState(partialState);

        }else {
            console.log('remove last layer');
            this.setState({
              stopsGeo:data,
	      isLoading:false,
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
	newState.isLoading = true;
	this.setState(newState,function(){
	    CountyTractActionsCreator.removeRoute(
	        newState.marketarea.origin_gtfs,route);
	});
        if(newState.marketarea.routes.length === 0){
               this.setRoutesGeo(emptyGeojson);
               this.setStopsGeo(emptyGeojson);
        }else{
	    var dsid = newState.marketarea.origin_gtfs;
            SailsWebApi.getRoutesGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setRoutesGeo);
            SailsWebApi.getStopsGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setStopsGeo);
        }
    },

    addRoute:function(route){
        var newState = this.state;
        if(newState.marketarea.routes.indexOf(route) === -1){
            newState.marketarea.routes.push(route);
            newState.marketarea.routes.sort();
	    newState.isLoading = true;
            var dsid = newState.marketarea.origin_gtfs;
            SailsWebApi.getRoutesGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setRoutesGeo);
            SailsWebApi.getStopsGeo(-1,newState.marketarea.origin_gtfs,newState.marketarea.routes,this.setStopsGeo);
	    SailsWebApi.getRouteCounties(this.props.datasources.gtfs[dsid].settings.agencyid,newState.marketarea.routes);
            SailsWebApi.getRouteTracts(this.props.datasources.gtfs[dsid].settings.agencyid,newState.marketarea.routes,
				       _.union(newState.tractsFilter,newState.outerTractsFilter) );
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
		    {this.state.isLoading ? <img src={"/img/loading.gif"} 
	                 style={{width:60,height:60}} />:'' }
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
          var message = {
            actiontitle:'Updated Market Area ' + data.name,
            actiondesc:data.description,
            userid: UserStore.getSessionUser().id,
            maid: data.id,
            stateFips: data.stateFips,
          };
	    console.log('updated ma zones',data.zones);
            UserActionsCreator.userAction(message);
            this.setState({bMessage:'Update Again',marketarea:data});
            
            var dsid = data.origin_gtfs;
            var route = data.routes;
            SailsWebApi.getRouteCounties(this.props.datasources.gtfs[dsid].settings.agencyid,route,this.state.countyFilter);
            SailsWebApi.getRouteTracts(this.props.datasources.gtfs[dsid].settings.agencyid,route, []);
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
            var agency = this.props.datasources.gtfs[marketarea.origin_gtfs].settings.agencyid;
            MarketAreaActionsCreator.updateMarketArea(marketarea,this.updatedMa,agency);
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
	var inx = tf.indexOf(feature.properties.geoid);
	var oinx = otf.indexOf(feature.properties.geoid);
        if(inx ===-1 && oinx >= 0){
	    tf.push(feature.properties.geoid);
	    otf.splice(oinx,1);
	}else if(inx === -1){
	    tf.push(feature.properties.geoid);
	}else{
	    otf.push(feature.properties.geoid);
            tf.splice(inx,1);
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
        // counties.features = this.props.stateCounties.features;

        if(this.state.countyFilter.length > 0 && this.state.counties){
            counties.features = this.state.counties.features.filter(function(d,i){
                return scope.state.countyFilter.indexOf(d.properties.geoid) > -1;
            });
        }

        var countyTracts;
        if(this.state.tracts && this.state.tracts.features.length > 0){
          countyTracts = this.state.tracts;
        }else{
          countyTracts = this.props.countyTracts;
        }

        var tracts = {type:'FeatureCollection',features:[]};
	var tractsFilterMap ={};
        if(this.state.tractsFilter && 
	   this.state.tractsFilter.length > 0 && 
	   countyTracts){
	    
	    scope.state.tractsFilter.forEach(function(d){
		tractsFilterMap[d] = true;
	    });

            countyTracts.features.forEach(function(d,i){
                if(tractsFilterMap[d.properties.geoid]){
                    d.properties.type = 0;
		    tracts.features.push(d);
		}
            });
        }
	if(this.state.outerTractsFilter && 
	   this.state.outerTractsFilter.length >0 && countyTracts){
	    var oTractsFilterMap={};
	    scope.state.outerTractsFilter.forEach(function(d){
		oTractsFilterMap[d] = d;
	    });
	    countyTracts.features.forEach(function(d,i){
                if(oTractsFilterMap[d.properties.geoid]){
                    d.properties.type = 1;
		    tracts.features.push(d);
		}
            });
	}else if(countyTracts){
	    countyTracts.features.forEach(function(d,i){
		if(!tractsFilterMap[d.properties.geoid]){
		    d.properties.type = 1;
		    tracts.features.push(d);
		}
	    });
	}
        console.log('yonder tracts',tracts.features.length);
        return (
        	<div className="content container">
            <MarketareaNav marketarea={this.props.marketarea}/>

                <div className="row">
                	<div className="col-lg-9">

                        <MarketAreaMap
                            stops={this.state.stopsGeo}
                            routes={this.state.routesGeo}
                            tracts ={tracts}
                            counties={this.state.counties ? counties : this.props.counties}
                            toggleTracts={this.toggleTracts}
                            routeColors={this.state.marketarea.routecolors}
                            changeTractsWithStops={true}
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
