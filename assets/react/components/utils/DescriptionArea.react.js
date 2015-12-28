/*globals console,module,require,d3*/
/*jslint node: true*/
'use strict';

var React = require('react'),
    _ = require('lodash'),
    FareZoneFilterStore = require('../../stores/FarezoneFilterStore'),
    FarezoneActionsCreator = require('../../actions/FarezoneActionsCreator'),
    FarezoneFilterSummary   = require('../../components/modelAnalysis/FarezoneFilterSummary.react');



var validStringRegex = new RegExp('^[A-Za-z0-9\\.\\_\\-]*$');
var validInput = function(str){
  return (str.length < 1000) && validStringRegex.test(str);
};
var ZoneFilter = React.createClass({
  componentDidMount : function(){

  },
  componentWillUnmount : function(){

  },
  _onChange : function(e){
    this.props.onChange(e.target.value);
  },
  getInitialState : function(){
    return {
      text:this.props.text || '',
    };
  },
  componentWillReceiveProps : function(nextProps){
    if(typeof nextProps.text !== 'undefined' && nextProps.text !== null){
      this.setState({text:nextProps.text});
    }
  },
  render : function(){
    var scope = this;

    return (
      <div className='col-lg-12'>
        <textarea
          className='form-control'
          rows='5' id='description'
          placeholder={'Enter a Description'}
          value={scope.state.text}
          onChange={scope._onChange}/>
      </div>
    );
  },
});
module.exports = ZoneFilter;
