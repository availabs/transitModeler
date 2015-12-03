/*globals require,module,console*/
'use strict'

var React = require('react'),
    SurveyKeys = require('../../utils/data/surveyKeys');


var SurveyFilters = React.createClass({

  _createRows : function(){
      var scope = this;
      return Object.keys(scope.props.data).filter(function(d){
        return scope.props.data[d];
      })
      .map(function(d){
        var label;
        if(d.indexOf('_weight') >=0){
          label = d.substring(0,d.indexOf('_weight'));
          console.log(label,d.indexOf('_weight'));
        }else{
          label = d;
        }
          return (<tr>
            <td>{label}</td>
           <td>{SurveyKeys[label] ? SurveyKeys[label][scope.props.data[d]] : scope.props.data[d]}</td>
           <td><button className='btn btn-danger btn-sm' onClick={scope.props.buttonclick.bind(null,d)}>clear</button></td>
           </tr>);
       });
  },

  render : function(){

    var rows = this._createRows();
    var clrbtn,title;
    if(rows.length){
      clrbtn = (<button className='btn btn-danger btn-sm' onClick={this.props.buttonclick.bind(null,null)}>clear all</button>);
    }
    if(rows.length){
      title = <h4>Current Filters</h4>;
    }
    return (
      <div>
        {title}
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
