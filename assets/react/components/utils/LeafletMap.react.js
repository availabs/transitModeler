'use strict';

var React = require('react'),
    
    //--Components
    ToolTip = require('./ToolTip.react'),
    
    //--Utils
    L = require('leaflet'),
    d3 = require('d3'),
    colorbrewer = require('colorbrewer'),
    topojson = require('topojson');
    

var map = null,
    layers = {};


var Map = React.createClass({
    
    getDefaultProps:function(){
        return {
            height : '500px',
            ToolTip : {display:'none'},
            layerrs :{}
        }
    },

    componentDidMount: function() {
        this.renderMap();
    },
    
    componentWillReceiveProps: function(nextProps) {
        var scope = this;
        if(nextProps.layers){
            
            Object.keys(nextProps.layers).forEach(function(key){
                var currLayer = nextProps.layers[key];
                if(layers[key]){
                    //if layer existed previously check version ids
                    if(currLayer.id !== layers[key].id && currLayer.geo.features.length > 0){
                        scope._updateLayer(key,currLayer)        
                    }
                }else if(currLayer.geo.features.length > 0){
                    //layer is new and has features
                    scope._updateLayer(key,currLayer)
                }else{
                    console.log('MAP/recieve props/ DEAD END')
                }
            });
        }    
    },
    
    _updateLayer : function(key,layer){
        if(map.hasLayer(layers[key].layer)){
            map.removeLayer(layers[key].layer)
        }
        layers[key] = {
            id:layer.id,
            layer: new L.geoJson({type:'FeatureCollection',features:[]},layer.options)
        }
        layers[key].layer.addData(layer.geo); // to get layerAdd event
        map.addLayer(layers[key].layer);
        if(layer.options.zoomOnLoad && layer.geo.features.length > 0){
            var ezBounds = d3.geo.bounds(layer.geo);
            map.fitBounds([ezBounds[0].reverse(),ezBounds[1].reverse()]);
        }
    },

    render: function() {
        return (
            <div className="map" id="map">
                <ToolTip config={this.props.ToolTip}/>
            </div>

        );
    },

    renderMap:function(){
        var scope = this;
        var mapDiv = document.getElementById('map');
        mapDiv.setAttribute("style","height:"+this.props.height);
        var key = 'erickrans.4f9126ad',//am3081.kml65fk1,
            mapquestOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/"+key+"/{z}/{x}/{y}.png");
        
        map = L.map("map", {
          center: [39.8282, -98.5795],
          zoom: 4,
          layers: [mapquestOSM],//[mapquestOSM],
          zoomControl: true,
          attributionControl:false
        });

        Object.keys(this.props.layers).forEach(function(key){
            
            var currLayer = scope.props.layers[key];
            layers[key] =  {
                id:currLayer.id,
                layer: L.geoJson(currLayer.geo,currLayer.options)
            };  
            map.addLayer(layers[key].layer);
            if(currLayer.options.zoomOnLoad && currLayer.geo.features.length > 0){
                var ezBounds = d3.geo.bounds(currLayer.geo);
                map.fitBounds([ezBounds[0].reverse(),ezBounds[1].reverse()]);
            }
        
        });
        
    }
});


module.exports = Map;