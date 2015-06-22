'use strict';

var React = require('react'),
    
    //--Components
    // ToolTip = require('./ToolTip.react'),
    // MapLegend = require('./MapLegend.react'),
    
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
            legendLayers : {},
            legendOptions: {location:'bottomRight'},
            mapId:'map_'+Math.floor((Math.random() * 100) + 1)
        }
    },

    componentDidMount: function() {
        this.renderMap();
    },
    _setStopOptions : function(map){
        var scope = this;
        return {
                    pointToLayer: function (d, latlng) {
                        var divmarker = L.divIcon({
                            className:'divMarker',
                            iconSize:[10,10],
                          }),
                        options = {
                            icon:divmarker,
                            draggable:true,
                        },
                        obj = L.marker(latlng, options);
                        obj.on('dragend',function(){
                              // map.removeLayer(layers.paths);
                              obj.feature.geometry.coordinates[0] = obj._latlng.lng;
                              obj.feature.geometry.coordinates[1] = obj._latlng.lat;
                              scope.props.onStopMove(obj.feature);
                              // update.update(obj.feature);
                              // saver.attr('disabled',null);
                           });
                        obj.on('dblclick',function(){
                            if(layers['stopsLayer'].layer.getLayers().length > 2){
                                scope.props.deleteStop(obj.feature);
                            }
                        })
                        return obj;
                    },
                    onEachFeature:function(f,layer){
                        layer.bindPopup(f.properties.stop_id,{
                            offset:[0,-10]
                        });
                    },
                } 
    },
    _setRoutingOptions : function(map){
        var scope = this;
        return {

                    style:function(feature){
                        return {
                            color:'yellow',
                            opacity: 1,
                            weight:10,
                            className:'routingPath'
                        };
                    },
                    onEachFeature:function(feat,layer){
                        var divmarker = L.divIcon({
                            className:'divMarker',
                            iconSize:[10,10],
                        }),
                        tempMarker;
                        layer.on({
                            click: function(e){
                                tempMarker = L.marker(e.latlng,{icon:divmarker, draggable:true});
                                layers.stopsLayer.layer.addLayer(tempMarker);
                                tempMarker = undefined;
                                scope.props.addStop();
                            },
                            mouseover : function(e){
                                e.target.setStyle({opacity:0.5})
                            },
                            mouseout : function(e){
                                e.target.setStyle({opacity:1})
                            }
                        });
                      },
                }
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
        if(key === 'stopsLayer'){
            layer.options = this._setStopOptions(map);
        }
        if(key === 'routingLayer'){
            layer.options = this._setRoutingOptions(map);
        }
        layers[key] = {
            id:layer.id,
            layer: new L.geoJson({type:'FeatureCollection',features:[]},layer.options)
        }
        layers[key].layer.addData(layer.geo); // to get layerAdd event
        map.addLayer(layers[key].layer);
        if(layer.options.zoomOnLoad){
            var ezBounds = d3.geo.bounds(layer.geo);
            map.fitBounds([ezBounds[0].reverse(),ezBounds[1].reverse()]);
        }
    },

    _renderLegend: function(){
        
        
        if( Object.keys(this.props.legendLayers).length === 0 ){
            
            return (
                <span />
            )
        }

        return (
            <MapLegend layers={this.props.legendLayers} options={this.props.legendOptions} />
        )

    },

    render: function() {
        return (
            <div className="map" id={this.props.mapId}>
                
                // {this._renderLegend()}
            </div>

        );
    },

    renderMap:function(){
        var scope = this;
        var mapDiv = document.getElementById(this.props.mapId);
        mapDiv.setAttribute("style","height:"+this.props.height);        
        var key = 'erickrans.4f9126ad',//am3081.kml65fk1,
            mapquestOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/"+key+"/{z}/{x}/{y}.png");
        map = L.map(this.props.mapId, {
            center: [39.8282, -98.5795],
            zoom: 4,
            layers: [mapquestOSM],
            zoomControl: false,
            attributionControl: false
        });
        // map.on('click',function(e){
        //     scope.props.createStop(map);
        // })
        if(this.props.layers){
            Object.keys(this.props.layers).forEach(function(key){
                var currLayer = scope.props.layers[key]
                if(key==='stopsLayer'){
                    currLayer.options = scope._setStopOptions(map);
                }
                if(key==='routingLayer'){
                    currLayer.options = scope._setRoutingOptions(map);
                }
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
    }
});


module.exports = Map;