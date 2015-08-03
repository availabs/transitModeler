/*globals require,module,console*/
'use strict'
var React = require('react'),
    DataTable = require('../../components/utils/DataTable.react'),
    JobStore = require('../../stores/JobStore'),
    SailsWebApi=require('../../utils/sailsWebApi');

var reg = /:\d\d /;
var JobHistory = React.createClass({
  getDefaultProps : function(){
    return {
      title:'Jobs',
      jobs:[],
      pagination:false,
      length:15,
      columns:[
        {key:'type', name:'Type'},
        {key:'updatedAt', name:'Time Finished'},
        {key:'status', name:'Status'}
      ],
      criteria:null,
    };
  },
  render : function(){
    var scope = this;
    var jobs = this.props.jobs.filter(function(d){
      var t = new Date(d.updatedAt);
      t = t.toLocaleString();
      d.updatedAt =  t.replace(reg,' ').replace(',','');
      if(scope.props.criteria){
        return scope.props.criteria(d);
      }
      return true;
    });

    return (
          <section className="widget">
            <h4>{this.props.title}</h4>
            <DataTable
              data={jobs}
              pagination={this.props.pagination}
              length={this.props.length}
              columns={this.props.columns}
              rowValue={'key'}/>
          </section>
        );
  },
});
module.exports=JobHistory;
