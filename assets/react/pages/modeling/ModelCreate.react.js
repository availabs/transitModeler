'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,


    // -- Components
    WidgetHeader = require('../../components/WidgetHeader.react'),
    CensusOverviewHeader = require('../../components/marketarea/CensusOverviewHeader.react'),
    CensusMap = require('../../components/marketarea/CensusMap.react'),

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),

    // -- Stores
    MarketAreaStore = require('../../stores/MarketAreaStore.js'),
    CensusStore = require('../../stores/CensusStore.js');

var i18n = {
    locales: ['en-US']
};

function getStatefromStore() {
    
    var ma  = MarketAreaStore.getCurrentMarketArea() ? MarketAreaStore.getCurrentMarketArea() : {id:0,name:''};
    return {
        marketarea: ma,
        censusData: CensusStore.getCurrentDataSet(),
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
    },

    componentWillUnmount: function() {
        MarketAreaStore.removeChangeListener(this._onChange);
        CensusStore.removeChangeListener(this._onChange);
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
        
        return (
        	<div className="content container">
            	<h2 className="page-title">{this.state.marketarea.name} <small>Run New Model</small>
                    <div className="btn-group pull-right">
                        <Link to="ModelAnalysis" params={{marketareaID:this.state.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Model Analysis
                        </Link>
                        <Link to="ModelCreate" params={{marketareaID:this.state.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Run New Models
                        </Link>
                    </div>
                </h2>
                
                <div className="row">
                	<div className="col-lg-7">
                        <section className="widget">
                            <div className="body no-margin">
                             <CensusMap />
                            </div>
                        </section>
                    </div>
                    <div className="col-lg-5">
                        <section className="widget">
                            <div className="body no-margin">
                                
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