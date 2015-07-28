'use strict';
/*globals confirm, console,module,require,$*/
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
              values={{Trip_Id:'Trip',Shape_Id:'Shape',Headsign:'HeadSign'}}
              buttonText={"Create New Trip"}
              id={"trips"}
              saveAction={this.props.addTrip} />
          );
      else{
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
            if(scope.props.isCreating){
              return (
              <button id={'tooltip'} data-toggle={'tooltip'} data-placement={'left'}
                data-original-title={'Click Me to Begin'} style={{fontSize:'10px'}} className={classes}
              onClick={scope.props.onTripSelect.bind(null,i)}>
                                {i+" "+trip.headsign };
              </button>
            );
            }
            return (
              <div>
              <div className='input-group-btn'>
              <button style={{fontSize:'10px'}} width={'75%'} className={classes}
              onClick={scope.props.onTripSelect.bind(null,i)}>
                          {i+" "+trip.headsign };
              </button>
              </div>
            </div>
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
                <div>
                  {scope.editButton()}
                </div>
            </section>
        );
    },
    componentDidUpdate : function(){
      if(this.props.isCreating){
        $('#tooltip').tooltip('show');
      }
    },
});

module.exports = MarketAreaNew;
