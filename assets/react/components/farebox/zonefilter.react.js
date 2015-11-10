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
    CreationForm = require('../gtfs/CreationForm.react');

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
        exclusions : [],
        filters:FareZoneFilterStore.getFarezoneFilters(),
        selection : [],
      };
  },
  zoneFilter : function(id){
    var scope = this;
    var excludes = scope.state.exclusions;
    var target = d3.select('#fare_zone'+id);
    var ix = excludes.indexOf(id);
    if(ix >=0){               //if that zone was already there
      excludes.splice(ix,1); //remove it
      target.style('background-color','white');
    }else{
      excludes.push(id);    //otherwise add it.
      target.style('background-color','gray');
    }
    var filteredZones = scope.currentFilter(scope.props.zones,excludes);
    scope.setState({exclusions:excludes},function(){
      scope.props.zoneFilter(filteredZones);
    });
  },

  currentFilter : function(zones,excludes){
    var scope = this;
    excludes = excludes || scope.state.exclusions;
    return Object.keys(zones).map(function(route){
      return Object.keys(zones[route]);
    }).reduce(function(p,c){
      return _.union(p,c);
    }).filter(function(d){//then filter out any excluded ones
      return excludes.indexOf(d) < 0;
    }).sort(function(a,b){return parseInt(a)-parseInt(b);});
  },
  saveFilterAction : function(d){

    var data = {filtername:d.filter_name,filter:this.state.exclusions};
    if(data.filtername && data.filtername.length >= 1)
      FarezoneActionsCreator.saveFilter(data);
    else
      console.log('Fail to save');
  },
  onSelect : function(e,selection){
    var scope = this;
    var currfilter = scope.state.filters.reduce(function(a,b){
      if(b.id === selection.id)
        return b.filter;
      else
        return a;
    },[]);
    var filteredZones = scope.currentFilter(scope.props.zones,currfilter);
    scope.setState({selection:[selection.id],exclusions:currfilter},function(){
      scope.props.zoneFilter(filteredZones);
    });
  },
  colortype : function(name){
    if(this.state.exclusions.indexOf(name) < 0)
      return 'white';
    else {
      return 'gray';
    }
  },
  filterNameInputChange : function(d){
    return validInput(d);
  },
  render : function(){
    var scope = this;
    if(!this.props.route || !((Object.keys(scope.props.zones).length >0) && (Object.keys(scope.props.colors).length > 0)) )
      return <div></div>;

    var rzones = (<div className={'row'}>{
      Object.keys(scope.props.zones[this.props.route]).map(function(d,i){
        var name = d;
        return (<div onClick={scope.zoneFilter.bind(null,name)} style={{backgroundColor:scope.colortype(name)}} id={'fare_zone'+name} className={'col-md-3'}>
          <div className={'col-md-1'} style={{backgroundColor:scope.props.colors[d],width:'15px',height:'15px'}}></div>
          <p>{d}</p>
        </div>);
      })
    }</div>);
    var allowable = [];
    var currentZones = this.currentFilter(scope.props.zones);
    var zonelist = (<ul>{currentZones.map(function(d){
        return <li>{d}</li>;
      })}
    </ul>);
    var filterSelect = scope.state.filters.map(function(d){
      return {id:d.id,'text':d.filtername};
    });
    return (
      <div>
        <Select2Component
          id='FilterSelector'
          dataSet={filterSelect}
          multiple={false}
          styleWidth='50%'
          onSelection={scope.onSelect}
          placeholder={'Previous filters'}
          val={scope.state.selection}
        />
      <CreationForm
        buttonText={'Save Filter'}
        id={'filterForm'}
        values={{'filter_name':'filtername'}}
        handleChange={this.filterNameInputChange}
        saveAction={this.saveFilterAction}
        />
        <div>
        <p>Excluded</p>
        <a className='btn btn-danger' onClick={scope.saveFilter}>Save Filter</a>
        {scope.state.exclusions}
        </div>
        <p>Current Route Zones</p>
        {rzones}
        <p>Farezone Filter</p>
        {zonelist}
      </div>
    );
  },
});
module.exports = ZoneFilter;
