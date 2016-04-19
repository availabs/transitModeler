/*globals require,module,console*/
'use strict'

var React = require('react');


var SurveyFilters = React.createClass({
  getInitialState : function(){
    return {
      focus:null,
      index:null,
      oldheight:null,
    };
  },
  clickAction : function(ix){
    if(this.state.index === ix){
      this.props.items[ix].settings.height = this.state.oldheight;
      this.setState(this.getInitialState());
    }else{
      var h = this.props.items[ix].settings.height;
      this.setState({focus:true,index:ix,oldheight:h});
    }
  },
  render : function(){
    var scope = this;
    var elements;
    if(!this.state.focus){
      elements = this.props.items.map(function(d,i){
        return (
        <div className={"col-md-4"} onClick={scope.clickAction.bind(null,i)}>
          <h4><span>{d.settings.label === 'Full' ? 'Daily Ridership By Route' : d.settings.label}</span></h4>
          {d()}
        </div>
        );
      });
    }else{
      var ix = this.state.index;
      this.props.items[ix].settings.height = this.props.height;
      elements = (
        <div className=".col-lg-12"
              onClick={scope.clickAction.bind(null,ix)}>
              <h4><span>{this.props.items[ix].settings.label}</span></h4>
              {this.props.items[ix]()}
        </div>
          );
    }
    return(
    <div>
      {elements}
    </div>
  );
  }
});

module.exports=SurveyFilters;
