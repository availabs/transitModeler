'use strict';

var React = require('react'),
    //comps
    
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
var MarketAreaNew = React.createClass({

    render: function() {
        var buttons = <span/>,scope=this;
        var classes = "btn btn-lg btn-warning btn-block";
        if(this.props.Edited){
            buttons = (
              <button style={{fontSize:'2s0px'}} className={classes}
              onClick={this.props.onSave.bind(null)}>
                                {'Save Changes'};
              </button>
              )
        } 
        //var routesGeo = this.state.routesGeo || emptyGeojson;
        var scope = this;
        return (
            <section className="widget">
                <div className="body no-margin">
                    {buttons}                </div>
            </section> 
        );
    }
});

module.exports = MarketAreaNew;