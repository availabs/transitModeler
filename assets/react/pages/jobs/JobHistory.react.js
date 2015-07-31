/*globals require,module*/
'use strict'
var React = require('react'),
    DataTable = require('../../components/utils/DataTable.react'),
    JobStore = require('../../stores/JobStore');

var JobHistory = React.createClass({

  getInitialState: function(){
    var temp  = JobStore.getAll();
    return {
      jobs:this.props.jobhistory,
    };
  },
  componentWillReceiveProps : function(nextProps){
    if(this.props.jobhistory !== nextProps.jobhistory){
      this.setState({jobhistory:nextProps.jobhistory});
    }
  },
  render : function(){
    var history = [],
        active = [];
    this.state.jobs.forEach(function(d){
      if(d.isFinished){
        history.push(d);
      }else {
        active.push(d);
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
            <DataTable data={[]} pagination={true} columns={acolumns} rowValue={'key'}/>
          </section>
          <section className="widget">
            <h4>Finished Jobs</h4>
            <DataTable data={[]} pagination={true} columns={fcolumns} rowValue={'key'}/>
          </section>
        </div>
      </div>
    </div>);
  },
});
module.exports=JobHistory;
