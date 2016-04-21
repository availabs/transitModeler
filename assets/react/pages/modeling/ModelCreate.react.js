/*globals require,console,module,d3,$*/
'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,
    censusUtils = require('../../utils/ModelCreateCensusParse'),
    _ = require('lodash'),

    // -- Components
    MarketareaNav = require('../../components/marketarea/layout/marketareaNav.react'),
    ModelMap = require('../../components/modeling/ModelMap.react'), //The map to be displayed
    ModelOptionsSelect = require('../../components/modeling/ModelOptionsSelect.react'), //The widget for the modeling options
    ModelDatasourcesSelect = require('../../components/modeling/ModelDatasourcesSelect.react'), //The widget for dataset selections for the model
    TripTableOverview =  require('../../components/modeling/TripTableOverview.react'), //The widget for displaying the trip table
    CustomizeForm = require('../../components/modeling/CustomizeForm.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'), //actions for interacting with the market area
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),    //actions for working with the modeling
    SailsWebApi = require('../../utils/sailsWebApi'),

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
            customSettingsList: ModelSettingsStore.getModelSettingsList(),
            modelTracts : {},
            customModel :{
                name:''
            }
        };
    },



    willTransitionTo: function (transition, params) {
      //console.log('will transition to',transition,params);
    },

    parseTracts:function(tracts){

        var parsedTracts =  Object.keys(this.state.modelTracts || {}).length === tracts.features.length ?
            this.state.modelTracts : censusUtils.reduceTracts(tracts);
        

        if(this.state.currentTripTable.tt){
          var parsedTrips = censusUtils.reduceTripTable(this.state.currentTripTable.tt);
          censusUtils.addTrips2Tracts(parsedTrips,parsedTracts);
        
        }
        var firstTract = parsedTracts[Object.keys(parsedTracts)[0]]

       
        if( this.state.currentSettings.type ==='regression' && this.state.currentSettings.regressionId){
        console.log('stop census overwrite',Object.keys(firstTract),this.state.currentSettings.regressionId.censusVariables)
            
           var update = this.state.currentSettings.regressionId.censusVariables.some(function(cenvar){ 
                    console.log(cenvar.name)
                    return Object.keys(firstTract).indexOf(cenvar.name) === -1 
            })
           
            console.log(update)
            if( update ){
                censusUtils.addCensusVars2Tracts(this.props.censusData,
                          this.state.currentSettings.regressionId.censusVariables,
                          parsedTracts);
            }
        }
        //console.log('Total Tract Data',parsedTracts);
        
        return parsedTracts;
    },
    
    _onModelSettingsChange : function(){
      var modsett = ModelSettingsStore.getCurrentModelSettings();
      this.setState({modelSettings : modsett});
    },
    
    componentDidMount: function() {//once the module mounted to the vdom
        TripTableStore.addChangeListener(this._onChange);  //subscribe to the triptable store
        ModelSettingsStore.addChangeListener(this._onModelSettingsChange);
        if(this.props.marketarea.id > 0 && !ttLoaded){     //if the market area is defined and the trip table hasn't been loaded
            this._loadNewTripTable();                  //load the trip table
        }
        if(this.props.tracts.features.length > 0){
             this.setState({modelTracts:this.parseTracts(this.props.tracts)})
        }
    },

    componentWillUnmount: function() { //if this component will be destroyed
        TripTableStore.removeChangeListener(this._onChange); //delete subscription from the trip table store
        ModelSettingsStore.removeChangeListener(this._onModelSettingsChange); //remove sub from model setting store
        ttLoaded = false;                                     //note that the trip table is no longer loaded
    },

    _onChange:function(){
      var scope = this;

        var settings = TripTableStore.getCurrentSettings();
        
        if(this.state.currentSettings.type === 'regression'){
            this.setState({modelTracts:this.parseTracts(this.props.tracts)})
        }
        this.setState({             //when the store updates
            newModelOptions : TripTableStore.getOptions(), //reset the state with the current state of the store;
            currentSettings : TripTableStore.getCurrentSettings(),
            currentTripTable : TripTableStore.getCurrentTripTable(),
            customSettingsList: ModelSettingsStore.getModelSettingsList(),
            currentMode: TripTableStore.getMode()
        });
    },

    _loadNewTripTable:function(){
        var settings = this.state.currentSettings; //get the current settings object
        settings.marketarea = {id:this.props.marketarea.id,zones:this.props.marketarea.zones,routes:this.props.marketarea.routes}; //set the market area with the current parent market area data
        if(this.props.marketarea.id > 0){ //if the market area is defined
            console.log('---------------------------')
            console.log('load new trip table',settings)
            console.log('---------------------------')
            ModelingActionsCreator.loadTripTable(settings); //load the trip table based on the settings
            ttLoaded = true;                                //set that the table has been loaded //This is optimistic, failure needs to be checked
        }

    },

    componentWillReceiveProps:function(nextProps){ //just before setting the new props object
        if((nextProps.marketarea.id > 0 && !ttLoaded ) ){ //if the parent market are is defined, and we don't have the tript table
            this._loadNewTripTable();             //load the trip table
        }
        if(this.props.tracts.features.length !==nextProps.tracts.features.length){
            this._loadNewTripTable();
            this.setState({modelTracts:this.parseTracts(nextProps.tracts)})
        }
        
    },

    renderMap : function(){
        var routes = this.props.marketarea.routesGeo || {type:'FeatureCollection',features:[]}; //get the routes or default it to empty geojson
        
        if(this.props.tracts.features.length === 0){
            return <div> Loading </div>
        }

        return (
            <ModelMap
                mode = {this.state.currentMode}
                currentTripTable={this.state.currentTripTable}
                tracts={this.props.tracts}
                forecastData={this.state.modelTracts}
                routes={ routes }
                routeColors = {this.props.marketarea.routecolors}
                currentSettings = {this.state.currentSettings}
                censusData = {this.props.censusData} />
        )
    },

    changeTract:function(key,value,tract){
        var newTracts = this.state.modelTracts;
        newTracts[tract][key]=value;
        this.setState({modelTracts:newTracts});       

    },

    saveCustomModel:function(){
        var scope = this,
            customSettings = this.state.customModel;
        
        customSettings.settings = {}
        
        Object.keys(this.state.currentSettings).forEach(function(d){

            customSettings.settings[d] = scope.state.currentSettings[d];
        });

        customSettings.settings.tract_forecasts = this.state.modelTracts;
        
        //console.log('new settings',customSettings)
        if(!customSettings.id && customSettings.name.length > 1){
            
            SailsWebApi.create('modelsettings',customSettings,function(data){
                console.log('create data',data)
                if(data){
                    var newModel = scope.state.customModel;
                    newModel.id = data.id
                    scope.setState({customModel:newModel})
                }
            })

        }else{

            SailsWebApi.update('modelsettings',customSettings);
        
        }
        
    },

    loadCustomSettings:function(customModel){
        console.log('load custom settings',customModel)
        this.setState({
            customModel:customModel,
            modelTracts: customModel.settings.tract_forecasts ? customModel.settings.tract_forecasts : this.state.modelTracts
        })
        //will also need to set customSettings and modelTracts
    },

    editCustomSettingsName:function(name){
        var newSettings = this.state.customModel;
        newSettings.name = name;

        this.setState({customModel:newSettings});
    },

    renderCustomSettings:function(){
        if(this.state.currentSettings.forecast === 'future' && this.state.currentSettings.forecastType === 'custom'){
            return (

                <section className='widget'>
                    <CustomizeForm
                      modelSettings={this.state.modelSettings}
                      customModel ={this.state.customModel}
                      currentSettings={this.state.currentSettings}
                      tractData={this.state.modelTracts}
                      editTract = {this.changeTract}
                      saveModel={this.saveCustomModel}
                      customSettingsList = {this.state.customSettingsList}
                      loadCustomSettings = {this.loadCustomSettings}
                      changeName= {this.editCustomSettingsName}

                    />
                </section>
            )
        }
    },

    render: function() {
        var scope = this;
        var OverviewStyle = {
            borderBottomLeftRadius:0,
            borderBottomRightRadius:0,
            margin:0,
            overflow:'auto'
        }; 


        return (
        	<div className="content container">
            	<MarketareaNav marketarea={this.props.marketarea}/>

                <div className="row">
                	<div className="col-lg-7">

                        <section className="widget no-margin" style={OverviewStyle}>
                            <TripTableOverview
                              currentTripTable={this.state.currentTripTable}
                              tractData={this.state.modelTracts}
                              currentSettings={this.state.currentSettings}
                              marketarea={this.props.marketarea}/>
                        </section>
                        
                        {this.renderMap()}


                    </div>
                    <div className="col-lg-5">

                        <section className="widget">
                            <ModelOptionsSelect
                                options={this.state.newModelOptions}
                                currentSettings={this.state.currentSettings}
                                regressions={this.props.regressions}
                                marketarea={this.props.marketarea}
                                modelSettings={this.state.modelSettings}
                                censusData = {this.props.censusData}
                              
                            />
                        </section>

                        {this.renderCustomSettings()}

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
