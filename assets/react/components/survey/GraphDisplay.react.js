/*globals require,module,console*/
'use strict'

var React = require('react');


var SurveyFilters = React.createClass({
  getInitialState : function(){
    return {
      focus:null,
      index:null,
    };
  },
  clickAction : function(ix){
    if(this.state.index === ix){
      this.setState(this.getInitialState());
    }else{
      this.setState({focus:true,index:ix});
    }
  },
  render : function(){
    var scope = this;
    var elements;
    if(!this.state.focus){
      elements = this.props.items.map(function(d,i){
        return (
        <div className={"col-md-4"} onClick={scope.clickAction.bind(null,i)}>{d()}</div>
        );
      });
    }else{
      var ix = this.state.index;
      elements = (
        <div className=".col-lg-12"
              onClick={scope.clickAction.bind(null,ix)}>
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
