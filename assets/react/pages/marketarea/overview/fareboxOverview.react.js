'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,

    // -- Components
    MarketareaNav = require('../../../components/marketarea/layout/marketareaNav.react'),
    MarketareaHeader = require('../../../components/marketarea/layout/marketareaHeader.react'),
    FareboxAnalysis = require('../../../components/farebox/FareboxAnalysis.react'),

    // -- Actions
    MarketAreaActionsCreator = require('../../../actions/MarketAreaActionsCreator');


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

                <FareboxAnalysis
                        marketarea={this.props.marketarea}
                        tracts = {this.props.tracts}
                        routesGeo ={this.props.routesGeo}
                        datasources={this.props.datasources.gtfs}
                        stopsGeo = {this.props.stopsGeo} />

        	</div>
        );
    }
});

module.exports = MarketAreaIndex;
