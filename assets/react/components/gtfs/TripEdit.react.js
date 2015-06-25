'use strict';

var React = require('react'),
    //comps
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
            tripId:this.props.trip.getId(),
            routeId:this.props.trip.getRouteId(),
            headsign:this.props.trip.getHeadSign(),
            editing:false,
        }
    },
    componentWillReceiveProps : function(nextProps,nextState){
      if(nextProps.stop && this.props.stop && (nextProps.stop.getId() !== this.props.stop.getId()) ){
        this.setState({
                      stopId:nextProps.stop.getId(),
                      stopName:nextProps.stop.getName(),
                      editing:false,
                    });
      }
    },
    _onChange : function(field){
        var scope = this;
        return function(e){
            var partialState = {}
            partialState[field] = e.target.value;
            scope.setState(partialState);
        }
    },
    _editAction : function(){
      this.setState({editing:true});
    },
    form : function(){
      if(!this.state.editing){
        var classes = 'btn btn-lg btn-warning'
        return (
            <div>
                <h4>ID: {this.state.stopId}
                </h4>

                <h4>Stop Name: {this.state.stopName}
                </h4>
                <button className={classes} onClick={this._editAction}>
                    {'edit'}
                </button>
            </div>
        );
      }
      return (
            <div>
                <label>ID: </label>
                <input type="text" onChange={this._onChange('stopId')} value={this.state.stopId}/>
                <br/>
                <label>Stop Name: </label>
                <input type="text" onChange={this._onChange('stopName')} value={this.state.stopName}/>
            </div>
        );

    },

    render: function() {

      if(!this.props.stop)
        return (<div></div>)
      else
        return this.form();
    }
});

module.exports = MarketAreaNew;
