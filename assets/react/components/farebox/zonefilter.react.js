/*globals console,module,require,d3*/
/*jslint node: true*/
'use strict';
/*
  -Still need to fix color syncing between the stops and the farezones
  -- show and hide the list
  -- verify that zone filtering works on both sides
  -- then add the ability to save these filter lists *with name?
*/
var React = require('react'),
    _ = require('lodash'),
    Select2Component = require('../utils/Select2.react'),
    FareZoneFilterStore = require('../../stores/FarezoneFilterStore'),
    FarezoneActionsCreator = require('../../actions/FarezoneActionsCreator'),
    FarezoneFilterSummary   = require('../../components/modelAnalysis/FarezoneFilterSummary.react'),
    CreationForm = require('../gtfs/CreationForm.react');


var originalDates,originalFilter;
var numrexp = /[0-9]+/g;
var firstNum = function(str){
  if(str){
    var rez = str.match(numrexp);
    if(rez)
      return rez[0];
  }
  return null;
};
var validStringRegex = new RegExp('^[A-Za-z0-9\\.\\_\\-]*$');
var validInput = function(str){
  return (str.length < 1000) && validStringRegex.test(str);
};
var ZoneFilter = React.createClass({
  componentDidMount : function(){
    FareZoneFilterStore.addChangeListener(this._onChange);
  },
  componentWillUnmount : function(){
    FareZoneFilterStore.removeChangeListener(this._onChange);
  },
  _onChange : function(){
    this.setState({filters:FareZoneFilterStore.getFarezoneFilters()});
  },
  getInitialState : function(){
      return{
        exclusions : {},
        filters:FareZoneFilterStore.getFarezoneFilters(),
        selection : [],
        filterId : null,
      };
  },
  componentWillReceiveProps : function(nextProps){
    var flag  = 0;
    if(originalDates && !_.isEqual(originalDates,nextProps.dates)){
      flag = flag || 1;
    }
    if(flag && !this.state.dirty){
      console.log('!!!!!!!!!!!SETTING DATA DIRTY!!!!!!!!!!!');
      this.setState({dirty:true});
    }
  },
  zoneFilter : function(id,line){
    var scope = this;
    var excludes = scope.state.exclusions;
    var target = d3.select('#fare_zone'+id);
    excludes[line] = excludes[line] || [];
    var ix = excludes[line].indexOf(id);
    if(ix >=0){               //if that zone was already there
      excludes[line].splice(ix,1); //remove it
      target.style('background-color','white');
    }else{
      excludes[line].push(id);    //otherwise add it.
      target.style('background-color','gray');
    }
    var filteredZones = scope.currentFilter(scope.props.zones,excludes);
    var dirty = false;
    if(originalFilter && !_.isEqual(excludes,originalFilter) && !scope.state.dirty){
      dirty = true;
      console.log('!!!!!!!!!!!SETTING DATA DIRTY!!!!!!!!!!!');
    }
    scope.setState({exclusions:excludes,dirty:dirty},function(){
      scope.props.zoneFilter(filteredZones);
    });
  },

  currentFilter : function(zones,excludes){
    var scope = this;
    excludes = excludes || scope.state.exclusions;
    return excludes;
  },
  saveFilterAction : function(d){

    var data = {
                filtername:d.filter_name,
                filter:[this.state.exclusions],
                dates: this.props.dates,
                id : (this.state.dirty) ? -1:this.state.filterId,
              };
    if(data.filtername && data.filtername.length >= 1){
      console.log('Tried To Save',data);
      FarezoneActionsCreator.saveFilter(data);
    }
    else
      console.log('Fail to save');
  },
  onSelect : function(e,selection){
    var scope = this;
    var currfilter = scope.state.filters.reduce(function(a,b){
      if(b.id === selection.id)
        return b;
      else
        return a;
    },[]);
    var filteredZones = scope.currentFilter(scope.props.zones,currfilter.filter[0]);
    Object.keys(currfilter.dates).forEach(function(d){
        currfilter.dates[d] = new Date(currfilter.dates[d]);
    });
    var filteredDates = currfilter.dates;
    originalDates = _.cloneDeep(filteredDates);
    originalFilter = _.cloneDeep(filteredZones);
    scope.setState({filterId:selection.id,exclusions:currfilter.filter[0],dirty:false},function(){
      scope.props.zoneFilter(filteredZones,filteredDates);
    });
  },
  colortype : function(name,route){
    this.state.exclusions[route] = this.state.exclusions[route] || [];
    if(this.state.exclusions[route].indexOf(name) < 0)
      return 'white';
    else {
      return 'gray';
    }
  },
  filterNameInputChange : function(d){
    return validInput(d);
  },

  isActiveFilter : function() {
    var scope = this;
    var zones=scope.state.exclusions;
    var dates=scope.props.dates;
    var dataAmount = 0;
    dataAmount += Object.keys(zones).map(function(d){
      return zones[d].length;
    }).reduce(function(p,c){ return p + c;},0);
    dataAmount += Object.keys(dates).length;
    if(dataAmount > 0)
      return true;
    else {
      return false;
    }
  },

  renderSummary : function(){
    var scope = this;
    var zones=scope.state.exclusions;
    var dates=scope.props.dates;
    if(scope.isActiveFilter())
      return (
        <FarezoneFilterSummary
          zones={zones}
          dates={dates}
          />
      );
    else
      return (<span></span>);
  },

  render : function(){
    var scope = this;
    var rzones;
    if(!((Object.keys(scope.props.zones).length >0) && (Object.keys(scope.props.colors).length > 0)) )
      return <div></div>;
    if(!scope.props.route){
      rzones = {};
    }
    else{
      rzones = (<div className={'row'}>
                  <p>Current Route Zones</p>
                  {
                  Object.keys(scope.props.zones[scope.props.route]).map(function(d,i){
                    var name = d;
                    return (<div onClick={scope.zoneFilter.bind(null,name,scope.props.route)} style={{backgroundColor:scope.colortype(name,scope.props.route)}} id={'fare_zone'+name} className={'col-md-3'}>
                      <div className={'col-md-1'} style={{backgroundColor:scope.props.colors[d],width:'15px',height:'15px'}}></div>
                      <p>{d}</p>
                    </div>);
                  })
              }
              </div>);
    }
    var allowable = [];
    var currentZones = this.currentFilter(scope.props.zones);
    var zonelist = currentZones.toString();

    var filterSelect = scope.state.filters.map(function(d){
      return {id:d.id,'text':d.filtername};
    });
    var form;
    if(scope.isActiveFilter())
      form = (
        <CreationForm
          buttonText={'Save Filter'}
          id={'filterForm'}
          values={{'filter_name':'filtername'}}
          handleChange={this.filterNameInputChange}
          saveAction={this.saveFilterAction}
          invalidMessages={{'filter_name':'Invalid Filter Name'}}
          />
      );

    console.log('current filter',this.state.filters);
    return (
      <div>
        <h5>FareZone Filters</h5>
        <Select2Component
          id='FilterSelector'
          dataSet={filterSelect}
          multiple={false}
          styleWidth='50%'
          onSelection={scope.onSelect}
          placeholder={'Previous filters'}
          val={(scope.state.filterId)?[scope.state.filterId]:[]}
        />
      {(form)?form:<span></span>}
        {rzones}
        {scope.renderSummary()}
      </div>
    );
  },
});
module.exports = ZoneFilter;
