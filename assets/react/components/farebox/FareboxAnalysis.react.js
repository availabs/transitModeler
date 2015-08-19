/*globals console,require,module*/
'use strict';

var React = require('react'),

    // -- Components
    MarketAreaMap = require('../utils/MarketAreaMap.react'),
    FareboxGraph = require('./FareboxGraph.react'),
    DataTable = require('../utils/DataTable.react'),
    CalendarGraph = require('../utils/CalendarGraph.react'),
    SurveyFilters = require('../survey/SurveyFilters.react'),

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),

    // -- Stores
    FareboxStore = require('../../stores/FareboxStore');
    //TripTableStore = require('../../stores/TripTableStore'),

    // -- Comp Globals



var FareboxAnalysis = React.createClass({



    _getStateFromStore:function(){
        return {
            farebox : FareboxStore.getFarebox(this.props.marketarea.id),
            filters:{}
        };
    },

    getInitialState: function(){
        return this._getStateFromStore();
    },

    componentDidMount: function() {
        FareboxStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        FareboxStore.removeChangeListener(this._onChange);
    },

    _onChange:function(){
        this.setState(this._getStateFromStore());
    },
    _processData:function(peak) {

        var scope = this;

        if(this.state.farebox.initialized){
            console.log('FareboxGraph',scope.state.farebox);

            var data = scope.state.farebox.groups.line.top(Infinity).map(function(line){

                if(peak){
                    var lower = peak === 'am' ? 6 : 16,
                        upper = peak === 'am' ? 10 : 20;

                    scope.state.farebox.dimensions.run_time.filter(function(d,i){

                        return d.getHours() > lower && d.getHours() < upper;
                    });
                }else{
                   scope.state.farebox.dimensions.run_time.filter(null);
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
      console.log('data',d); //d is a YYYY-MM-DD string\
      var filters = this.state.filters;
      if(filters[d]){
        delete filters[d];
      }else{
        var data = d.split('-');
        var date = new Date(data[0],data[1],data[2]);
        filters[d] = date;
      }
      this.setState({filters:filters});

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
      if(!id){ //if no id is given clear them all
        this.setState({filters:{}});
      }else{
        var filters = this.state.filters;
        delete filters[id];
        this.setState({filters:filters});
      }
    },
    render: function() {

        //console.log(this.state.farebox,this.state.farebox.all)
        var scope = this,
            amPeak = this._processData('am'),
            pmPeak = this._processData('pm'),
            fullDay = this._processData();

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
        console.log(this.state.filters);
        return (
    	   <div>


                <div className="row">
                	<div className="col-lg-5">

                        <MarketAreaMap
                            stops={this.props.stopsGeo}
                            routes={this.props.routesGeo}
                            tracts ={this.props.tracts}
                            stopFareZones={true}/>
                         <section className="widget">
                           FareZones
                           {this._renderFareZones()}

                        </section>

                    </div>
                    <div className="col-lg-7">
                        <div className='row'>

                            <section className="widget" style={{overflow:'auto'}}>
                                <div className="col-lg-4">
                                    <h4>AM Peak (6am - 10am)</h4>
                                    <FareboxGraph data={amPeak} groupName='am' peak='am' height='250' />
                                </div>
                                 <div className="col-lg-4">
                                  <h4>PM Peak (4pm - 8pm)</h4>
                                    <FareboxGraph data={pmPeak} groupName='pm' peak='pm' height='250' />
                                </div>
                                 <div className="col-lg-4">
                                  <h4>Full Day</h4>
                                    <FareboxGraph data={fullDay} height='250' />
                                </div>
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
    }
});

module.exports = FareboxAnalysis;
