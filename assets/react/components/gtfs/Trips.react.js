'use strict';
/*globals confirm, console,module,require*/
var React = require('react'),
    //comps
    CreationForm     = require('./CreationForm.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores

var idGen = require('./randomId');
var MarketAreaNew = React.createClass({
    getInitialState : function(){
      return {
        trips:this.props.route.trips,
      };
    },
    _crtTripButton : function(length){
      if(length < 2)
        return (
            <CreationForm
              values={{Service_Id:idGen('Service'), Trip_Id:idGen('Id'),Shape_Id:idGen('Shape'),Headsign:idGen('HeadSign')}}
              buttonText={"Create New Trip"}
              id={"trips"}
              saveAction={this.props.addTrip} />
          );
      else{
        return (<div></div>);
      }
    },
    componentWillReceiveProps : function(nextProps){
      if(nextProps.route.trips && (nextProps.route.trips !== this.props.route.trips) ){
          this.setState({trips:nextProps.route.trips});
      }
    },
    render: function() {
        var buttons = <span/>,scope=this;
        if(this.props.route && this.props.route.trips){
          buttons = scope.state.trips.map(function(trip,i){
            var classes = "btn btn-lg btn-block";
            if(scope.props.currentTrip === i){
              classes+=' active';
            }
            if(trip.direction_id===0){
              classes+=' btn-success';
            }else{
              classes+=' btn-primary';
            }

            return (
              <button style={{fontSize:'10px'}} className={classes}
              onClick={scope.props.onTripSelect.bind(null,i)}>
                                {i+" "+trip.headsign };
              </button>
            );
          });
        }
        //var routesGeo = this.state.routesGeo || emptyGeojson;
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
            </section>
        );
    }
});

module.exports = MarketAreaNew;
