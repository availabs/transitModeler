/*globals console,require,module,d3*/
'use strict';

var React = require('react'),

    // -- Components
    MarketAreaMap = require('../utils/MarketAreaMap.react'),
    FareboxGraph = require('./FareboxGraph.react'),
    AnalysisGraph = require('./AnalysisGraph.react'),
    DataTable = require('../utils/DataTable.react'),
    CalendarGraph = require('../utils/CalendarGraph.react'),
    SurveyFilters = require('../survey/SurveyFilters.react'),
    GraphDisplay = require('../survey/GraphDisplay.react'),
    Select2Component = require('../utils/Select2.react'),
    TimeGraph = require('../utils/TimeGraph.react'),
    TimeSlider = require('../utils/TimeSlider.react'),
    ZoneFilter = require('./zonefilter.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),

    // -- Stores
    _ = require('lodash'),
    FareboxStore = require('../../stores/FareboxStore');
    //TripTableStore = require('../../stores/TripTableStore'),

    // -- Comp Globals

var renderCount = 0;
var emptyGeojson = {type:'FeatureCollection',features:[]};
var numrexp = /[0-9]+/g;
var firstNum = function(str){
  if(str){
    var rez = str.match(numrexp);
    if(rez)
      return rez[0];
  }
  return null;
};
var timer;
var zoneCompareIndex = 2;
var FareboxRoutes = React.createClass({
  processor:{},
  getInitialState : function(){
    return {
      selection:[],
      timeRange:[],
    };
  },
  update : function(zones,e,selection){
    var scope = this;
    if(selection){
      this.setState({selection:[selection.id]});

      this.props.setRoute(selection.id,zones[selection.id]);
    }
    console.info('args',arguments);
  },
  removeRoute : function(){
    this.setState({selection:[]});
    this.props.removeRoute();
  },
  render : function(){
    var FareZones = {};
    this.props.stopsGeo.features.forEach(function(d){
        FareZones[d.properties.line] = FareZones[d.properties.line] || [];
        if(d.properties.fare_zone && FareZones[d.properties.line].indexOf(d.properties.fare_zone) === -1){
            var zones = d.properties.fare_zone.split(',').map(function(fz){
              return firstNum(fz);
            });
            FareZones[d.properties.line] = FareZones[d.properties.line].concat(zones);
        }
    });

    var selects = Object.keys(FareZones).map(function(d,i){
      return {id:d,text:d};
    });
    var clearbtn = null;
    if(this.state.selection.length === 1)
      clearbtn = <a className='btn btn-danger' onClick={this.removeRoute}>Clear Route</a>;
    return (
      <div>
      <Select2Component
            id="routesSelector"
            placeholder={'Select Route'}
            dataSet={selects}
            multiple={false}
            styleWidth={'100%'}
            onSelection={this.update.bind(null,FareZones)}
            val={this.state.selection}
            />
          {clearbtn}
        </div>);
  }

});


var FareboxAnalysis = React.createClass({

    forceRender:false,
    _validDate : function(date){
      var filters = this.state.filters,retval = true;
      var keys = Object.keys(filters);
      if(keys.length === 0){
        return true;
      }
      retval = keys.map(function(d){
          var fdate = filters[d];
          var val =  fdate.toDateString() === date.toDateString();
          return val;
      }).reduce(function(p,c){return p || c;});
      return retval;
    },
    _getStateFromStore:function(){
        return {
            farebox : FareboxStore.getFarebox(this.props.marketarea.id),
            filters:{},
            filter :[],
            colors:{},
            zones:[],
            zfilter:{},
            routeFilter:null,
        };
    },

    getInitialState: function(){
        this.calcData(true);
        return this._getStateFromStore();
    },

    componentDidMount: function() {
        FareboxStore.addChangeListener(this._onChange);
    },
    componentWillUpdate : function(nextProps,nextState){
      if( !_.isEqual(this.state.zones,nextState.zones)) //if the zones change
        this.calcData(true);
      if(!_.isEqual(this.state.farebox,nextState.farebox)){
        this.calcData(true);
      }
    },
    componentWillUnmount: function() {
        FareboxStore.removeChangeListener(this._onChange);
    },
    filterByZones : function(){
      var scope = this;
      return function(d){
        var zones = d.split(';'); //get the route, boarding , and alightings
        var route = zones[0];     //get the route
        var boarding = zones[1], alighting = zones[2]; //get the b and as
        var eZones = scope.state.zfilter;//get the valid zones
                        //it's a valid record if the boarding is not there
        if(!eZones[route])
          return true;
        var validZone = eZones[route].indexOf(boarding) == -1;
                        //and alighting is not there
            validZone = validZone || (eZones[route].indexOf(alighting) == -1);
                        //and boarding is in the list of farezones
                        //allow all
        return validZone;
      };
    },
    filterByRoute : function(id){
      var scope = this;
      return function(d){
        var route = d.split(',')[0];
        return route === id;
      };
    },

    filterByTime : function(timeRange){
      var scope = this;
      return function(d){
        var addhour = (timeRange && timeRange[1].getMinutes() > 0)? 1:0;
        if(scope.state.timeRange){
          var above = d.getHours() >= timeRange[0].getHours();
          var below = d.getHours() < timeRange[1].getHours() + addhour;
          return above && below;
        }
        return true;
      };
    },
    _onChange:function(){
        this.calcData(true);
        this.setState(this._getStateFromStore());
    },
    _processData:function(peak,range) {

        var scope = this;
        console.log('calculating ' + peak);
        if(this.state.farebox.initialized){
            //this problem wants the average number of transactions  per line via the given date(s);
            var timeRange = range || scope.state.timeRange;
            var fareboxFilter = {};
            console.log('time range',timeRange);
            fareboxFilter.zone = scope.filterByZones();
            fareboxFilter.run_time = scope.filterByTime(timeRange);
            var data = FareboxStore.queryFarebox('line',fareboxFilter);
            var finalData = data.filter(
              function(d){
                if(scope.state.route)
                  return scope.state.route === d.key;
                return true;
              }
            ).map(function(line){
              //need to filter by farezones
                var run_dates = FareboxStore.queryFarebox('run_date',{'line':scope.filterByRoute(line.key)},true);
                run_dates = run_dates.filter(function(d){return scope._validDate(d.key);});
                //filtering by Line
                var daySum = run_dates
                .map(function(d){
                    return {key:d.key,value:d.value};
                })
                .reduce(function(a,b){
                      return {value:(a.value + b.value)};
                });
                //return the route and the average fares collected
                var numdays = scope._getNumDays();
                return {key:line.key,value:(daySum.value/numdays)};
            });
            return [{key:'Time Peak',values:finalData}];
        }
        return [{key:'none',values:[]}];

    },
    _getNumDays : function(){
      return Object.keys(this.state.filters).length || this.state.farebox.groups.run_date.size();
    },
    _getHours : function(colors) {
      var scope = this;
      if(scope.state.farebox.dimensions.hours){ //if hours have been specified
        var fareboxFilters = {};
        if(scope.state.route){ //if there is a route filter
          //filter the routes to only contain elements from the filter list
          fareboxFilters.line = scope.filterByRoute(scope.state.route);
        }
        //filter the data by the date it was collected
        // scope.filterByTime();
        //get the number of days that farebox corresponds to.
        fareboxFilters.zone = scope.filterByZones();
        var totalDays = scope._getNumDays();
        var data = FareboxStore.queryFarebox('hours',fareboxFilters).map(function(d){
          var key = d.key.split(';');
          return {x:key[0]+':00',y:(d.value/totalDays), color:colors[key[1]], group:key[1]};
        });
       // console.log(data.map(function(d){return d.y;}).reduce(function(p,c){return p+c;}));
        return data;
      }
      return [];
    },
    componentWillReceiveProps:function(nextProps){
        //console.log(nextProps.marketarea.id,this.props.marketarea.id)
        if(nextProps.marketarea && nextProps.marketarea.id !== this.props.marketarea.id){
            //console.log('new ma',nextProps.marketarea.id)
            this.setState({
                farebox : FareboxStore.getFarebox(nextProps.marketarea.id),
            });
        }
    },
    calendarClick : function(d){
      var scope = this,
          colors = this.state.colors;
      console.log('data',d); //d is a YYYY-MM-DD string\
      var filters = this.state.filters;
      if(filters[d]){
        scope.filterClear(d);
      }else{
        var data = d.split('-');
        var date = new Date(data[0],data[1]-1,data[2]);
        filters[d] = date;
        colors[d] = d3.select('#d'+d).attr('fill');
        console.log(colors[d]);
        scope.calcData(true);
      }
      console.log('filters',filters,Object.keys(filters));
      this.setState({filters:filters,filter:Object.keys(filters),colors:colors});
    },
    _renderCalendars:function(){
        var scope = this;
        var rows= <span />;
        if(this.state.farebox.initialized){
             var yearsArray = {};
             FareboxStore.queryFarebox('run_year',{}).forEach(function(year){
                var currYear = year.key.getFullYear(),
                    yearData = {},
                    yearDays = FareboxStore.queryFarebox('run_date',{}).filter(function(d){
                        return d.key.getFullYear() === currYear;
                    });
                    yearDays.forEach(function(day){
                        var date = day.key.getDate();
                        var dayofmonth = (date < 10) ? '0'+(date) : date;
                        var month = day.key.getMonth().length < 9 ? '0'+(day.key.getMonth()+1) : (day.key.getMonth()+1);
                        yearData[day.key.getFullYear()+'-0'+month+'-'+dayofmonth] = parseInt(day.value);
                    });
                yearsArray[currYear] = yearData;
            });
            console.log('yearData',yearsArray);
            rows = Object.keys(yearsArray).map(function(key){
                //console.log('year',key)
                var graphId = 'cg_'+key;
                var year = key;
                return (
                    <CalendarGraph onClick={scope.calendarClick} filters={scope.state.filters} year={parseInt(year)} data={ yearsArray[key] }/>
                );
            });
        }
        return rows;

    },
    filterClear : function(id){
      this.calcData(true);
      var colors = this.state.colors;
      if(!id){ //if no id is given clear them all
        Object.keys(colors).forEach(function(d){
          d3.select('#d'+d).attr('fill',colors[d]);
        });
        this.setState({filters:{},filter:[]});
      }else{
        var filters = this.state.filters;
        delete filters[id];
        d3.select('#d'+id).attr('fill',colors[id]);
        delete colors[id];
        this.setState({filters:filters,filter:Object.keys(filters),colors:colors});
      }
    },
    calcData : function(reset,range){
      var scope = this;
      if(reset){
        scope.processor = _.memoize(function(string){
          return scope._processData(string,range);
        });
      }
    },

    setRoute : function(id,zones){
      zones = zones.reduce(function(p,c,i){
        p[c] = {zone:c,color:d3.scale.category20().range()[i%20]};
        return p;
      },{});
      this.setState({route:id,zones:zones});
    },
    delRoute : function(){
      this.setState({route:null,zfilter:{},zones:{}});
    },
    zoneFilter : function(zonefilter){
      console.log('zonefilter',zonefilter);
      this.calcData(true);
      this.setState({zfilter:zonefilter});

    },
    onSet : function(range){
      var scope = this;
      scope.calcData(true);
      this.setState({timeRange:range});

    },
    rowClick : function(e){
      var scope = this;
      var rid = e.target.getAttribute('data-key'); //get the route from the row

      scope.forceRender = true;
      if(this.state.routeFilter === rid){
          this.setState({routeFilter:null});
      }
      else{
          this.setState({routeFilter:rid});
      }
    },
    setStopColors : function(colormap){
      var scope = this;
      scope.props.stopsGeo.features.forEach(function(d){
        d.properties.color = colormap[firstNum(d.properties.fare_zone)] || '#fff';
      });
    },
    getZones : function(stops){
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
    render: function() {
        //console.log(this.state.farebox,this.state.farebox.all)
        var processData;
        var scope = this,
            fullDay = scope.processor();
        var colors = this.props.marketarea.routecolors;
        var TableData = fullDay[0].values.map(function(d,i){
            return {
                color: (<div style={{width:'20px',height:'20px',backgroundColor:colors[d.key]}}></div>),
                line:d.key,
                fullDay:Math.round(d.value)
            };
        }),
        cols = [
            {name:'Bus Line',key:'line'},
            {name:'Color Key',key:'color'},
            {name:'Full Day',key:'fullDay',summed:true}
        ];
        var calendars = this._renderCalendars();
        var routes = emptyGeojson;
        var stops = {type:"FeatureCollection",features:[]};
        routes.features = this.props.routesGeo.features.filter(function(d){
          return d.properties.short_name === scope.state.route;
        });
        stops.features = this.props.stopsGeo.features.filter(function(d){
          return scope.state.route === d.properties.line;
        });
        var zoneInfo = scope.getZones(this.props.stopsGeo); //get zone information
        scope.setStopColors(zoneInfo.colors); //set the color of the stops with the colormap
        var totalHours = scope._getHours(colors);
        console.log('totals',totalHours);

        var graphs =[
                    {type:FareboxGraph,data:fullDay,height:'250',colors:colors, label:'Full Day'},
        ];
        graphs = graphs.map(function(d){
          var retval = function(){
            return (React.createElement(d.type,d));
          };
          retval.settings = d;
          return retval;
        });
        console.log('filters',this.state.filters);
        return (
    	   <div>
                <div className="row">
                	<div className="col-lg-5" style={{overflow:'hidden'}}>
                        <MarketAreaMap
                            stops={stops}
                            routes={routes}
                            tracts ={this.props.tracts}
                            stopFareZones={true}/>
                         <section className="widget">
                           FareZones
                           <FareboxRoutes
                              stopsGeo={this.props.stopsGeo}
                              setRoute={this.setRoute}
                              removeRoute={this.delRoute}
                             />
                           <ZoneFilter
                             route = {this.state.route}
                             zoneFilter={this.zoneFilter}
                             zones = {zoneInfo.zones}
                             colors = {zoneInfo.colors}
                             dates = {this.state.filters}
                             />
                        </section>
                    </div>
                    <div className="col-lg-7">
                        <div className='row'>

                            <section className="widget" style={{overflow:'auto'}}>
                                <GraphDisplay items={graphs} height={500}/>
                                <TimeSlider
                                  onSet={this.onSet}
                                  width={500}
                                  data={totalHours}
                                  forceRender={scope.forceRender}
                                  putXAxis={true}
                                  range={scope.state.timeRange}
                                  />
                                <div className='col-lg-12'>
                                    <DataTable
                                      data={TableData}
                                      columns={cols}
                                      rowValue={'line'}
                                      rowClick={scope.rowClick}
                                       />
                                </div>
                                <div className='col-lg-12'>
                                    <h4>Available Data</h4>
                                    <SurveyFilters data={this.state.filters} buttonclick={this.filterClear}/>
                                    {calendars}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
        	</div>
        );
    },
    componentDidUpdate :function(){
      var scope = this;
      scope.forceRender=false;
    }
});

module.exports = FareboxAnalysis;
