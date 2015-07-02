'use strict';
/*globals confirm, console,module,require*/
/*jshint -W097*/
var React = require('react'),
    //comps
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores

var buildStateObj = function(route){
  return {
    routeId:route.getId(),
    agencyId:route.getAgencyId(),
    route_short_name:route.getRouteShortName(),
    route_long_name:route.getRouteLongName(),
    route_desc: route.getRouteDesc(),
    route_type: route.getRouteType(),
    route_url:  route.getRouteUrl(),
    route_color:route.getRouteColor(),
    route_text_color:route.getRouteTextColor(),
    editing:false,
  };
};
var MarketAreaNew = React.createClass({

    getInitialState:function(){
      return buildStateObj(this.props.route);
    },
    componentWillReceiveProps : function(nextProps,nextState){
      if(nextProps.route && this.props.route && (nextProps.route.getId() !== this.props.route.getId()) ){
        this.setState(buildStateObj(nextProps.route));
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
      var saveObj = {}, scope = this;
      //clone the object;

      Object.keys(this.state).forEach(function(d){
        saveObj[d] = scope.state[d];
      });
      //add the old Id for a check;
      var error = this.props.saveInfo(saveObj);
      if(!error)
        this.setState({editing:false});
      else{
        console.log(error);
      }
    },
    _cancel : function(){
        this.setState(buildStateObj(this.props.route));
    },
    form : function(){
      var classes = 'btn btn-lg btn-warning',
      idchange = this._onChange('routeId'),
      agencyChange = this._onChange('agencyId'),
      RSNChange    = this._onChange('route_short_name'),
      RLNChange    = this._onChange('route_long_name'),
      descChange   = this._onChange('route_desc'),
      urlChange    = this._onChange('route_url');
      //Need to add special components for
      if(!this.state.editing){
        return (
            <div>
                <h4>Route ID: {this.state.routeId}
                </h4>

                <h4>Route Short Name: {this.state.route_short_name}
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
                <input type="text" onChange={idchange} value={this.state.routeId}/>
                <br/>
                <label>Agency_id: </label>
                <input type="text" onChange={agencyChange} value={this.state.agencyId}/>
                <br/>
                <label>Route Short Name: </label>
                <input type="text" onChange={RSNChange} value={this.state.route_short_name}/>
                <br/>
                <label>Route Long Name: </label>
                <input type="text" onChange={RLNChange} value={this.state.route_long_name}/>
                <br/>
                <label>Route Desc: </label>
                <input type="text" onChange={descChange} value={this.state.route_desc}/>
                <br/>
                <label>URL: </label>
                <input type="text" onChange={urlChange} value={this.state.route_url}/>
                <br/>

                <button className={classes} onClick={this._setAction}>{'set'}</button>
                <button className={classes} onClick={this._cancel}>{'cancel'}</button>
            </div>
        );

    },

    render: function() {

      if(!this.props.route)
        return (<div></div>);
      else
        return this.form();
    }
});

module.exports = MarketAreaNew;
