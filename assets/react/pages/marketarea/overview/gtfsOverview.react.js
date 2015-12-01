'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,

    // -- Components
    MarketareaNav = require('../../../components/marketarea/layout/marketareaNav.react'),
    MarketareaHeader = require('../../../components/marketarea/layout/marketareaHeader.react'),
    GtfsEditor   = require('../../../components/gtfs/GtfsEditor.react'),
    
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
                
                <GtfsEditor
                        tracts = {this.props.tracts}
                        routesGeo ={this.props.eRoutesGeo}
                        stopsGeo = {this.props.eStopsGeo}
                        schedules = {this.props.schedules}
                        routingGeo= {this.props.routingGeo}
                        editMessage={this.props.editMessage}
                        freqMessage={this.props.freqEditResponse}
                        frequencyData={this.props.frequencyData}
                        marketarea = {this.props.marketarea}
                        datasources={this.props.datasources.gtfs}
                        jobs = {this.props.jobhistory}/>

        	</div>
        );
    }
});

module.exports = MarketAreaIndex;
