/*globals d3,$,require,console,module,setTimeout,clearTimeout*/
'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,
    _ = require('lodash'),

    // -- Components
    MarketareaNav = require('../../components/marketarea/layout/marketareaNav.react'),
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
    MailStore = require('../../stores/ComponentMailStore.js'),
    FarezoneFilterSummary   = require('../../components/modelAnalysis/FarezoneFilterSummary.react'),
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
var mailId = 'ModelAnalysis';

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
	    fareSelect:[],
            fareboxDates:[],
        };
    },

    fareFilter : function(options){
      var scope = this;
      var totalDays = scope.state.farebox.groups.run_date.size(); // number of days
      var fareZones = scope.state.fareFilter;
      var routes = scope.props.routesGeo.features.map(function(d){return d.properties.short_name;});
      var fareboxFilter = {};
      if(fareZones){
        fareboxFilter.zone=function(d){
          var zones = d.split(';'); //get the route, boarding , and alightings
          var route = zones[0];     //get the route
          var boarding = zones[1], alighting = zones[2]; //get the b and as
          if(!fareZones[route])
            return true;

          var validZone = fareZones[route].indexOf(boarding) == -1;
                          //and alighting is in the list of farezones
              validZone = validZone || fareZones[route].indexOf(alighting) ==-1 ;
                          //or there are no excluded zones in which
                          //allow all
          return validZone;
        };
      }
      if(scope.state.fareboxDates && Object.keys(scope.state.fareboxDates).length !== 0){
        //Get the date strings for valid dates
        var validDates = Object.keys(scope.state.fareboxDates).map(function(d){
          return (new Date(scope.state.fareboxDates[d])).toDateString();
        });
        totalDays = validDates.length;
        fareboxFilter.run_date = function(date){
          if(validDates.length === 0)
            return true;
          var valid = validDates.map(function(d){
              return date.toDateString() === d;
            });

          return valid.reduce(function(a,b){return a || b;});
        };
      }
      if(options && options.noHours)
        return {filter:fareboxFilter,totalDays:totalDays};
      if(scope.state.timeRange ){
        var timeFilter = this.state.timeRange.map(function(d){return d.getHours();});
        fareboxFilter.hours = function(d){ //define time filter function
          var h = parseInt(d.split(';')[0]);
          return timeFilter[0] <= h && h <= timeFilter[1];
        };
      }
      return {filter:fareboxFilter,totalDays:totalDays};
    },
    componentDidMount: function() { //after initial rendering subscribe to the ModelRunStore
        ModelRunStore.addChangeListener(this._onChange);
        TripTableStore.addChangeListener(this._onChange);
        FareboxStore.addChangeListener(this._onChange);
        MailStore.addChangeListener(this._onMail);
    },

    componentWillUnmount: function() { //if component will be destroy kill subscription to the store
        ModelRunStore.removeChangeListener(this._onChange);
        FareboxStore.removeChangeListener(this._onChange);
        MailStore.removeChangeListener(this._onMail);
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

    _onMail : function(){
      var scope = this;

      var message = MailStore.getMail(mailId);
      if(message && message.subject === 'updateTime'){
        scope._onTimeChange(message.data);
      }
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
      console.log(range);
      scope.setState({timeRange:range});
    },
    selectModel : function(id){
      this.setState({model_id:id});
    },

    _getFareboxTimes : function(){
      var scope =this;
      if(scope.state.useFarebox && scope.state.farebox.dimensions.hours){//if hours are defined
        var fareboxfilter = scope.fareFilter({noHours:true});
        var data = FareboxStore.queryFarebox('hours',fareboxfilter.filter).map(function(d){//get hour records
          var key = d.key.split(';'); //split the sort key
          //return the hour, the average value, the color, and the group.
          return {x:key[0]+':00',y:(d.value/fareboxfilter.totalDays), color:scope.props.marketarea.routecolors[key[1]], group:key[1]};
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
    setFarezoneFilter : function(filter,dates,id){
      this.setState({fareFilter:filter,fareboxDates:dates,fareSelect:id});
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
      var models = this.props.loadedModels.dimensions.run_id.group().top(Infinity);
      var model_id;
      if(this.state.model_id !== id)
        return;
      else if(models[0])
        model_id = models[0].key || null;
      this.setState({model_id:model_id});
    },
    peaksCalculator : function(){
      var scope = this;
                    //default 6am - 10am as am peak hours
      var amPeak = this.props.marketarea.ampeak || [6,10];
                    //default 3pm - 7pm as pm peak hours
      var pmPeak = this.props.marketarea.pmpeak || [15,19];

      var totalDays = FareboxStore.queryFarebox('run_date',{}).length;
      var fareFilter = {};
      if(!this.props.loadedModels.initialized)
        return {};
      console.log(this.state.model_runs);
      var models = this.props.loadedModels.dimensions.run_id.group().top(Infinity);
      if(models.length === 0)
        return {am:0,pm:0,full:0,amfb:0,pmfb:0,fullfb:0,ampeak:amPeak,pmpeak:pmPeak};

      var model_id = this.state.model_id ||
                     models[0].key;

      this.props.loadedModels.dimensions.run_id.filter(function(d){
        return d === model_id;
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

      fareFilter  = scope.fareFilter(); //get the current farebox filter

      FBData = FareboxStore.queryFarebox('hours',fareFilter.filter);

      amPeakTotalsFB  = FBData.filter(lowFilter)
                        .reduce(function(a,b){return a + b.value;},0)/fareFilter.totalDays;
      pmPeakTotalsFB  = FBData.filter(hiFilter)
                        .reduce(function(a,b){return a + b.value;},0)/fareFilter.totalDays;
      FullTotalsFB    = FBData.reduce(function(a,b){return a + b.value;},0)/fareFilter.totalDays;

      return {am:amPeakTotals,pm:pmPeakTotals,full:FullTotals,
              amfb:amPeakTotalsFB,pmfb:pmPeakTotalsFB,fullfb:FullTotalsFB,
              ampeak:amPeak,pmpeak:pmPeak
            };
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
     renderHeader:function(){
      return (
        <div>
          <section className="widget">
            <div className="body no-margin" style={{overflow:'hidden'}}>
              <div className="row">

                <div className="col-lg-6" style={{paddingTop:10}}>

                  <ModelRunSelector
                    marketarea={this.props.marketarea}
                    model_runs={this.state.model_runs}
                    onSelection={this.selectModel}
                    loading = {this.props.loadedModels.loading}
                    />

                </div>
                <div className="col-lg-6" >
                    <div className="row">
                      <div className='col-xs-4'>
                        {this._fareboxButton()}
                      </div>
                      <div className='col-xs-8' style={{paddingTop:10}}>
                        <FarezoneFilterSelection
                            zones={this._getFareZones(this.props.stopsGeo).zones}
                            
	                    selection={this.state.fareSelect}
	                    onSelection ={this.setFarezoneFilter}
                            
                        />
                      </div>
	             
                    </div>



                </div>
              </div>
            </div>
          </section>
        </div>
      );
    },

    renderAnalysis:function(){
      var hourRange;
      if(this.state.timeRange){
        hourRange = this.state.timeRange.map(function(d){return d.getHours();});
      }
      return (
        <div>
          <div className='col-lg-6'>
            <div className='row'>
                {this._renderModelRuns()}
            </div>
            <div className='row'>
              <ModelSummary
                  modelIds={this.props.loadedModels.loadedModels}
                  />
            </div>
            <div className='row'>
              <FarezoneFilterSummary
                zones={this.state.fareFilter}
                dates={this.state.fareboxDates}
                />
            </div>
          </div>

          <div className='col-lg-6'  style={{paddingRight:0}}>
            <section className='widget'>
              <div style={{width:'100%'}} id="sliderDiv">
                  <TimeSliders
                    datasets={this._getTimeData()}
                    height={200}
                    width={400}
                    maxHeight={300}
                    maxWidth={600}
                    onChange={this._onTimeChange}
                    delete ={this.deleteModel}
                    selection={this.selectModel}
                    actionText={'Map'}
                    range={this.state.timeRange}
                    highlightId={this.state.model_id}
                    />
              </div>
              <div style={{width:'100%'}}>
                  <RouteTotalGraph
                    timeFilter = {hourRange}
                    colors={this.props.marketarea.routecolors}
                    routeData={this.props.loadedModels}
                    fareboxInit={this.state.useFarebox}
                    fareboxData={this.state.farebox}
                    summaryData = {this.peaksCalculator()}
                    fareFilter = {this.fareFilter}
                    mailId={'ModelAnalysis'}
                    />
              </div>
              <div style={{width:'100%'}}>

              </div>
            </section>

          </div>
        </div>
      );
    },
    renderEmpty:function(){
      var loading =  <img src={"/img/loading.gif"} style={{width:60,height:60}} />;
      return (
        <div className="col-lg-12" style={{padding:0,margin:0}}>
          <section className="widget">
            <div className="body no-margin" style={{overflow:'hidden',textAlign:'center'}}>
              <h4 style={{padding:150}}> {this.props.loadedModels.loading ? loading : 'No Model Selected' }</h4>
            </div>
          </section>
        </div>
      );
    },
    render: function() {

        return (
          <div className="content container">
            <MarketareaNav marketarea={this.props.marketarea}/>
            {this.renderHeader()}
            {Object.keys(this.props.loadedModels.loadedModels).length > 0 ? this.renderAnalysis() : this.renderEmpty()  }
          </div>

        );
    },

});

module.exports = MarketAreaIndex;
