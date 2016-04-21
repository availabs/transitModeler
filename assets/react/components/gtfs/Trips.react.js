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
	if(nextProps.route.trips && 
	   (nextProps.route.trips !== this.props.route.trips) )
	{
            nextState.trips = nextProps.route.trips;
	}

      this.setState(nextState);

    },
    componentDidMount : function(){

    },
    componentWillUnmount : function(){

    },
    _crtTripButton : function(length){
	var scope =this;
	if(!this.state.trips) return <span></span>
	var trips = Object.keys(this.state.trips)
	                  .map(function(d){return scope.state.trips[d].isNew});
	var existsNew = trips.reduce(function(a,b){ return a || b });
      if(length >= 0 && !existsNew && !this.props.isCreating){
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
        return (<button 
	                onClick={this.editTripClick} 
	                type="button" 
	                width={'75%'} 
	                className="btn btn-danger">
                    <i className="fa fa-pencil"></i> 
	              {'Edit Trip'}
                 </button>);
      }
      else{
        return (<div></div>);
      }
    },
    drawTripButton : function(tripid){
	var scope = this;
	if(tripid)
	{
	    var classes = "btn btn-lg btn-block btn-default active ";
	    return (<button  
		style={{fontSize:'10px'}} 
		  id={'newTrip'} 
		  className={classes}
		  onClick={scope.props.onTripSelect.bind(null,tripid)}>
		  
		  {'Click to Drop Points'}
		  
		  </button>);
	}
	else
	{
	    return <span></span>;
	}
    },
    render: function() {
        var buttons = <span/>,scope=this;
	var trip_id;
        if(this.props.route && this.props.route.trips){
          //if the current route is defined and we have a list of trips
          //render buttons to be able to select them.
          buttons = Object.keys(scope.state.trips).map(function(tripid){
            var classes = "btn btn-lg btn-block";
	    var trip = scope.state.trips[tripid];
            if(scope.props.currentTrip === tripid){
              classes+=' active';
            }
            if(trip.direction_id===0){
              classes+=' btn-success';
            }else if(trip.direction_id === 1){
              classes+=' btn-primary';
            }
	    else{
	      classes+=' btn-info';
	    }
	      console.log('trip : ',trip);
            if(scope.props.isCreating && !scope.props.editing && 
	       trip.isNew){
		   trip_id = tripid;
		   return <span></span>
            }
            return (
              <div>
              <div className='input-group-btn'>
              <button style={{fontSize:'10px'}} width={'75%'} className={classes}
		onClick={(trip.direction_id===0 || trip.direction_id === 1)?scope.props.onTripSelect.bind(null,tripid):null}>
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
	            {Array.isArray(buttons) ? 'Service Headsigns':''}
                    {buttons}

                </div>
                <div>
	          {scope.drawTripButton(trip_id)}
	          {scope._crtTripButton(buttons.length)}
                  {scope.editButton()}
                </div>
            </section>
        );
    },
    componentDidUpdate : function(){

    },
});

module.exports = MarketAreaNew;
