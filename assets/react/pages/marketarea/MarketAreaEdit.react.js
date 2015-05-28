'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,


    // -- Components
    WidgetHeader = require('../../components/WidgetHeader.react'),
    CensusOverviewHeader = require('../../components/marketarea/CensusOverviewHeader.react'),
    EditMap = require('../../components/marketarea/EditMap.react'),
    RouteListTable = require('../../components/marketarea/RouteListTable.react'),
    RoutesSelector = require('../../components/marketarea/RoutesSelector.react'),

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),

    // -- Stores
    MarketAreaStore = require('../../stores/MarketAreaStore.js'),
    CensusStore = require('../../stores/CensusStore.js'),
    GtfsStore = require('../../stores/GtfsStore'),
    GeodataStore = require('../../stores/GeodataStore');

var i18n = {
    locales: ['en-US']
};

var emptyGeojson = {type:'FeatureCollection',features:[]};

function getStatefromStore() {
    
    var ma  = MarketAreaStore.getCurrentMarketArea()? MarketAreaStore.getCurrentMarketArea() : {id:0,name:'',routes:[]};
    var routes = MarketAreaStore.getCurrentMarketArea() ? GtfsStore.getCurrentRouteList() : [];
    return {
        marketarea: ma,
        censusData: CensusStore.getCurrentDataSet(),
        routeList:  routes,
        tracts: GeodataStore.getMarketAreaTracts()
    } 

}

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
        var state = getStatefromStore();
        state.activeCensusCategory = 18;
        return state;
    },

    componentDidMount: function() {
        MarketAreaStore.addChangeListener(this._onChange);
        CensusStore.addChangeListener(this._onChange);
        GtfsStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        MarketAreaStore.removeChangeListener(this._onChange);
        CensusStore.removeChangeListener(this._onChange);
        GtfsStore.removeChangeListener(this._onChange);
    },

    willTransitionTo: function (transition, params) {
      console.log('will transition to',transition,params);
    },

    _onChange:function(){
        this.setState(getStatefromStore())
    },
    render: function() {
       
        var censusData = this.state.censusData.getTotalData();
        var data = Object.keys(this.state.censusData.getCategories()).map(function(cat,id){
            return {"id":id,"text":cat};
        });
        var routesGeo = this.state.marketarea.routesGeo || emptyGeojson;
        return (
        	<div className="content container">
            	<h2 className="page-title">{this.state.marketarea.name} <small>Edit Market Area</small>
                    <div className="btn-group pull-right">
                        <Link to="MarketAreaIndex" params={{marketareaID:this.state.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Overview
                        </Link>
                        <Link to="MarketAreaEdit" params={{marketareaID:this.state.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Edit
                        </Link>
                    </div>
                </h2>
                
                <div className="row">
                	<div className="col-lg-9">
                       
                        <EditMap tracts={this.state.tracts} routes={routesGeo} />
                      
                    </div>
                    <div className="col-lg-3">
                        <section className="widget">
                            <div className="body no-margin">
                                <RoutesSelector marketarea={this.state.marketarea} routeList={this.state.routeList} />
                                <RouteListTable marketarea={this.state.marketarea}/>
                            </div>
                        </section>
                        <section className="widget">
                            <div className="body no-margin">
                                
                            </div>
                        </section>
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = MarketAreaIndex;