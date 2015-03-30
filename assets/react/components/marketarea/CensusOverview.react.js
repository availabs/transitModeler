'use strict';

var React = require('react'),
    
    // -- Components
    Select2Component = require('../utils/Select2.react'),
    CensusOverviewHeader = require('./CensusOverviewHeader.react'),
    CensusMap = require('./CensusMap.react'),
    CensusGraph = require('./CensusGraph.react'),
    CensusTable = require('./CensusTable.react'),

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
   
var i18n = {
    locales: ['en-US']
};


var CensusOverview = React.createClass({

   
    
    getInitialState: function(){
    
        var state = {}
        state.activeCensusCategory = 18;
        return state;
    
    },

    censusCategorySelections: function (e, selections) {
    
        var newState = this.state;
        newState.activeCensusCategory = selections.id;
        MarketAreaActionsCreator.setActiveCensusVariable(this.props.censusData.getCategories()[Object.keys(this.props.censusData.getCategories())[selections.id]][0])
        this.setState(newState);
    
    },

    render: function() {
       
        var censusData = this.props.censusData.getTotalData();
        var data = Object.keys(this.props.censusData.getCategories()).map(function(cat,id){
            return {"id":id,"text":cat};
        });
        


        return (
        	<div >
                <CensusOverviewHeader/>
                <div className="row">
                	<div className="col-lg-7">
                       
                        <CensusMap 
                            tracts={this.props.tracts}
                            activeVariable={this.props.activeVariable} 
                            censusData={this.props.censusData} 
                            activeCategory={this.state.activeCensusCategory} />
            
                    </div>
                    <div className="col-lg-5">
                        
                        <div>
                            <CensusGraph 
                                activeCategory={this.state.activeCensusCategory} 
                                censusData={this.props.censusData} 
                                marketarea={this.props.marketarea} />

                        </div>

                        <section className="widget">
                            <div className="body no-margin">
                                
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
                        </section>
                        
                        <section className="widget">
                            <div className="body no-margin">
                                <CensusTable 
                                    censusData={this.props.censusData}
                                    activeVariable={this.props.activeCensusVariable}
                                    activeCategory={this.state.activeCensusCategory} />
                            </div>
                        </section>
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = CensusOverview;