'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,


    // -- Components
    WidgetHeader = require('../../components/WidgetHeader.react'),
    ModelRunSelector = require('../../components/modelAnalysis/modelRunSelector.react'),
    RouteTotalGraph = require('../../components/modelAnalysis/routeTotalGraph.react'),
    

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),

    // -- Stores
    ModelRunStore = require('../../stores/ModelRunStore.js');

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
        return {
            model_runs:ModelRunStore.getModelRuns()
        }
    },

    componentDidMount: function() {
        ModelRunStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        ModelRunStore.removeChangeListener(this._onChange);
    },

    _onChange:function(){
        this.setState({
            model_runs:ModelRunStore.getModelRuns()
        });
    },

    render: function() {
       
        var routeData = []
        return (
        	<div className="content container">
            	<h2 className="page-title">{this.props.marketarea.name} <small>Model Analysis</small>
                    <div className="btn-group pull-right">
                        <Link to="ModelAnalysis" params={{marketareaID:this.props.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Model Analysis
                        </Link>
                        <Link to="ModelCreate" params={{marketareaID:this.props.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Run New Models
                        </Link>
                    </div>
                </h2>
                
                <div className="row">
                	
                    <div className="col-lg-9">
                        <section className="widget">
                            <div className="body no-margin">
                            
                                <ModelRunSelector marketarea={this.props.marketarea} model_runs={this.state.model_runs} />
                            
                            </div>
                        </section>
                        <div style={{width:'100%'}}>
                            <RouteTotalGraph routeData = {this.props.loadedModels}  />
                        </div>
                    </div>

                    <div className="col-lg-3">
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