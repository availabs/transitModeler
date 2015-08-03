/*globals require,module,console*/
'use strict'
var React = require('react'),
    DataTable = require('../../components/utils/DataTable.react'),
    JobStore = require('../../stores/JobStore'),
    SailsWebApi=require('../../utils/sailsWebApi');
var obj2array = function(obj){
  var arr = [];
  Object.keys(obj).forEach(function(d){arr.push(obj[d]);});
  return arr;
};
var reg = /:\d\d /;
var getHistory = function(){
  SailsWebApi.read({type:'job',options:{
    limit:300,sort:"updatedAt DESC"
  }});
};
var JobHistory = React.createClass({

  getInitialState: function(){
    var jobs  = this.props.jobhistory;
    return {
      jobs:jobs,
      active:this.props.activeJobs,
    };
  },
  componentDidMount : function(){
    getHistory();
  },
  componentWillReceiveProps : function(nextProps){
    if(this.props.jobhistory !== nextProps.jobhistory){
      this.setState({jobs:nextProps.jobhistory});
    }
    console.log('num active jobs',this.props.activeJobs.length,nextProps.activeJobs.length);
    if(this.props.activeJobs !== nextProps.activeJobs &&
      this.props.activeJobs.length !== nextProps.activeJobs.length){
      this.setState({active:nextProps.activeJobs});
      getHistory();
    }
  },
  render : function(){
    var history = [],
        active = [];

    this.state.jobs.forEach(function(d){
      var t = new Date(d.updatedAt);
      t = t.toLocaleString();
      d.updatedAt =  t.replace(reg,' ').replace(',','');
      
      if(d.isFinished){
        history.push(d);
      }
    });
    var acolumns = [
      {key:'type',name:'Type'},
      {key:'start',name:'Time Started'},
      {key:'status',name:'Status'},
      {key:'progress',name:'Progress'}
    ];
    var fcolumns = [
      {key:'type', name:'Type'},
      {key:'updatedAt', name:'Time Finished'},
      {key:'status', name:'Status'}
    ];
    return (<div className="content container">
      <h2 className="page-title">{"Jobs History"} </h2>
      <div className="row" >
        <div className="col-lg-8">
          <section className="widget">
            <h4>Active Jobs</h4>
            <DataTable data={this.state.active} pagination={true} columns={acolumns} rowValue={'key'}/>
          </section>
          <section className="widget">
            <h4>Finished Jobs</h4>
            <DataTable data={history} pagination={true} columns={fcolumns} rowValue={'key'}/>
          </section>
        </div>
      </div>
    </div>);
  },
});
module.exports=JobHistory;
