'use strict';

var React = require('react'),
    //comps
    
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
var MarketAreaNew = React.createClass({

    render: function() {
        var buttons = <span/>,scope=this;
        if(this.props.route){
          buttons = scope.props.route.trips.map(function(trip,i){
            var classes = "btn btn-lg btn-warning btn-block";
            if(scope.props.currentTrip === i){
              classes+=' active';
            }
            return (
              <button style={{fontSize:'10px'}} className={classes}
              onClick={scope.props.onTripSelect.bind(null,i)}>
                                {i+" "+trip.headsign };
              </button>
              )
          })
        } 
        //var routesGeo = this.state.routesGeo || emptyGeojson;
        var scope = this;
        return (
            <section className="widget">
                <div className="body no-margin">
                    {buttons}
                </div>
            </section> 
        );
    }
});

module.exports = MarketAreaNew;