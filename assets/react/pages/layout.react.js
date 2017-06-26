var React = require('react'),
    RouteHandler = require('react-router').RouteHandler,

    // -- Components
    Sidebar = require('../components/Sidebar.react'),
    Logo = require('../components/Logo.react'),
    Header = require('../components/Header.react'),

    // -- Stores
    MarketAreaStore = require('../stores/MarketAreaStore.js'),
    GeodataStore = require('../stores/GeodataStore.js'),
    DatasourcesStore = require('../stores/DatasourcesStore.js'),
    JobStore = require('../stores/JobStore.js'),
    RegressionStore = require('../stores/RegressionStore'),
    CensusStore = require('../stores/CensusStore'),
    GtfsStore = require('../stores/GtfsStore'),
    ModelRunStore = require('../stores/ModelRunStore');


function marketAreasToMenuItems(marketareas){
    return Object.keys(marketareas).map(function(key){
        return {
            text:marketareas[key].name,
            name:'marketarea-'+marketareas[key].id,
            menuItems:[
                {text:'Overview',type:'Route',action:'MarketAreaIndex',params:{marketareaID:marketareas[key].id}},
                {text:'Modeling',type:'Route',action:'ModelAnalysis',params:{marketareaID:marketareas[key].id}},
            ]
        };
    });
}



var App = React.createClass({

    getState : function(){
        return {
            menu:this._populateMenu( MarketAreaStore.getAll() ).menu,
            currentMarketarea: MarketAreaStore.getCurrentMarketArea() || {id:0,name:'',routesGeo:{type:'FeatureCollection',features:[]}},
            marketareas:MarketAreaStore.getAll(),
            tracts: GeodataStore.getMarketAreaTracts(),
            counties : GeodataStore.getMarketAreaCounties(),
            countyTracts : GeodataStore.getTractsNearMarketArea(),
            stateTracts : GeodataStore.getAllTracts(),
            stateCounties : GeodataStore.getAllCounties(),
            datasources: DatasourcesStore.getAll(),
            activeJobs: JobStore.getActive(),
            regressions:RegressionStore.getAll(),
            censusData: CensusStore.getCurrentDataSet(),
            activeCensusVariable: CensusStore.getActiveVariable(),
            ctppData: MarketAreaStore.getCurrentCtpp(),
            lodesData: MarketAreaStore.getCurrentLodes(),
            loadedModels: ModelRunStore.getActiveModelRuns(),
            routes : MarketAreaStore.getCurrentMarketArea() ? GtfsStore.getCurrentRouteList() : [],
            routesGeo : GtfsStore.getRoutesGeo(),
            stopsGeo : GtfsStore.getStopsGeo(),
            eRoutesGeo: GtfsStore.getEditRoutesGeo(),
            eStopsGeo: GtfsStore.getEditStopsGeo(),
            schedules : GtfsStore.getRouteSchedules(),
            routingGeo : GtfsStore.getRoutingGeo(),
            frequencyData:GtfsStore.getFrequencyData(),
            freqEditResponse:GtfsStore.putFrequencyData(),
            editResponse : GtfsStore.putGtfsData(),
            jobhistory : JobStore.getAll(),

        };
    },

    getInitialState: function(){
        return this.getState();
    },

    _onChange: function() {
        this.setState(this.getState());
    },

    componentDidMount: function() {
        JobStore.addChangeListener(this._onChange);
        RegressionStore.addChangeListener(this._onChange);
        MarketAreaStore.addChangeListener(this._onChange);
        DatasourcesStore.addChangeListener(this._onChange);
        GeodataStore.addChangeListener(this._onChange);
        CensusStore.addChangeListener(this._onChange);
        ModelRunStore.addChangeListener(this._onChange);
        GtfsStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        JobStore.removeChangeListener(this._onChange);
        RegressionStore.removeChangeListener(this._onChange);
        MarketAreaStore.removeChangeListener(this._onChange);
        DatasourcesStore.removeChangeListener(this._onChange);
        GeodataStore.removeChangeListener(this._onChange);
        CensusStore.removeChangeListener(this._onChange);
        ModelRunStore.removeChangeListener(this._onChange);
        GtfsStore.removeChangeListener(this._onChange);
    },


    render: function() {
        return (
        	<div>
        		<Logo />
    	    	<Sidebar activeJobs={this.state.activeJobs} menuItems={this.state.menu} />
    	    	<div className="wrap">
                    <Header marketarea={this.state.currentMarketarea} />
    	    		<RouteHandler
                        activeJobs={this.state.activeJobs}
                        jobhistory ={this.state.jobhistory}
                        marketarea={this.state.currentMarketarea}
                        marketareas ={this.state.marketareas}
                        tracts={this.state.tracts}
                        counties={this.state.counties}
                        countyTracts={this.state.countyTracts}
                        datasources={this.state.datasources}
                        regressions={this.state.regressions}
                        censusData={this.state.censusData}
                        activeCensusVariable = {this.state.activeCensusVariable}
                        ctppData = {this.state.ctppData}
                        lodesData = {this.state.lodesData}
                        routes = {this.state.routes}
                        routesGeo = {this.state.routesGeo}
                        stopsGeo = {this.state.stopsGeo}
                        eRoutesGeo={this.state.eRoutesGeo}
                        eStopsGeo = {this.state.eStopsGeo}
                        schedules = {this.state.schedules}
                        routingGeo = {this.state.routingGeo}
                        editMessage= {this.state.editResponse}
                        frequencyData={this.state.frequencyData}
                        freqEditResponse={this.state.freqEditResponse}
                        loadedModels = {this.state.loadedModels}
                        stateTracts = {this.state.stateTracts}
                        stateCounties = {this.state.stateCounties} />
    	    	</div>
        	</div>
        );
    },

    _populateMenu: function(marketareas){
        var maMenu = marketAreasToMenuItems(marketareas);
        if(!maMenu){
            maMenu = [{text:'Loading'}];
        }
        maMenu.push({text:'New Marketarea',icon:'fa fa-plus',action:'MarketAreaNew',type:'Route'});
        return {
            menu: [
                {text:'Dashboard',icon:'fa fa-home',action:'dashboard',type:'Route'},
                {text:'Market Areas',name:'marketAreas',icon:'fa fa-area-chart',
                    menuItems:maMenu
                },
                {text:'Data Sources',name:'dataSources',icon:'fa fa-database',
                    menuItems:[
                        {text:'GTFS',type:'Route',action:'GtfsManager'},
                        //{text:'ACS',type:'Route',action:'AcsManager'},
                        {text:'Regressions',type:'Route',action:'RegressionsManager'},
                        //{text:'Surveys',type:'Route',action:'SurveyManager'},
                        {text:'Farebox',type:'Route',action:'FareboxManager'}
                    ]
                },
                {text:'Job History', icon:'fa fa-cog', action:'jobhistory',type:'Route'},
                {text:'User\'s Guide',name:'usersGuide',icon:'glyphicon glyphicon-book',action:'/users_guide.pdf'},
                {text:'Final Report',name:'usersGuide',icon:'glyphicon glyphicon-book',action:'/final_report.pdf'}
            ]
        };
    }

});

module.exports = App;
