'use strict';
/*globals confirm,d3,$ console,module,require,location*/
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
      location.href = '/datasources/gtfs/generate?name='+this.props.tableName;
      this.setState({disabled:true});
    },
    render: function() {
      var classes = "btn btn-lg btn-block btn-danger";
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
