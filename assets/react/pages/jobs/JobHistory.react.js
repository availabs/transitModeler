/*globals require,module,console*/
'use strict'

var React = require('react'),
    DataTable = require('../../components/utils/DataTable.react'),
    Display = require('../../components/job/JobDisplay.react'),
    JobStore = require('../../stores/JobStore'),
    SailsWebApi=require('../../utils/sailsWebApi');
var obj2array = function(obj){
  var arr = [];
  Object.keys(obj).forEach(function(d){arr.push(obj[d]);});
  return arr;
};
var reg = /:\d\d /;
var tFormat = function(date){
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};
var JobHistory = React.createClass({
  criteria : function(d){
    return d.isFinished;
  },
  render : function(){
    var acolumns = [
      {key:'type',name:'Type'},
      {key:'start',name:'Time Started',format:function(d){return tFormat(new Date(d.start));}},
      {key:'status',name:'Status'},
      {key:'progress',name:'Progress'}
    ];


    return (
      <div className="content container">
      <h2 className="page-title">{"Jobs History"} </h2>
      <div className="row" >
        <div className="col-lg-8">
          <Display
            title={'Active Jobs'}
            jobs={this.props.activeJobs}
            pagination={true}
            length={15}
            columns={acolumns}/>
          <Display
            title={'Finished Jobs'}
            jobs={this.props.jobhistory}
            criteria={this.criteria}
            pagination={true}
            length={15}
            />
        </div>
      </div>
    </div>);
  },
});
module.exports=JobHistory;
