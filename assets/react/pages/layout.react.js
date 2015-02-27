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
    RegressionStore = require('../stores/RegressionStore');
    

function marketAreasToMenuItems(marketareas){
    return Object.keys(marketareas).map(function(key){
        return {
            text:marketareas[key].name,
            name:'marketarea-'+marketareas[key].id,
            menuItems:[
                {text:'Overview',type:'Route',action:'MarketAreaIndex',params:{marketareaID:marketareas[key].id}},
                {text:'Modeling',type:'Route',action:'ModelAnalysis',params:{marketareaID:marketareas[key].id}},
            ]
        }
    })
}

var App = React.createClass({
 
    getInitialState: function(){   
        return {
            menu:this._populateMenu( MarketAreaStore.getAll() ).menu,
            currentMarketarea: MarketAreaStore.getCurrentMarketArea() || {id:0,name:'',routesGeo:{type:'FeatureCollection',features:[]}},
            marketareas:MarketAreaStore.getAll(),
            tracts: GeodataStore.getMarketAreaTracts(),
            datasources: DatasourcesStore.getAll(),
            activeJobs: JobStore.getActive(),
            regressions:RegressionStore.getAll()
        };
    },

    componentDidMount: function() {
        JobStore.addChangeListener(this._onChange);
        MarketAreaStore.addChangeListener(this._onChange);
        DatasourcesStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        JobStore.removeChangeListener(this._onChange);
        MarketAreaStore.removeChangeListener(this._onChange);
        DatasourcesStore.removeChangeListener(this._onChange);
    },

    render: function() {
        return (
        	<div>
        		<Logo />
    	    	<Sidebar activeJobs={this.state.activeJobs} menuItems={this.state.menu} />
    	    	<div className="wrap">
                    <Header />
    	    		 <RouteHandler 
                        marketarea={this.state.currentMarketarea}
                        marketareas ={this.state.marketareas}
                        tracts={this.state.tracts} 
                        datasources={this.state.datasources}
                        regressions={this.state.regressions} />
    	    	</div>
        	</div>
        );
    },
  
    _onChange: function() {
        this.setState({
          menu:this._populateMenu( MarketAreaStore.getAll()).menu,
          currentMarketarea: MarketAreaStore.getCurrentMarketArea() || {id:0,name:'',routesGeo:{type:'FeatureCollection',features:[]}},
          marketareas:MarketAreaStore.getAll(),
          tracts: GeodataStore.getMarketAreaTracts(),
          datasources: DatasourcesStore.getAll(),
          activeJobs: JobStore.getActive(),
          regressions:RegressionStore.getAll()
        });
    },

    _populateMenu: function(marketareas){
        var maMenu = marketAreasToMenuItems(marketareas);
        if(!maMenu){
            maMenu = [{text:'Loading'}]
        }
        
        return {
            menu: [
                {text:'Dashboard',icon:'fa fa-home',action:'dashboard',type:'Route'},
                {text:'Market Areas',name:'marketAreas',icon:'fa fa-area-chart',
                    menuItems:maMenu
                },
                {text:'Data Sources',name:'dataSources',icon:'fa fa-database',
                    menuItems:[
                        {text:'GTFS',type:'Route',action:'GtfsManager'},
                        {text:'ACS',type:'Route',action:'AcsManager'},
                        {text:'Regressions',type:'Route',action:'RegressionsManager'}
                    ]
                },
                {text:'User\'s Guide',name:'usersGuide',icon:'glyphicon glyphicon-book',action:'/docs/NJTransit%20User\'s%20Manual.pdf'}
            ]
        }
    }

});

module.exports = App;