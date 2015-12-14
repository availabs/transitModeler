var React = require('react');


var ReactStoreInput = React.createClass({

 
  // componentWillReceiveProps : function(nextProps){
  //     if(nextProps.value !== null && nextProps.value !== undefined && nextProps.value !== this.state.value)
  //       this.setState({value:nextProps.value});
  // },

  _isValid : function(element){
      return typeof element.length !== 'undefined'  && element.length < 1000;
  },

  _onChangeAction : function(e){
    var scope = this;
    var obj = {};
    var value = e.target.value;
    var val;
    if(scope.props.isNum && scope.props.isValid(value) && scope.props.bubbleup){
      val = parseFloat(value);
      obj[scope.props.propName] = val;
      console.log('change value ',scope.props.propName)
      scope.props.bubbleup(obj);
    }
    //scope.setState({value:e.target.value});
  },

  render : function(){
    var scope = this;
    var type = this.props.isNum ? 'number' : 'text'
    return <input
            className='form-control'
            type={type}
            value={scope.props.value}
            onChange={scope._onChangeAction}
            />;
  },

});

module.exports = ReactStoreInput;
