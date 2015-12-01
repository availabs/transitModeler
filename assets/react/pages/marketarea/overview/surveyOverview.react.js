'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,

    // -- Components
    MarketareaNav = require('../../../components/marketarea/layout/marketareaNav.react'),
    MarketareaHeader = require('../../../components/marketarea/layout/marketareaHeader.react'),
    SurveyAnalysis = require('../../../components/survey/SurveyAnalysis.react'),
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
                
                <SurveyAnalysis
                    marketarea= {this.props.marketarea}
                    tracts = {this.props.tracts}
                    routesGeo = {this.props.routesGeo}
                    stopsGeo = {this.props.stopsGeo} />

        	</div>
        );
    }
});

module.exports = MarketAreaIndex;
