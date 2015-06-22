'use strict';

var React = require('react'),
    //comps
    Select2Component = require('../utils/Select2.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
            selection:[]
        }
    },
    updateGtfs:function(e,selection){
      var scope = this;
      if(selection){
        this.props.onRouteChange(selection.id);
        // this.props.gtfsChange(scope.props.gtfsChange(scope.props.gtfsData[selection.id]));
        if (this.isMounted()) {
          scope.setState({selection:selection.id});
          console.log(selection.id)
        }
      }
    },
    render: function() {
        
        //var routesGeo = this.state.routesGeo || emptyGeojson;
        var scope = this;
        var selectData = Object.keys(this.props.schedules)
                                .map(function(key){
                                    return {"id":scope.props.schedules[key].id ,"text":key };
                                });
        return (
            <section className="widget">
                <div className="body no-margin">
                    <Select2Component
                      id="gtfsSelector"
                      dataSet={selectData}
                      multiple={false}
                      styleWidth="100%"
                      onSelection={this.updateGtfs}
                      val={this.state.selection} />
                </div>
            </section> 
        );
    }
});

module.exports = MarketAreaNew;