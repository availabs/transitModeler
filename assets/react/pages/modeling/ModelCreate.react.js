/*globals require,console,module,d3,$*/
'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,
    censusUtils = require('../../utils/ModelCreateCensusParse'),
    _ = require('lodash'),

    // -- Components
    ModelMap = require('../../components/modeling/ModelMap.react'), //The map to be displayed
    ModelOptionsSelect = require('../../components/modeling/ModelOptionsSelect.react'), //The widget for the modeling options
    ModelDatasourcesSelect = require('../../components/modeling/ModelDatasourcesSelect.react'), //The widget for dataset selections for the model
    TripTableOverview =  require('../../components/modeling/TripTableOverview.react'), //The widget for displaying the trip table


    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'), //actions for interacting with the market area
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),    //actions for working with the modeling

    // -- Stores
    TripTableStore = require('../../stores/TripTableStore'),
    ModelSettingsStore = require('../../stores/ModelSettingsStore'),

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
            newModelOptions : TripTableStore.getOptions(),          //get the options available for running models (default)
            currentSettings : TripTableStore.getCurrentSettings(),  //get the current settings
            currentTripTable : TripTableStore.getCurrentTripTable(),//get the trip table
            currentMode: TripTableStore.getMode(),                   //get the current mode
            modelSettings: ModelSettingsStore.getCurrentModelSettings(),
        };
    },

    willTransitionTo: function (transition, params) {
      //console.log('will transition to',transition,params);
    },
    _onModelSettingsChange : function(){
      var modsett = ModelSettingsStore.getCurrentModelSettings();
      if(!_.isEqual(modsett,this.state.modelSettings) )
        this.setState({modelSettings : modsett});
    },
    componentDidMount: function() {//once the module mounted to the vdom
        TripTableStore.addChangeListener(this._onChange);  //subscribe to the triptable store
        ModelSettingsStore.addChangeListener(this._onModelSettingsChange);
        if(this.props.marketarea.id > 0 && !ttLoaded){     //if the market area is defined and the trip table hasn't been loaded
            this._loadNewTripTable();                  //load the trip table
        }
    },

    componentWillUnmount: function() { //if this component will be destroyed
        TripTableStore.removeChangeListener(this._onChange); //delete subscription from the trip table store
        ModelSettingsStore.removeChangeListener(this._onModelSettingsChange); //remove sub from model setting store
        ttLoaded = false;                                     //note that the trip table is no longer loaded
    },

    _onChange:function(){
      var scope = this;
        this.setState({             //when the store updates
            newModelOptions : TripTableStore.getOptions(), //reset the state with the current state of the store;
            currentSettings : TripTableStore.getCurrentSettings(),
            currentTripTable : TripTableStore.getCurrentTripTable(),
            currentMode: TripTableStore.getMode()
        });
    },

    _loadNewTripTable:function(){
        var settings = this.state.currentSettings; //get the current settings object
        settings.marketarea = {id:this.props.marketarea.id,zones:this.props.marketarea.zones,routes:this.props.marketarea.routes}; //set the market area with the current parent market area data
        if(this.props.marketarea.id > 0){ //if the market area is defined
            ModelingActionsCreator.loadTripTable(settings); //load the trip table based on the settings
            ttLoaded = true;                                //set that the table has been loaded //This is optimistic, failure needs to be checked
        }

    },

    componentWillReceiveProps:function(nextProps){ //just before setting the new props object
        if(nextProps.marketarea.id > 0 && !ttLoaded){ //if the parent market are is defined, and we don't have the tript table
            this._loadNewTripTable();             //load the trip table
        }
    },

    render: function() {
        var routes = this.props.marketarea.routesGeo || {type:'FeatureCollection',features:[]}; //get the routes or default it to empty geojson

        var OverviewStyle = {
            borderBottomLeftRadius:0,
            borderBottomRightRadius:0,
            margin:0,
            overflow:'auto'
        }; //set the style for the overview;

        //the trip table overview resides above the map
        //

        // console.log('censusData',this.props.censusData);
        // console.log('currentTripTable',this.state.currentTripTable);
        // console.log('tracts',this.props.tracts);

        var parsedTracts = censusUtils.reduceTracts(this.props.tracts);
        if(this.state.currentTripTable.tt){
          var parsedTrips = censusUtils.reduceTripTable(this.state.currentTripTable.tt);
          if(this.state.currentSettings.type ==='regression' && this.state.currentSettings.regressionId){
            censusUtils.addTrips2Tracts(parsedTrips,parsedTracts);
            censusUtils.addCensusVars2Tracts(this.props.censusData,
                      this.state.currentSettings.regressionId.censusVariables,
                      parsedTracts);
          }
          // console.log('Total Tract Data',parsedTracts);
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
                            <TripTableOverview
                              currentTripTable={this.state.currentTripTable}
                              tractData={parsedTracts}
                              currentSettings={this.state.currentSettings}
                              marketarea={this.props.marketarea}/>
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

                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = ModelCreate;
