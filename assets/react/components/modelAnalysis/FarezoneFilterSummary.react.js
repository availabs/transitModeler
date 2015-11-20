/*globals d3,$,require,console,module,setTimeout,clearTimeout*/
'use strict';

var React = require('react'),
    Router = require('react-router'),
    _ = require('lodash');

    // -- Components


var i18n = {
    locales: ['en-US']
};


var FarezoneFilterSummary = React.createClass({

    renderZoneTable : function(zones){
      if(!zones)
        return <span></span>;
      return Object.keys(zones).filter(function(d){return zones[d].length > 0;})
                        .map(function(d){
                          return (<div className='row'>
                            { d + ' : ' +
                              zones[d].
                              sort(function(a,b){
                                return parseInt(a)-parseInt(b);
                              }).toString()
                            }
                          </div>);
                        });

    },

    render: function() {
      console.log(this.props.dates);
      if(!this.props.zones)
        return <span></span>;
      return(
        <section className='widget'>
          <div className='body no-margin' style={{'word-wrap':'break-word'}}>

            <h4>Farezone Filter</h4>
            
            <div className='col-md-11'>{this.renderZoneTable(this.props.zones)}</div>
            <div className='row'>

              <div className='col-md-11'>{'Dates: ' + Object.keys(this.props.dates)}</div>
            </div>
        </div>
      </section>
      );
    },

});

module.exports = FarezoneFilterSummary;
