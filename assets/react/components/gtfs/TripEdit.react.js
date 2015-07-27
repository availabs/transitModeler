'use strict';

var React = require('react'),
    //comps
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
            id:this.props.trip.getId(),
            headsign:this.props.trip.getHeadSign(),
            editing:false,
        };
    },
    componentWillReceiveProps : function(nextProps,nextState){

    },
    _onChange : function(field){
        var scope = this;
        return function(e){
            var partialState = {};
            partialState[field] = e.target.value;
            scope.setState(partialState);
        };
    },
    _editAction : function(){
      this.setState({editing:true});
    },
    _cancel : function(){
      this.setState(this.getInitialState());
    },
    _setAction : function(){
      var saveObj = {};
      //clone the object;
      var scope = this;
      Object.keys(scope.state).forEach(function(d){
        saveObj[d] = scope.state[d];
      });
      var error = this.props.saveInfo(saveObj);
      if(!error)
        this.setState({editing:false});
      else{
        console.log(error);
      }
    },
    form : function(){
      var classes = 'btn btn-lg btn-warning';
      if(!this.state.editing){
        return (

            <div>
                <h4>ID: {this.state.id}
                </h4>

                <h4>HeadSign: {this.state.headsign}
                </h4>
                <button className={classes} onClick={this._editAction}>
                    {'edit'}
                </button>
            </div>
        );
      }
      // <label>ID: </label>
      // <input type="text" onChange={this._onChange('id')} value={this.state.stopId}/>
        // <br/>
      return (
            <div>


                <label>HeadSign: </label>
                <input type="text" onChange={this._onChange('headsign')} value={this.state.headsign}/>
                <br/>
                <button className={classes} onClick={this._setAction}>{'set'}</button>
                <button className={classes} onClick={this._cancel}>{'cancel'}</button>
            </div>
        );

    },

    render: function() {

      if(!this.props.trip)
        return (<div></div>);
      else
        return this.form();
    }
});

module.exports = MarketAreaNew;
