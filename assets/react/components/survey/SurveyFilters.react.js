/*globals require,module*/
'use strict'

var React = require('react');


var SurveyFilters = React.createClass({

  _createRows : function(){
      var scope = this;
      return Object.keys(scope.props.data).filter(function(d){
        return scope.props.data[d];
      })
      .map(function(d){
          return (<tr>
            <td>{d}</td>
           <td>{scope.props.data[d]}</td>
           <td><button className='.btn .btn-danger .btn-sm' onClick={scope.props.buttonclick.bind(null,d)}>clear</button></td>
           </tr>);
       });
  },

  render : function(){

    var rows = this._createRows();
    var clrbtn;
    if(rows.length){
      clrbtn = (<button className='.btn .btn-danger .btn-sm' onClick={this.props.buttonclick.bind(null,null)}>clear all</button>);
    }
    return (
      <div>
      <h4>Current Filters</h4>

      <table className='table'>
        <thead><th>Filter</th> <th>Value</th><th></th></thead>
        <tbody>
          {rows}
        </tbody>
      </table>
      {clrbtn}
    </div>
  );
  }
});

module.exports=SurveyFilters;
