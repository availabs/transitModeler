/*globals require,module*/
'use strict'
var React = require('react'),
    DataTable = require('../../components/utils/DataTable.react');

var JobHistory = React.createClass({

  render : function(){
    var acolumns = [
      {key:'needskey',name:'Type'},
      {key:'needskey',name:'Time Started'},
      {key:'needskey',name:'Status'},
      {key:'needskey',name:'Progress'}
    ];
    var fcolumns = [
      {key:'needskey', name:'Type'},
      {key:'needskey', name:'Time Finished'},
      {key:'needskey', name:'Status'}
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
