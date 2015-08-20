/*globals console,require,module,d3*/
'use strict';

var React = require('react'),

    // -- Components
    MarketAreaMap = require('../utils/MarketAreaMap.react'),
    FareboxGraph = require('./FareboxGraph.react'),
    DataTable = require('../utils/DataTable.react'),
    CalendarGraph = require('../utils/CalendarGraph.react'),
    SurveyFilters = require('../survey/SurveyFilters.react'),
    GraphDisplay = require('../survey/GraphDisplay.react'),
    Select2Component = require('../utils/Select2.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),

    // -- Stores
    _ = require('lodash'),
    FareboxStore = require('../../stores/FareboxStore');
    //TripTableStore = require('../../stores/TripTableStore'),

    // -- Comp Globals

var renderCount = 0;
var emptyGeojson = {type:'FeatureCollection',features:[]};
var processor;
var timer;

var FareboxRoutes = React.createClass({
  getInitialState : function(){
    return {
      selection:[],
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

    console.log(selects);
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
            colors:{},
            zones:[],
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
            console.log('FareboxGraph',scope.state.farebox);

            var data = scope.state.farebox.groups.line.top(Infinity).map(function(line){
              //for each line
                if(peak){//if peak is defined
                    var lower = peak === 'am' ? 6 : 16,
                        upper = peak === 'am' ? 10 : 20;
                    timer = new Date();
                    scope.state.farebox.dimensions.run_time.filter(function(d,i){ //filter run times by the peak hours
                        return d.getHours() > lower && d.getHours() < upper && scope._validDate(d);
                    });
                    console.log('Render Time', ((new Date()) - timer)/1000);
                }else{
                  //otherwise just filter by the date
                   scope.state.farebox.dimensions.run_time.filter(scope._validDate);

                }

                scope.state.farebox.dimensions.line.filter(line.key);

                var daySum = scope.state.farebox.groups.run_date.top(Infinity).reduce(function(a,b){
                    return {value:(a.value + b.value)};
                });
                //console.log('daysum',scope.state.farebox.groups['run_date'].top(Infinity))
                return {key:line.key,value:(daySum.value/scope.state.farebox.groups.run_date.top(Infinity).length)};

            });
            return [{key:'Time Peak',values:data}];
        }
        return [{key:'none',values:[]}];

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

      this.setState({filters:filters,colors:colors});

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
    _renderFareZones:function(){
        var FareZones = {};
        this.props.stopsGeo.features.forEach(function(d){
            if(!FareZones[d.properties.line]){ FareZones[d.properties.line] = []; }
            if(d.properties.fare_zone && FareZones[d.properties.line].indexOf(d.properties.fare_zone) === -1){
                FareZones[d.properties.line].push(d.properties.fare_zone);
            }
        });
        return Object.keys(FareZones).map(function(key){

            var secondRow =  FareZones[key].map(function(d){
                return <td>{d}</td>;
            });

            return (
                <table className="table">
                    <tbody>
                        <tr colSpan={secondRow.length}>
                            <td colSpan={secondRow.length} style={{textAlign:'center'}}>{key}</td>
                        </tr>
                        <tr>{secondRow}</tr>
                    </tbody>
                </table>
            );
        });


    },
    filterClear : function(id){
      this.calcData(true);
      var colors = this.state.colors;
      if(!id){ //if no id is given clear them all
        Object.keys(colors).forEach(function(d){
          d3.select('#d'+d).attr('fill',colors[d]);
        });
        this.setState({filters:{}});
      }else{
        var filters = this.state.filters;
        delete filters[id];
        d3.select('#d'+id).attr('fill',colors[id]);
        delete colors[id];
        this.setState({filters:filters,colors:colors});
      }
    },
    calcData : function(reset){
      var scope = this;
      if(reset){
        processor = _.memoize(function(string){
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
    render: function() {
        //console.log(this.state.farebox,this.state.farebox.all)
        var processData;
        var scope = this,
            amPeak = processor('am'),
            pmPeak = processor('pm'),
            fullDay = processor();
        var TableData = amPeak[0].values.map(function(d,i){
            return {
                line:d.key,am:Math.round(d.value),pm:Math.round(pmPeak[0].values[i].value),fullDay:Math.round(fullDay[0].values[i].value)
            };
        }),
        cols = [
            {name:'Bus Line',key:'line'},
            {name:'AM Peak',key:'am',summed:true},
            {name:'PM Peak',key:'pm',summed:true},
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
          return (<div className={'col-md-3'}><div className={'col-md-1'} style={{backgroundColor:scope.state.zones[d].color,width:'15px',height:'15px'}}></div><p>{scope.state.zones[d].zone}</p></div>);
        })} </div>);
        var graphs =[
          {data:amPeak,groupName:'am',peak:'am',height:'250',colors:colors,label:'AM Peak (6am - 10am)'},
          {data:pmPeak,groupName:'pm',peak:'pm',height:'250',colors:colors,label:'PM Peak (4pm - 8pm)'},
          {data:fullDay,height:'250',colors:colors, label:'Full Day'},
        ];
        graphs = graphs.map(function(d){
          var retval = function(){
            return (React.createElement(FareboxGraph,d));
          };
          retval.settings = d;
          return retval;
        });
        // {this._renderFareZones()}
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
                        </section>

                    </div>
                    <div className="col-lg-7">
                        <div className='row'>

                            <section className="widget" style={{overflow:'auto'}}>
                                <GraphDisplay items={graphs} height={500}/>
                                <div className='col-lg-12'>
                                    <DataTable data={TableData} columns={cols} />
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
});

module.exports = FareboxAnalysis;
