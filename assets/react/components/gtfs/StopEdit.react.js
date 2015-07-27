'use strict';
/*globals confirm, console,module,require*/
/*jshint -W097*/
var React = require('react'),
    //comps
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
            stopId:this.props.stop.getId(),
            stopCode:this.props.stop.getStopCode(),
            stopName:this.props.stop.getName(),
            stopDesc:this.props.stop.getStopDesc(),
            stopZoneId:this.props.stop.getZoneId(),
            stopUrl: this.props.stop.getStopUrl(),
            location_type: this.props.stop.getLocationType(),
            parent_station: this.props.stop.getParentStation(),
            stopTimeZone: this.props.stop.getStopTimeZone(),
            wheelchair_boarding: this.props.stop.getWheelchairBoarding(),
            editing:false,
        };
    },
    componentWillReceiveProps : function(nextProps,nextState){
      if(nextProps.stop && this.props.stop && (nextProps.stop.getId() !== this.props.stop.getId()) ){
        this.setState({
                      stopId:nextProps.stop.getId(),
                      stopCode:nextProps.stop.getStopCode(),
                      stopName:nextProps.stop.getName(),
                      stopDesc: nextProps.stop.getStopDesc(),
                      stopZoneId: nextProps.stop.getZoneId(),
                      stopUrl: nextProps.stop.getStopUrl(),
                      location_type:nextProps.stop.getLocationType(),
                      parent_station: nextProps.stop.getParentStation(),
                      stopTimeZone: nextProps.stop.getStopTimeZone(),
                      wheelchair_boarding: nextProps.stop.getWheelchairBoarding(),
                      editing:false,
                    });
      }
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
    _setAction : function(){
      var saveObj = {};
      //clone the object;
      var scope = this;
      Object.keys(scope.state).forEach(function(d){
        saveObj[d] = scope.state[d];
      });
      //add the old Id for a check;
      saveObj.oldId= this.props.stop.getId();
      var error = this.props.saveInfo(saveObj);
      if(!error)
        this.setState({editing:false});
      else{
        console.log(error);
      }
    },
    _cancel : function(){
        this.setState(this.getInitialState());
    },
    form : function(){
      var classes = 'btn btn-lg btn-warning',
      idchange = this._onChange('stopId'),
      nameChange = this._onChange('stopName'),
      codeChange = this._onChange('stopCode'),
      descChange = this._onChange('stopDesc'),
      zoneChange = this._onChange('stopZoneId'),
      urlChange =  this._onChange('stopUrl');
      //Need to add special components for
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
                <input type="text" className='form-control' onChange={idchange} value={this.state.stopId}/>
                <br/>
                <label>Stop Code:</label>
                <input type="text" className='form-control' onChange={codeChange} value={this.state.stopCode}/>
                <br/>
                <label>Stop Name: </label>
                <input type="text" className='form-control' onChange={nameChange} value={this.state.stopName}/>
                <br/>
                <label>Stop Description:</label>
                  <input type="text" className='form-control' onChange={descChange} value={this.state.stopDesc}/>
                  <br/>
                <label>Stop Zone Id:</label>
                  <input type="text" className='form-control' onChange={zoneChange} value={this.state.stopZoneId}/>
                  <br/>
                <label>Stop URL:</label>
                  <input type="text" className='form-control' onChange={urlChange} value={this.state.stopUrl}/>
                  <br/>

                <button className={classes} onClick={this._setAction}>{'set'}</button>
                <button className={classes} onClick={this._cancel}>{'cancel'}</button>
            </div>
        );

    },

    render: function() {

      if(!this.props.stop)
        return (<div></div>);
      else
        return this.form();
    }
});

module.exports = MarketAreaNew;
