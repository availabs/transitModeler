/*globals d3,$,require,console,module,setTimeout,clearTimeout*/
'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,
    _ = require('lodash'),

    // -- Components
    WidgetHeader = require('../../components/WidgetHeader.react'),
    ModelRunSelector = require('../../components/modelAnalysis/modelRunSelector.react'),
    RouteTotalGraph = require('../../components/modelAnalysis/routeTotalGraph.react'),
    ModelRunContainer = require('../../components/modelAnalysis/modelRunContainer.react'),
    TimeSliders = require('../../components/utils/TimeSliders.react'),
    TimeGraph = require('../../components/utils/TimeGraph.react'),
    ModelSummary= require('../../components/modelAnalysis/ModelSummary.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),
    // -- Stores
    FareboxStore =  require('../../stores/FareboxStore.js'),
    TripTableStore = require('../../stores/TripTableStore.js'),
    ModelRunStore = require('../../stores/ModelRunStore.js'),
    FarezoneFilterSelection = require('../../components/utils/FarezoneFilterSelection.react');

var i18n = {
    locales: ['en-US']
};

var numrexp = /[0-9]+/g;
var firstNum = function(str){
  if(str){
    var rez = str.match(numrexp);
    if(rez)
      return rez[0];
  }
  return null;
};


var MarketAreaIndex = React.createClass({

    mixins: [Router.State],

    statics: {

        willTransitionTo: function (transition, params) {
            //if the market area id has been specified in the url
            if(params.marketareaID){
              //make fire an action to set that as the current market area, supporting stateless transition
               MarketAreaActionsCreator.setCurrentMarketArea(params.marketareaID);
            }
        }

    },

    getInitialState: function(){
        return {
            //get the models that have been run
            model_runs:ModelRunStore.getModelRuns(),
            model_id:null,
            farebox:FareboxStore.getFarebox(this.props.marketarea.id),
        };
    },

    componentDidMount: function() { //after initial rendering subscribe to the ModelRunStore
        ModelRunStore.addChangeListener(this._onChange);
        TripTableStore.addChangeListener(this._onChange);
        FareboxStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() { //if component will be destroy kill subscription to the store
        ModelRunStore.removeChangeListener(this._onChange);
        FareboxStore.removeChangeListener(this._onChange);
    },
    componentWillUpdate : function(nextProps){
      if(this.props.marketarea.id !== nextProps.marketarea.id){
        this.setState(this.getInitialState());
      }
    },
    _onChange:function(){ //when a subscription has updated
        this.setState({//get the model runs from the store
            model_runs:ModelRunStore.getModelRuns(),
            farebox : FareboxStore.getFarebox(this.props.marketarea.id),
        });
    },
    _renderModelRuns:function(){
        //console.log('loaded Models',this.props.loadedModels)
        //if the models are not ready display nothing
        if(!this.props.loadedModels.initialized || this.props.loadedModels.loadedModels.length === 0){
            return (
                <span />
            );
        }
        //display 1 model run
        // console.log('Current Tracts',this.props.tracts);
        return (
            <div id='modelMap'>
                <ModelRunContainer
                    marketarea={this.props.currentMarketarea}
                    tracts={this.props.tracts}
                    routesGeo={this.props.routesGeo}
                    stopsGeo={this.props.stopsGeo}
                    data={this.props.loadedModels}
                    modelId={this.state.model_id || this.props.loadedModels.loadedModels[0]} />
            </div>
        );
    },
    _onTimeChange : function(range){
      var scope = this;
      // console.log(range);
      scope.setState({timeRange:range});
    },
    selectModel : function(id){
      this.setState({model_id:id});
    },
    // _getFilteredFareZones : function(){
    //   var scope = this;
    //   var zones = scope.props.stopsGeo.features.filter(function(d){
    //     return d.properties.fare_zone;
    //   }).map(function(d){return parseInt(d.properties.fare_zone.split(' ')[1]);});
    //   zones = _.uniq(zones);
    //   return (zones.length !== 0)?zones:null;
    // },
    _getFareboxTimes : function(){
      var scope =this;
      if(scope.state.useFarebox && scope.state.farebox.dimensions.hours){//if hours are defined
        var totalDays = scope.state.farebox.groups.run_date.size(); //get the # of days
        var fareZones = scope.state.fareFilter;
        var routes = scope.props.routesGeo.features.map(function(d){return d.properties.short_name;});
        var fareboxfilter={};
        if(fareZones){
          fareboxfilter.zone = function(d){
            var zones = d.split(';'); //get the route, boarding , and alightings
            var route = zones[0];     //get the route
            var boarding = zones[1], alighting = zones[2]; //get the b and as

            var validZone = fareZones.indexOf(boarding) >= 0;
                            //and alighting is in the list of farezones
                validZone = validZone && fareZones.indexOf(alighting) >= 0;
                            //or there are no excluded zones in which
                            //allow all
                validZone = validZone && routes.indexOf(route) >= 0;
            return validZone;
          };
        }
        if(scope.state.fareboxDates){
          //Get the date strings for valid dates
          var validDates = Object.keys(scope.state.fareboxDates).map(function(d){
            return (new Date(scope.state.fareboxDates[d])).toDateString();
          });
          totalDays = validDates.length;
          fareboxfilter.run_date = function(date){
            if(validDates.length === 0)
              return true;
            var valid = validDates.map(function(d){
                return date.toDateString() === d;
              });

            return valid.reduce(function(a,b){return a || b;});
          };
        }
        var data = FareboxStore.queryFarebox('hours',fareboxfilter).map(function(d){//get hour records
          var key = d.key.split(';'); //split the sort key
          //return the hour, the average value, the color, and the group.
          return {x:key[0]+':00',y:(d.value/totalDays), color:scope.props.marketarea.routecolors[key[1]], group:key[1]};
        });
        return {id:'farebox',data:data,options:{focus:true}};
      }
      return [];
    },
    _getFareZones : function(stops){

        var scope = this;
        var Farezones = {};

        FareboxStore.queryFarebox('zone',{},true).forEach(function(d){
          var keys = d.key.split(';');
          var line = keys[0], boarding = keys[1], alighting = keys[2];
          Farezones[line] = Farezones[line] || [];
          if(Farezones[line].indexOf(boarding) === -1){
            Farezones[line].push(boarding);
          }
          if(Farezones[line].indexOf(alighting) === -1){
            Farezones[line].push(alighting);
          }
        });
        var zoneMap = {}; //define a color map for the different zones.
        var zonei = 0; //and an index to avoid double colors
        Object.keys(Farezones).forEach(function(d){//for each route in the farezone
          Farezones[d] = Farezones[d].reduce(function(p,c){//reduce to single object
            if(!zoneMap[c]){//if color is not defined for the current zone
              zoneMap[c] = d3.scale.category20().range()[zonei%20];//add a color
              zonei = zonei + 1; //increment zone index
            }
            p[c] = {zone:c,color:zoneMap[c]}; //add to the object and entry for the zone
            return p; //return that object
          },{});//use reduce as an accumulator by starting with empty object, add to it
        });
        return {zones:Farezones,colors:zoneMap};

    },
    setFarezoneFilter : function(filter,dates){
      this.setState({fareFilter:filter,fareboxDates:dates});
    },
    _getTimeData : function(){
      var scope = this;
      if(scope.props.loadedModels.initialized){
      var buttonOptions = {action:true,focus:true,delete:true};
      var datasets =   scope.props.loadedModels.loadedModels.map(function(d){ //for each model loaded
          // console.log('Current Model',d);
          //consider only the current run only
          scope.props.loadedModels.dimensions.run_id.filter(d);
          //get the hour groupings for that particular dataset
          var data = scope.props.loadedModels.groups.hours.top(Infinity).map(function(d){
            var key = d.key.split(';'); //key[0] = hour of day,key[1] = route id
            var color = (scope.props.marketarea.routecolors)?scope.props.marketarea.routecolors[key[1]]:'#fff'; //get the routes color from the market area
            return {x:key[0]+':00',y:d.value,color:color,group:key[1]}; //build the record for the timeslider
          });
          scope.props.loadedModels.dimensions.run_id.filterAll();
          return {id:d,data:data,options:buttonOptions};
        });
        var fbTimes = scope._getFareboxTimes();
        datasets = datasets.concat(fbTimes);
        // console.log('datasets',datasets);
        return datasets;
      }
      return [];
    },
    deleteModel : function(id){
      ModelingActionsCreator.removeActiveModelRun(id);
      this.setState({model_id:null});
    },
    peaksCalculator : function(){
      var scope = this;
                    //default 6am - 10am as am peak hours
      var amPeak = this.props.marketarea.ampeak || [6,10];
                    //default 3pm - 7pm as pm peak hours
      var pmPeak = this.props.marketarea.pmpeak || [15,19];

      if(!this.props.loadedModels.initialized)
        return {};

      if(this.state.model_id)
        this.props.loadedModels.dimensions.run_id.filter(function(d){
          return d === scope.state.model_id;
        });
      var amPeakTotalsFB=0, pmPeakTotalsFB=0, FullTotalsFB=0,FBData;
      var amPeakTotals = 0, pmPeakTotals = 0, FullTotals = 0,FullData;
      FullData = this.props.loadedModels.groups.hours.top(Infinity);

      var hiFilter = function(d){
        var hour = parseInt(d.key.split(';')[0]);
        return (hour >= pmPeak[0]) && (hour <= pmPeak[1]);
      };
      var lowFilter = function(d){
        var hour = parseInt(d.key.split(';')[0]);
        return (hour >= amPeak[0]) && (hour <= amPeak[1]);
      };

      amPeakTotals = FullData.filter(lowFilter)
                      .reduce(function(a,b){return a + b.value;},0);

      pmPeakTotals = FullData.filter(hiFilter)
                      .reduce(function(a,b){return a + b.value;},0);

      FullTotals =   FullData.reduce(function(a,b){return a + b.value;},0);

      FBData = FareboxStore.queryFarebox('hours',{});

      amPeakTotalsFB  = FBData.filter(lowFilter)
                        .reduce(function(a,b){return a + b.value;},0);
      pmPeakTotalsFB  = FBData.filter(hiFilter)
                        .reduce(function(a,b){return a + b.value;},0);
      FullTotalsFB    = FBData.reduce(function(a,b){return a + b.value;},0);

      return {am:amPeakTotals,pm:pmPeakTotals,full:FullTotals,
              amfb:amPeakTotalsFB,pmfb:pmPeakTotalsFB,fullfb:FullTotalsFB};
    },
    _fareboxButton : function(){
      if(this.state.farebox && Object.keys(this.state.farebox.groups).length >0){
        return <a className='btn btn-lg btn-warning btn-block' onClick={this._addFarebox}>Toggle Farebox</a>;
      }
    },
    _addFarebox : function(){
      if(this.state.useFarebox)
        this.setState({useFarebox:false});
      else
        this.setState({useFarebox:true});
    },
    _getModelTimeGraph : function(){
      var scope = this;
      var keyMap = {};
      if(!this.props.loadedModels.initialized)
        return <div></div>;
      console.log('Model Analysis 248: loaded Models data',this.props.loadedModels);
      console.log('Current Model',this.state.model_id);
      this.props.loadedModels.dimensions.run_id.filter(function(d){
        return d === scope.state.model_id;
      });
      var minutes = this.props.loadedModels.groups.minutes.top(Infinity);
      this.props.loadedModels.dimensions.run_id.filterAll();
      minutes = minutes.map(function(d){
        var key = d.key.split(';');
        key[0] = key[0].split(':').map(function(t,i){
          if(i === 0){
            t = (parseInt(t) % 24).toString();
          }
          return t;
        }).join(':');
        return {x:key[0],route:key[1],y:d.value};
      });
      var routes = minutes.reduce(function(a,b,i){
        a[b.route]  = a[b.route] || [];
        a[b.route].push(b);
        return a;
      },{});
      var jx = 0;
      Object.keys(routes).forEach(function(d,i){
        keyMap[d] =  d3.scale.category20().range()[i%20];
        routes[d].map(function(route){
          route.color = keyMap[d];
          route.id = d;
        });
      });

      return (
        <TimeGraph
          width={400}
          keyMap={keyMap}
          keyTitle={'Route Key'}
          height={500}
          barWidth={10}
          opacity={0.9}
          rotateXLabels={90}
          data={minutes}
          filterable={true}
          titleSize={'14pt'}
          guides={5}
          title={'Route Trips throughout the Day'}
        />);


    },
    render: function() {
      var hourRange;
      console.log('Analysis State',this.state);
      if(this.state.timeRange){ //set the range of hours to filter the graph by
        hourRange = this.state.timeRange.map(function(d){return d.getHours();});
      }
      // console.log('models',this.props.loadedModels);
        return (
        	<div className="content container">
            	<h2 className="page-title">{this.props.marketarea.name} <small>Model Analysis</small>
                    <div className="btn-group pull-right">
                        <Link to="ModelAnalysis" params={{marketareaID:this.props.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Model Analysis
                        </Link>
                        <Link to="ModelCreate" params={{marketareaID:this.props.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Run New Models
                        </Link>
                    </div>
                </h2>

                <div className="row">

                    <div className="col-lg-12" >
                        <section className="widget">
                            <div className="body no-margin" style={{overflow:'hidden'}}>
                                <ModelRunSelector
                                  marketarea={this.props.marketarea}
                                  model_runs={this.state.model_runs}
                                  width={'40%'}
                                  onSelection={this.selectModel}
                                  />
                                  <FarezoneFilterSelection
                                    zones={this._getFareZones(this.props.stopsGeo).zones}
                                    onSelection ={this.setFarezoneFilter}
                                    width={'40%'}
                                    />
                                  <div style={{float:'left',width:'20%'}}>
                                      {this._fareboxButton()}
                                    </div>
                          </div>
                        </section>
                </div>
                </div>
                <div className='col-lg-6'>
                  <div className='row'>
                      {this._renderModelRuns()}
                  </div>
                  <div className='row'>
                    <ModelSummary
                        modelIds={this.props.loadedModels.loadedModels}
                        />
                    </div>
                </div>
                <div className='col-lg-6'>
                  <section className='widget'>
                    <div style={{width:'100%'}}>
                        <TimeSliders
                          datasets={this._getTimeData()}
                          height={100}
                          width={400}
                          maxHeight={300}
                          maxWidth={400}
                          onChange={this._onTimeChange}
                          delete ={this.deleteModel}
                          selection={this.selectModel}
                          actionText={'Map'}
                          />
                    </div>
                    <div style={{width:'100%'}}>
                        <RouteTotalGraph
                          colors={this.props.marketarea.routecolors}
                          timeFilter={hourRange}
                          routeData={this.props.loadedModels}
                          fareboxInit={this.state.useFarebox}
                          fareboxData={this.state.farebox}
                          zoneFilter = {this.state.fareFilter}
                          dateFilter = {this.state.fareboxDates}
                          summaryData = {this.peaksCalculator()}
                          />
                    </div>
                    <div style={{width:'100%'}}>

                    </div>
                  </section>

                </div>
            </div>

        );
    },

});

module.exports = MarketAreaIndex;
