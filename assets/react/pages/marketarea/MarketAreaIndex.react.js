'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,

    // -- Components
    WidgetHeader = require('../../components/WidgetHeader.react'),
    Select2Component = require('../../components/utils/Select2.react'),
    CensusOverviewHeader = require('../../components/marketarea/CensusOverviewHeader.react'),
    CensusMap = require('../../components/marketarea/CensusMap.react'),
    CensusGraph = require('../../components/marketarea/CensusGraph.react'),
    CensusTable = require('../../components/marketarea/CensusTable.react'),

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
        //console.log('will transition to',transition,params);
    },

    _onChange:function(){
        console.log('MA Index / On Change')
        this.setState(getStatefromStore())
    },
    censusCategorySelections: function (e, selections) {
       var newState = this.state;
       newState.activeCensusCategory = selections.id;
       this.setState(newState);
    },
    render: function() {
       
        var censusData = this.state.censusData.getTotalData();
        var data = Object.keys(this.state.censusData.getCategories()).map(function(cat,id){
            return {"id":id,"text":cat};
        });
        
        return (
        	<div className="content container">
            	<h2 className="page-title">{this.state.marketarea.name} <small>marketarea overview</small>
                    <div className="btn-group pull-right">
                        <Link to="MarketAreaIndex" params={{marketareaID:this.state.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Overview
                        </Link>
                        <Link to="MarketAreaEdit" params={{marketareaID:this.state.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Edit
                        </Link>
                    </div>
                </h2>
                <CensusOverviewHeader/>
                <div className="row">
                    <div className="col-lg-12">
                        <section className="widget">
                            <div className="body no-margin">
                                <div className="row">
                                    <div className="col-lg-7">

                                        <fieldset>
                                        
                                            <div className="form-group">
                                                <label className="col-sm-3 control-label" htmlFor="grouped-select">Census Category</label>
                                                <div className="col-sm-9">
                                                     <Select2Component
                                                      id="the-hidden-input-id"
                                                      dataSet={data}
                                                      onSelection={this.censusCategorySelections}
                                                      multiple={false}
                                                      styleWidth="100%"
                                                      val={[this.state.activeCensusCategory]} />
                                                </div>
                                            </div>
                                           
                                        </fieldset>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                    
                </div>
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
                                <CensusGraph activeCategory={this.state.activeCensusCategory} />
                            </div>
                        </section>
                        <section className="widget">
                            <div className="body no-margin">
                                <CensusTable activeCategory={this.state.activeCensusCategory} />
                            </div>
                        </section>
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = MarketAreaIndex;