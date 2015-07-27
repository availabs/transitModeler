'use strict';
/*globals confirm, console,module,require*/
/*jshint -W097*/
var React = require('react'),
    //comps
    StopEdit = require('./StopEdit.react'),
    TripEdit = require('./TripEdit.react'),
    RouteEdit= require('./RouteEdit.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),

    // -- Stores
    RouteObj = require('./Gtfsutils').RouteObj;
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
          stop:null,
          route:null,
          trip:null,
        };
    },
    componentWillReceiveProps : function(nextProps,nextState){
      if(nextProps.data && nextProps.data.stop ){
        this.setState({stop:nextProps.data.stop,route:null,trip:null});
      }
      else {
        this.setState({stop:null});
      }
      if(nextProps.data && nextProps.data.route){
          this.setState({route:nextProps.data.route,stop:null,trip:null});
      }
      else{
        this.setState({route:null});
      }
      if(nextProps.data && nextProps.data.trip ){
        this.setState({trip:nextProps.data.trip,route:null,stop:null});
      }
      else{
        this.setState({trip:null});
      }
    },
    form : function(){

      var jsx;
      if(this.props.active){
        if(this.state.stop){
          jsx = (
                <StopEdit saveInfo={this.props.saveStop} stop={this.state.stop}/>);
        }
        if(this.state.trip){
          jsx =(<TripEdit saveInfo={this.props.saveTrip}
                            trip={this.state.trip}/>);
        }
        if(this.state.route){
          jsx= (<RouteEdit saveInfo={this.props.saveRoute}
                           route={this.state.route}/>);
        }

        return jsx;
      }
      else
        return (<div></div>);
    },

    render: function() {

      return (
          <section className="widget">
                <div className="body no-margin" >
                  {this.form()}
                </div>
            </section>
        );
    }
});

module.exports = MarketAreaNew;
