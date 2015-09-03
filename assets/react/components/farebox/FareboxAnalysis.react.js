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
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),

    // -- Stores
    _ = require('lodash'),
    FareboxStore = require('../../stores/FareboxStore');
    //TripTableStore = require('../../stores/TripTableStore'),

    // -- Comp Globals

var renderCount = 0;
var emptyGeojson = {type:'FeatureCollection',features:[]};

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
  render : function(){
    var FareZones = {};
    this.props.stopsGeo.features.forEach(function(d){
        if(!FareZones[d.properties.line]){ FareZones[d.properties.line] = []; }
        if(d.properties.fare_zone && FareZones[d.properties.line].indexOf(d.properties.fare_zone) === -1){
            FareZones[d.properties.line].push(d.properties.fare_zone);
        }
    });

    var selects = Object.keys(FareZones).map(function(d,i){
      return {id:d,text:d};
    });


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
          return fdate.toDateString() == date.toDateString();
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
            zfilter:[],
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

    componentWillUnmount: function() {
        FareboxStore.removeChangeListener(this._onChange);
    },

    _onChange:function(){
        this.calcData(true);
        this.setState(this._getStateFromStore());
    },
    _processData:function(peak) {

        var scope = this;
        console.log('calculating ' + peak);
        if(this.state.farebox.initialized){
            timer = new Date();
            //this problem wants the average number of transactions  per line via the given date(s);
            scope.state.farebox.dimensions.zone.filterAll();
            scope.state.farebox.dimensions.run_time.filterAll();
            var data = scope.state.farebox.groups.line.top(Infinity).map(function(line){
              //need to filter by farezones
              scope.state.farebox.dimensions.zone.filter(function(d){
                var zones = d.split(';');
                 //return true if it matches any of the zones in the filter
                        //the filter is empty                    its boarding_zone is not in the filter    and   its alighting_zone is not in the filter
                return (scope.state.zfilter.length ===0) || ((scope.state.zfilter.indexOf(zones[0]) == -1) && (scope.state.zfilter.indexOf(zones[1]) == -1));
              });
                //for each line
                if(peak){//if peak is defined
                    var lower = peak === 'am' ? 6 : 16,
                        upper = peak === 'am' ? 10 : 20;

                    scope.state.farebox.dimensions.run_time.filter(function(d,i){ //filter run times by the peak hours
                        return d.getHours() > lower && d.getHours() < upper;
                    });

                }else{
                  //otherwise just filter by the date
                  console.log('time range',scope.state.timeRange);
                   scope.state.farebox.dimensions.run_time.filter(function(d){
                     if(scope.state.timeRange){
                       var above = d.getHours() >= scope.state.timeRange[0].getHours();
                       var below = d.getHours() <= scope.state.timeRange[1].getHours();
                       return above && below;
                     }
                     return true;
                   });
                }
                //filtering by Line
                scope.state.farebox.dimensions.line.filter(line.key);



                var daySum = scope.state.farebox.groups.run_date.top(Infinity)
                .map(function(d){
                  if(scope._validDate(d.key)){
                    return {key:d.key,value:d.value};
                  }else{
                    return {key:d.key,value:0};
                  }
                })
                .reduce(function(a,b){
                      return {value:(a.value + b.value)};
                });
                //return the route and the average fares collected
                return {key:line.key,value:(daySum.value/scope.state.farebox.groups.run_date.top(Infinity).length)};

            });
            console.log('Render Time', ((new Date()) - timer)/1000);
            return [{key:'Time Peak',values:data}];
        }
        return [{key:'none',values:[]}];

    },
    _getHours : function(colors) {
      var scope = this;
      if(scope.state.farebox.dimensions.hours){
        scope.state.farebox.clearFilter();
        if(scope.state.routeFilter){
          scope.state.farebox.dimensions.line.filter(scope.state.routeFilter);
        }
        var totalDays = scope.state.farebox.groups.run_date.size();
        var data = scope.state.farebox.groups.hours.top(Infinity).map(function(d){
          var key = d.key.split(';');
          return {x:key[0]+':00',y:(d.value/totalDays), color:colors[key[1]], group:key[1]};
        });
        console.log(data.map(function(d){return d.y;}).reduce(function(p,c){return p+c;}));
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
        var date = new Date(data[0],data[1],data[2]);
        filters[d] = date;
        colors[d] = d3.select('#d'+d).attr('fill');
        console.log(colors[d]);
        scope.calcData(true);
      }

      this.setState({filters:filters,filter:Object.keys(filters),colors:colors});
    },
    _renderCalendars:function(){
        var scope = this;
        var rows= <span />;
        if(this.state.farebox.initialized){
             var yearsArray = {};

            //console.log('Day data',this.props.agencyOverviewDay[type])
             this.state.farebox.groups.run_year.top(Infinity).forEach(function(year){
                var currYear = year.key.getFullYear(),
                    yearData = {},
                    yearDays = scope.state.farebox.groups.run_date.top(Infinity).filter(function(d){
                        return d.key.getFullYear() === currYear;
                    });

                    yearDays.forEach(function(day){
                        var month = day.key.getMonth().length === 1 ? '0'+day.key.getMonth() : day.key.getMonth();
                        //console.log(day.key.getFullYear()+'-0'+month+'-'+day.key.getDate())
                        yearData[day.key.getFullYear()+'-0'+month+'-'+day.key.getDate()] = parseInt(day.value);
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
    calcData : function(reset){
      var scope = this;
      if(reset){
        scope.processor = _.memoize(function(string){
          return scope._processData(string);
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
    zoneFilter : function(id){

      var target = d3.select('#fare_zone'+id);
      var zonefilter = this.state.zfilter;
      var ix = zonefilter.indexOf(id);
      if(ix > -1){
        zonefilter.splice(ix,1);
        target.style('background-color','white');
      }
      else{
        zonefilter.push(id);
        target.style('background-color','gray');
      }
      console.log('zonefilter',zonefilter);
      this.calcData(true);
      this.setState({zfilter:zonefilter});

    },
    routeData : function(){
      var scope = this;
      if(this.state.route){
        scope.state.farebox.clearFilter();
        var parts = {};
        var stopZones = Object.keys(scope.state.zones).map(function(d){return d.substring(zoneCompareIndex);});
        scope.state.farebox.groups.trip.top(Infinity).forEach(function(d){
          var keys = d.key.split(',');
          //This filters based on the known stop data ignoring other data
          if(keys[0] === scope.state.route ){
            console.log(keys,scope.state.route);
            parts[keys[1]] = parts[keys[1]] || [];
            parts[keys[1]].push({x:keys[2],y:d.value});
          }
        });
        var items = [];
        var keyMap = {},colors = d3.scale.category20().range();
        Object.keys(parts).forEach(function(d,i){
          parts[d].forEach(function(item){
            item.color = colors[i%20];
            item.id = d;
          });

          keyMap[d] = colors[i%20];
          items = items.concat(parts[d]);
        });
        console.log('color key',keyMap);

        return (
          <TimeGraph
            width={400}
            keyMap={keyMap}
            height={500}
            barWidth={10}
            opacity={0.9}
            rotateXLabels={90}
            data={items}
            filterable={true}
            titleSize={'14pt'}
            guides={5}
            title={'Yearly Trip Totals Throughout the Day'}
            />
        );
      }
      // return [{key:'none',values:[]}];
      return (<span></span>);
    },
    onSet : function(range){
      this.calcData(true);
      this.setState({timeRange:range});
    },
    rowClick : function(e){
      var scope = this;
      var rid = e.target.getAttribute('data-key');
      scope.forceRender = true;
      if(this.state.routeFilter === rid){
          this.setState({routeFilter:null});
      }
      else{
          this.setState({routeFilter:rid});
      }
    },
    render: function() {
        //console.log(this.state.farebox,this.state.farebox.all)
        var processData;
        var scope = this,
            //amPeak = scope.processor('am'),
            //pmPeak = scope.processor('pm'),
            fullDay = scope.processor();
        var TableData = fullDay[0].values.map(function(d,i){
            return {
                line:d.key,fullDay:Math.round(d.value)
            };
        }),
        cols = [
            {name:'Bus Line',key:'line'},
            //{name:'AM Peak',key:'am',summed:true},
            //{name:'PM Peak',key:'pm',summed:true},
            {name:'Full Day',key:'fullDay',summed:true}
        ];
        var calendars = this._renderCalendars();
        var colors = this.props.marketarea.routecolors;
        this.props.routesGeo.features.forEach(function(d){
           if(colors && colors[d.properties.short_name]){
             d.properties.color = colors[d.properties.short_name];
           }
        });
        var routes = emptyGeojson;
        var stops = {type:"FeatureCollection",features:[]};
        routes.features = this.props.routesGeo.features.filter(function(d){
          return d.properties.short_name === scope.state.route;
        });
        stops.features = this.props.stopsGeo.features.filter(function(d){
          return scope.state.route === d.properties.line;
        });
        stops.features.forEach(function(d,i){
          if(d.properties.fare_zone && scope.state.zones[d.properties.fare_zone])
            d.properties.color = scope.state.zones[d.properties.fare_zone].color;
        });
        var zones =( <div className={'row'}> {Object.keys(this.state.zones).map(function(d,i){
          var name = d.substring(zoneCompareIndex);
          return (<div onClick={scope.zoneFilter.bind(null,name)} id={'fare_zone'+name} className={'col-md-3'}><div className={'col-md-1'} style={{backgroundColor:scope.state.zones[d].color,width:'15px',height:'15px'}}></div><p>{scope.state.zones[d].zone}</p></div>);
        })} </div>);
        var totalHours = scope._getHours(colors);
        console.log('totals',totalHours);
        var timeGraph = this.routeData();

        var graphs =[
          //{type:FareboxGraph,data:amPeak,groupName:'am',peak:'am',height:'250',colors:colors,label:'AM Peak (6am - 10am)'},
          //{type:FareboxGraph,data:pmPeak,groupName:'pm',peak:'pm',height:'250',colors:colors,label:'PM Peak (4pm - 8pm)'},
          {type:FareboxGraph,data:fullDay,height:'250',colors:colors, label:'Full Day'},
        ];
        graphs = graphs.map(function(d){
          var retval = function(){
            return (React.createElement(d.type,d));
          };
          retval.settings = d;
          return retval;
        });
        console.log('state range',this.state.timeRange);
        return (
    	   <div>
                <div className="row">
                	<div className="col-lg-5">
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
                             />
                           {zones}
                           {timeGraph}
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
