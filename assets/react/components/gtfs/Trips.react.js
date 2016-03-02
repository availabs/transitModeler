'use strict';
/*globals confirm, console,module,require,$*/
var React = require('react'),
    //comps
    CreationForm     = require('./CreationForm.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores

var idGen = require('../utils/randomId');
var MarketAreaNew = React.createClass({
    getInitialState : function(){
      return {
        trips:this.props.route.trips,

      };
    },
    componentWillReceiveProps : function(nextProps){
      var nextState = this.state;
      if(nextProps.route.trips && (nextProps.route.trips !== this.props.route.trips) ){
          nextState.trips = nextProps.route.trips;
      }

      this.setState(nextState);

    },
    _crtTripButton : function(length){
      if(length >= 0 && !this.props.isCreating){
        return (
            <CreationForm
              values={{Headsign:'HeadSign'}}
              buttonText={"Create New Trip"}
              id={"trips"}
              saveAction={this.props.addTrip} />
          );
      }else{
        return (<div></div>);
      }
    },
    editTripClick : function() {
      this.props.editTrip();
    },
    editButton : function(ix){
      if(this.props.currentTrip !== null){
        return (<button onClick={this.editTripClick} type="button" width={'75%'} className="btn btn-danger">
          <i className="fa fa-pencil"></i> {' Edit Trip'}
        </button>);
      }
      else{
        return (<div></div>);
      }
    },
    render: function() {
        var buttons = <span/>,scope=this;
        if(this.props.route && this.props.route.trips){
          //if the current route is defined and we have a list of trips
          //render buttons to be able to select them.
          buttons = scope.state.trips.map(function(trip,i){
            var classes = "btn btn-lg btn-block";
            if(scope.props.currentTrip === i){
              classes+=' active';
            }
            if(trip.direction_id===0){
              classes+=' btn-success';
            }else if(trip.direction_id === 1){
              classes+=' btn-primary';
            }
            if(scope.props.isCreating && !scope.props.editing){
              return (
              <button id={'tooltip'} data-toggle={'tooltip'} data-placement={'left'}
                data-original-title={'Click Me to Begin'} style={{fontSize:'10px'}} className={classes}
              onClick={scope.props.onTripSelect.bind(null,i)}>
                                {trip.headsign }
              </button>
            );
            }
            return (
              <div>
              <div className='input-group-btn'>
              <button style={{fontSize:'10px'}} width={'75%'} className={classes}
              onClick={scope.props.onTripSelect.bind(null,i)}>
                          {trip.headsign}
              </button>
              </div>
            </div>
            );
          });
        }
        var divstyle = {
          'overflowY':'scroll',
          maxHeight:300,
        };
        return (
            <section className="widget">
                <div className="body no-margin" style={divstyle}>
                    {buttons}
                    {scope._crtTripButton(buttons.length)}
                </div>
                <div>
                  {scope.editButton()}
                </div>
            </section>
        );
    },
    componentDidUpdate : function(){
      if(this.props.isCreating){
        $('#tooltip.active').tooltip('show');
      }
    },
});

module.exports = MarketAreaNew;
