'use strict';
/*globals confirm,d3,$ console,module,require*/
var React = require('react'),
    //comps

    // -- Actions
    GtfsActionsCreator       = require('../../actions/GtfsActionsCreator');

    // -- Stores


var timer;
var MarketAreaNew = React.createClass({
    getInitialState : function(){
      return {
          disabled:false,
      };
    },
    clickAction : function(){
      var token = new Date().getTime();
      location.href = '/datasources/gtfs/generate?name=gtfs_20141014_13_1_edited';
      this.setState({disabled:true});
    },
    render: function() {
      var classes = "btn btn-lg btn-block";
        return (
            <section className="widget">
                <div className="body no-margin" >
                  <button id={'downloadButton'} className={classes} disable={this.state.disabled} onClick={this.clickAction}>{'Download Gtfs'}</button>
                </div>
            </section>
        );
    }
});

module.exports = MarketAreaNew;