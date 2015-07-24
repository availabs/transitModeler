'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,


    // -- Components
    ModelMap = require('../../components/modeling/ModelMap.react'),
    ModelOptionsSelect = require('../../components/modeling/ModelOptionsSelect.react'),
    ModelDatasourcesSelect = require('../../components/modeling/ModelDatasourcesSelect.react'),
    TripTableOverview =  require('../../components/modeling/TripTableOverview.react'),
    

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),

    // -- Stores
    TripTableStore = require('../../stores/TripTableStore'),

    // -- Comp Globals
    ttLoaded = false;



var ModelCreate = React.createClass({

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
            newModelOptions : TripTableStore.getOptions(),
            currentSettings : TripTableStore.getCurrentSettings(),
            currentTripTable : TripTableStore.getCurrentTripTable(),
            currentMode: TripTableStore.getMode()
        }
    },

    willTransitionTo: function (transition, params) {
      //console.log('will transition to',transition,params);
    },

    componentDidMount: function() {
        TripTableStore.addChangeListener(this._onChange);
        if(this.props.marketarea.id > 0 && !ttLoaded){
            this._loadNewTripTable();
        }
    },

    componentWillUnmount: function() {
        TripTableStore.removeChangeListener(this._onChange);
        ttLoaded = false;
    },
    
    _onChange:function(){
        this.setState({
            newModelOptions : TripTableStore.getOptions(),
            currentSettings : TripTableStore.getCurrentSettings(),
            currentTripTable : TripTableStore.getCurrentTripTable(),
            currentMode: TripTableStore.getMode()
        });
    },

    _loadNewTripTable:function(){
        var settings = this.state.currentSettings;
        settings.marketarea = {id:this.props.marketarea.id,zones:this.props.marketarea.zones,routes:this.props.marketarea.routes};
        if(this.props.marketarea.id > 0){
            ModelingActionsCreator.loadTripTable(settings);
            ttLoaded = true;
        }
        
    },
    
    componentWillReceiveProps:function(nextProps){
        if(nextProps.marketarea.id > 0 && !ttLoaded){
            this._loadNewTripTable();
        }
    },
    
    render: function() {
        var routes = this.props.marketarea.routesGeo || {type:'FeatureCollection',features:[]}
        
        var OverviewStyle = {
            borderBottomLeftRadius:0,
            borderBottomRightRadius:0,
            margin:0,
            overflow:'auto'
        }
        return (
        	<div className="content container">
            	<h2 className="page-title">{this.props.marketarea.name} <small>Run New Model</small>
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
                	<div className="col-lg-7">
                    
                        <section className="widget no-margin" style={OverviewStyle}>
                            <TripTableOverview currentTripTable={this.state.currentTripTable} currentSettings={this.state.currentSettings} marketarea={this.props.marketarea}/>
                        </section>
                    
                        <ModelMap
                            mode = {this.state.currentMode}
                            currentTripTable={this.state.currentTripTable} 
                            tracts={this.props.tracts} 
                            routes={ routes }
                            currentSettings = {this.state.currentSettings}
                            censusData = {this.props.censusData} />
                    
                    </div>
                    <div className="col-lg-5">
                        
                        <section className="widget">
                            <ModelOptionsSelect 
                                options={this.state.newModelOptions} 
                                currentSettings={this.state.currentSettings} 
                                regressions={this.props.regressions}
                                marketarea={this.props.marketarea} />
                        </section>

                        <section className="widget">
                            <ModelDatasourcesSelect 
                                datasources={this.props.datasources}
                                currentSettings={this.state.currentSettings} />
                        </section>
                        <span style={{color:'black'}}>
                        {JSON.stringify(this.state.currentSettings)}
                        </span>
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = ModelCreate;