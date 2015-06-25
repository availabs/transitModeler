'use strict';

var React = require('react'),
    //comps
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
            stopId:this.props.stop.getId(),
            stopName:this.props.stop.getName(),
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
    _setAction : function(){
      var error = this.props.saveInfo({
                        oldId: this.props.stop.getId(),
                        stopId:this.state.stopId,
                        stopName:this.state.stopName,
                    })
      if(!error)
        this.setState({editing:false});
      else{
        console.log(error);
      }
    },
    _cancel : function(){
        this.setState({
            stopId:this.props.stop.getId(),
            stopName:this.props.stop.getName(),
            editing:false,
          })
    },
    form : function(){
      var classes = 'btn btn-lg btn-warning'
      if(!this.state.editing){
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
                <br/>
                <button className={classes} onClick={this._setAction}>{'set'}</button>
                <button className={classes} onClick={this._cancel}>{'cancel'}</button>
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
