/*globals require,console,module*/
'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,

    // -- Components
    CensusOverview = require('../../components/marketarea/CensusOverview.react'),
    CtppOverview = require('../../components/marketarea/CtppOverview.react'),
    GtfsEditor   = require('../../components/gtfs/GtfsEditor.react'),
    SurveyAnalysis = require('../../components/survey/SurveyAnalysis.react'),
    FareboxAnalysis = require('../../components/farebox/FareboxAnalysis.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

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

    getInitialState: function(){

        var state = {};
        state.activeComponent = 'survey';
        return state;

    },

    _setActiveComponent : function(e){
        this.setState({activeComponent:e.target.getAttribute('value')});
    },

    _renderActiveComponent : function(){



        switch(this.state.activeComponent) {

            case 'acs':
                return (
                     <CensusOverview
                    tracts={this.props.tracts}
                    activeVariable={this.props.activeCensusVariable}
                    censusData={this.props.censusData}
                    marketarea={this.props.marketarea} />
                )
            break;

            case 'ctpp':
                return (
                     <CtppOverview
                        tracts={this.props.tracts}
                        ctppData = {this.props.ctppData}
                        marketarea={this.props.marketarea}
                        censusData={this.props.censusData} />
                )

            break;

            case 'gtfs':
                return (
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

                    )

            break;

            case 'survey':{
                return (
                    <SurveyAnalysis
                        marketarea={this.props.marketarea}
                        tracts = {this.props.tracts}
                        routesGeo ={this.props.routesGeo}
                        stopsGeo = {this.props.stopsGeo} />

                    )
            }
            break;

             case 'farebox':{
                return (
                    <FareboxAnalysis
                        marketarea={this.props.marketarea}
                        tracts = {this.props.tracts}
                        routesGeo ={this.props.routesGeo}
                        stopsGeo = {this.props.stopsGeo} />

                    )
            }
            break;



            default:
                return (
                     <span />
                )
            break;

        }

    },

    render: function() {

        var censusData = this.props.censusData.getTotalData();
        var data = Object.keys(this.props.censusData.getCategories()).map(function(cat,id){
            return {"id":id,"text":cat};
        });



        return (
        	<div className="content container">
            	<h2 className="page-title">{this.props.marketarea.name} <small>marketarea overview</small>
                    <div className="btn-group pull-right">
                        <Link to="MarketAreaIndex" params={{marketareaID:this.props.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Overview
                        </Link>
                        <Link to="MarketAreaEdit" params={{marketareaID:this.props.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Edit
                        </Link>
                    </div>
                </h2>

                <div className="row">
                    <div className="col-lg-12">
                        <section className="widget widget-tabs">
                            <header>
                                <ul className="nav nav-tabs" onClick={this._setActiveComponent}>
                                    <li value="acs" className='active'>
                                        <a href="#acs" data-toggle="tab" value="acs" aria-expanded="true">Census Acs</a>
                                    </li>
                                    <li value="ctpp">
                                        <a href="#ctpp" data-toggle="tab" value="ctpp">Census Ctpp</a>
                                    </li>
                                    <li>
                                        <a href="#survey" data-toggle="tab" value="survey">Survey</a>
                                    </li>
                                     <li>
                                        <a href="#farebox" data-toggle="tab" value="farebox">Farebox</a>
                                    </li>
                                    <li>
                                        <a href="#gtfs" data-toggle="tab" value="gtfs">Gtfs</a>
                                    </li>
                                </ul>
                            </header>
                            <div className="body tab-content">
                                <div id="acs" className="tab-pane clearfix">
                                   ACS
                                </div>
                                <div id="ctpp" className="tab-pane clearfix">
                                 CTPP
                                </div>
                                <div id="survey" className="tab-pane clearfix">
                                   Survey Analysis
                                </div>
                                <div id="farebox" className="tab-pane clearfix">
                                   farebox

                                </div>
                                <div id="gtfs" className="tab-pane clearfix">
                                   GTFS
                                </div>

                            </div>
                        </section>
                    </div>

                </div>
                {this._renderActiveComponent()}
        	</div>
        );
    }
});

module.exports = MarketAreaIndex;
