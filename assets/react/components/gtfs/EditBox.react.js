'use strict';
/*globals confirm, console,module,require*/
/*jshint -W097*/
var React = require('react'),
    //comps
    StopEdit = require('./StopEdit.react'),
    TripEdit = require('./TripEdit.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
          stop:null,
        };
    },
    componentWillReceiveProps : function(nextProps,nextState){
      if(nextProps.data && nextProps.data.stop && (this.state.stop !== nextProps.data.stop)){
        var stop = this.props.stopSearch(nextProps.data.stop);
        this.setState({stop:stop});
      }
      else {
        this.setState({stop:null});
      }
    },
    form : function(){

      var jsx;
      if(this.props.active){
        if(this.state.stop){
          jsx += (
                <StopEdit saveInfo={this.props.saveStop} stop={this.state.stop}/>);
        }
        if(this.state.trip){
          jsx +=(<TripEdit saveInfo={this.props.saveTrip}
                            trip={this.state.trip}/>);
        }
        if(this.state.route){
          jsx += ( <RouteEdit saveInfo={this.props.saveRoute} route={this.state.route}/>);
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
