'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,

    // -- Components
    MarketareaNav = require('../../../components/marketarea/layout/marketareaNav.react'),
    CensusOverview = require('../../../components/marketarea/CensusOverview.react'),
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

                <CensusOverview
                    tracts={this.props.tracts}
                    activeVariable={this.props.activeCensusVariable}
                    censusData={this.props.censusData}
                    marketarea={this.props.marketarea}
                    routesGeo={this.props.routesGeo}
                    stopsGeo={this.props.stopsGeo} />

        	</div>
        );
    }
});

module.exports = MarketAreaIndex;
