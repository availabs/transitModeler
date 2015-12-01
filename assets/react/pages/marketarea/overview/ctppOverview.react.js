/*globals require,console,module*/
'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,

    // -- Components
    MarketareaNav = require('../../../components/marketarea/layout/marketareaNav.react'),
    MarketareaHeader = require('../../../components/marketarea/layout/marketareaHeader.react'),
    CtppOverview = require('../../../components/marketarea/CtppOverview.react'),
    
    // -- Actions
    MarketAreaActionsCreator = require('../../../actions/MarketAreaActionsCreator');

    // -- Stores

var i18n = {
    locales: ['en-US']
};


var MarketAreaIndex = React.createClass({

    mixins: [Router.State],

    statics: {

        willTransitionTo: function (transition, params) {

            if(params.marketareaID){
               MarketAreaActionsCreator.setCurrentMarketArea(params.marketareaID);
            }
        }

    },

    render: function() {

        return (
        	<div className="content container">
            	
                <MarketareaNav marketarea={this.props.marketarea}/>
                
                <CtppOverview
                    type='ctpp'
                    tracts={this.props.tracts}
                    data = {this.props.ctppData}
                    marketarea={this.props.marketarea}
                    censusData={this.props.censusData}
                    stopsGeo={this.props.stopsGeo}
                    routesGeo={this.props.routesGeo} />

        	</div>
        );
    }
});

module.exports = MarketAreaIndex;
