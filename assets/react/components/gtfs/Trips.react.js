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
        return (<div></div>)
      }
    },
    render: function() {
        var buttons = <span/>,scope=this;
        if(this.props.route && this.props.route.trips){
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
        var divstyle = {
          'overflowY':'scroll',
          height:300,

        }
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
