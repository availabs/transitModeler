'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,

    // -- Components
    CensusOverview = require('../../components/marketarea/CensusOverview.react'),
    CtppOverview = require('../../components/marketarea/CtppOverview.react'),
   
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
    
        var state = {}
        state.activeComponent = 'acs';
        return state;
    
    },

    _setActiveComponent : function(e){
        this.setState({activeComponent:e.target.getAttribute('value')})
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
                        marketarea={this.props.marketarea} />
                )

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
                                        <a href="#survey" data-toggle="tab">Survey</a>
                                    </li>
                                    
                                </ul>
                            </header>
                            <div className="body tab-content">
                                <div id="acs" className="tab-pane active clearfix">
                                   ACS 
                                </div>
                                <div id="ctpp" className="tab-pane clearfix">
                                   
                                </div>
                                <div id="survey" className="tab-pane clearfix">
                                   
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