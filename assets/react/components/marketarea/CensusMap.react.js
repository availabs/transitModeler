'use strict';

var React = require('react'),
    
    //--Components
    
    //--Utils
    L = require('leaflet'),
    d3 = require('d3'),
    topojson = require('topojson'),
    leafletLayer = require('../../utils/d3LeafletLayers'),

    //--Stores
    MarketAreaStore = require('../../stores/MarketAreaStore'),
    CensusStore = require('../../stores/CensusStore'),
    GeodataStore = require('../../stores/GeodataStore');    

var map = null,
    currentLayer = null;

function getStatefromStore(){
  return {
    tracts:GeodataStore.getMarketAreaTracts()
  };
}

var CensusMap = React.createClass({
    
    getInitialState: function() {
        return {
            tracts:GeodataStore.getMarketAreaTracts()
        };
    },
    componentWillUnmount: function() {
        GeodataStore.removeChangeListener(this._onGeoChange);
        MarketAreaStore.removeChangeListener(this._onGeoChange);
        
    },
    _onGeoChange:function(){
        this.setState(getStatefromStore())
        this._loadMapLayers();        
    },
    _loadMapLayers:function(){
      //console.log(this.state.tracts);
      //if its empty, do nothing
      if(this.state.tracts.features.length === 0){
        return;
      }
      
      var options = {
          layerId:'tracts',
          classed:'ma-tract',
      };
      currentLayer = new L.GeoJSON.d3(this.state.tracts,options);
      map.addLayer(currentLayer);
      //find bounds and zoom
      var bounds = d3.geo.bounds(this.state.tracts);
      map.fitBounds([bounds[0].reverse(),bounds[1].reverse()])
    },

    componentDidMount: function() {
        MarketAreaStore.addChangeListener(this._onGeoChange);
        GeodataStore.addChangeListener(this._onGeoChange);
        

        var scope = this;

        var mapDiv = document.getElementById('map');
        mapDiv.setAttribute("style","height:800px");

        var mapquestOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/am3081.kml65fk1/{z}/{x}/{y}.png");
        
        map = L.map("map", {
          center: [39.8282, -98.5795],
          zoom: 4,
          layers: [],//[mapquestOSM],
          zoomControl: false
        });
        
        this._loadMapLayers()    
    
    },

    render: function() {

        
        return (
            
          <div id="map">
             
          </div>
                          
        );
    },
    

});



module.exports = CensusMap;