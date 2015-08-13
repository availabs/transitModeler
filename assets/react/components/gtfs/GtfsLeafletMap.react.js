'use strict';
/*globals confirm, console,module,require*/
var React = require('react'),

    //--Components
    // ToolTip = require('./ToolTip.react'),
    // MapLegend = require('./MapLegend.react'),

    //--Utils
    L = require('leaflet'),
    d3 = require('d3'),
    colorbrewer = require('colorbrewer'),
    Stop = require('./Gtfsutils').Stop,
    topojson = require('topojson'),
    newStopId = require('../utils/randomId');

var map = null,
    layers = {},
    divmarker = L.divIcon({
                    className:'divMarker',
                    iconSize:[10,10],
                }),
    allowLayerAddAction = true;

var _layerAddAction = function(featGroup,scope){

    function addLayer(e){
        var marker = e.layer, //This makes the reasonable assumption that the only layers to be added to this layer group will be markers
        stopPoint = marker._latlng,
        coors = [stopPoint.lng,stopPoint.lat],
        feat = {type:'Feature',
                geometry:{type:'Point',coordinates:coors},
                properties:{stop_id:newStopId()}
          },
        id = scope.props.addStop(feat);
        if(id === undefined){
            featGroup.removeLayer(marker);
        }
    }
    if(allowLayerAddAction)
        featGroup.on('layeradd',addLayer);
    featGroup.switchOnLayerAdd = function(){
        featGroup.on('layeradd',addLayer);
        allowLayerAddAction=true;
    };
    featGroup.switchOffLayerAdd = function(){
        allowLayerAddAction=false;
        featGroup.off('layeradd',addLayer);
    };

};

var Map = React.createClass({

    getDefaultProps:function(){
        return {
            height : '500px',
            ToolTip : {display:'none'},
            legendLayers : {},
            legendOptions: {location:'bottomRight'},
            mapId:'map_'+Math.floor((Math.random() * 100) + 1)
        };
    },

    componentDidMount: function() {
        this.renderMap();
    },
    _setStopOptions : function(map){
        var scope = this;
        return {

                    pointToLayer: function (d, latlng) {
                        var options = {
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
                          if(layers.stopsLayer.layer.getLayers().length > 2){
                              scope.props.deleteStop(obj.feature);
                          }
                        });
                        return obj;
                    },
                    onEachFeature:function(f,layer){
                            layer.on('click',function(e){
                              if(e.originalEvent.ctrlKey){//added ctrl click for firefox support
                                if(layers.stopsLayer.layer.getLayers().length > 2){
                                    scope.props.deleteStop(f);
                                }
                              }else{
                                scope.props.editStop(f.properties.stop_id);
                              }

                            });

                    },
                };
    },
    _setRoutingOptions : function(map){
        var scope = this;
        return {
                    zoomOnLoad:true,
                    style:function(feature){
                        return {
                            color:'yellow',
                            opacity: 1,
                            weight:10,
                            className:'routingPath'
                        };
                    },
                    onEachFeature:function(feat,layer){
                        var tempMarker;
                        layer.on({
                            click: function(e){
                                tempMarker = L.marker(e.latlng,{icon:divmarker, draggable:true});
                                layers.stopsLayer.layer.addLayer(tempMarker);
                                tempMarker = undefined;
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
                    if(currLayer.id !== layers[key].id && currLayer.geo.features.length >= 0){
                        scope._updateLayer(key,currLayer,nextProps.isCreating,nextProps.needZoom)
                    }
                }else if(currLayer.geo.features.length > 0){
                    //layer is new and has features
                    scope._updateLayer(key,currLayer,nextProps.isCreating,nextProps.needZoom)
                }else{
                    console.log('MAP/recieve props/ DEAD END')
                }
            });
        }
    },

    _updateLayer : function(key,layer,isCreating,isZooming){
        var scope = this;
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

        if(key === 'stopsLayer'){
            _layerAddAction(layers[key].layer,this);
            if( (layer.geo.features.length === 0) && isCreating){
                   this._createTrip();
            }
        }
        map.addLayer(layers[key].layer);
        if(key === 'tractsLayer' && isCreating){
          if(map.hasLayer(layers[key].layer)){
            map.removeLayer(layers[key].layer);
          }
        }

        var toplayers = Object.keys(layers).forEach(function(d){
          var currLayer = layers[d];
          if(currLayer.layer.options.bringToFront && map.hasLayer(currLayer.layer)){
              currLayer.layer.bringToFront();
          }
          if(currLayer.layer.options.bringToBack && map.hasLayer(currLayer.layer)){
            currLayer.layer.bringToBack();
          }
        });
        if(layer.options.zoomOnLoad && isZooming && layer.geo.features.length > 0 && layer.geo.features[0].geometry.coordinates.length > 0){
            var ezBounds = d3.geo.bounds(layer.geo);
            map.fitBounds([ezBounds[0].reverse(),ezBounds[1].reverse()]);
        }
    },

    _renderLegend: function(){
        if( Object.keys(this.props.legendLayers).length === 0 ){
            return (
                <span />
            );
        }
        return (
            <MapLegend layers={this.props.legendLayers} options={this.props.legendOptions} />
        );
    },

    render: function() {
        return (
            <div className="map" id={this.props.mapId}>

                // {this._renderLegend()}
            </div>

        );
    },
    _addStop : function(e){
        var marker = L.marker(e.latlng,{icon:divmarker,draggable:true});
        if(layers.stopsLayer)
            layers.stopsLayer.layer.addLayer(marker);
        else{
            layers.stopsLayer.layer = L.layerGroup([marker]);
            map.addLayer(layers.stopsLayer.layer);
        }
    },
    _createTrip : function(){
        var count = 0, scope = this;

        //stop the layeradd action from firing when initing a trip
        layers.stopsLayer.layer.switchOffLayerAdd();
        function onClick(e){
            console.log(e);
            scope._addStop(e);
            count += 1;
            if(count === 2){
                var newstops = layers.stopsLayer.layer.getLayers().map(function(d){
                    var s = new Stop();
                    s.setLat(d._latlng.lat);
                    s.setLon(d._latlng.lng);
                    s.setId(newStopId());
                    return s;
                });
                scope.props.createTrip(newstops);
                //once complete resume normal actions
                layers.stopsLayer.layer.switchOnLayerAdd();
                count = 0;
                map.off('click',onClick);
            }
        }
        if(!map.hasEventListeners('click')){
            map.on('click',onClick);
        }

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
        map.addControl(L.control.zoom({position:'bottomleft'}));

        if(this.props.layers){
            Object.keys(this.props.layers).forEach(function(key){
                var currLayer = scope.props.layers[key];
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
                if(key === 'stopsLayer'){
                    _layerAddAction(layers[key].layer,this);

                }
                map.addLayer(layers[key].layer);
                if(currLayer.options.bringToFront && map.hasLayer(currLayer.layer)){
                  currLayer.layer.bringToFront();
                }
                if(currLayer.options.bringToBack && map.hasLayer(currLayer.layer)){
                  currLayer.layer.bringToBack();
                }
                if(currLayer.options.zoomOnLoad && currLayer.geo.features.length > 0 && currLayer.geo.features[0].geometry.coordinates.length > 0){
                    var ezBounds = d3.geo.bounds(currLayer.geo);
                    map.fitBounds([ezBounds[0].reverse(),ezBounds[1].reverse()]);
                }
            });
        }
    }
});


module.exports = Map;
