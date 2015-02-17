var React = require('react'),
    RouteHandler = require('react-router').RouteHandler,

    // -- App Templates
    Sidebar = require('../components/Sidebar.react'),
    Logo = require('../components/Logo.react'),
    Header = require('../components/Header.react'),

    // -- Stores
    MarketAreaStore = require('../stores/MarketAreaStore.js');
    

function getStateFromStores() {

  return MarketAreaStore.getAll();

}

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
    return this._populateMenu(getStateFromStores());
  },

  componentDidMount: function() {
    MarketAreaStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    MarketAreaStore.removeChangeListener(this._onChange);
  },

  render: function() {
    return (
    	<div>
    		<Logo />
	    	<Sidebar menuItems={this.state.menu} />
	    	<div className="wrap">
                <Header />
	    		 <RouteHandler/>
	    	</div>
    	</div>
    );
  },
  
  _onChange: function() {
    this.setState( this._populateMenu( getStateFromStores() ) );
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