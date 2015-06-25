'use strict';

var React = require('react'),
    L = require('leaflet'),
    //--Components
    LeafletMap = require('./GtfsLeafletMap.react'),
    //--Utils
    stopslayerID = 0,
    prevStopsLength,
    tractlayerID = 0,
    prevTractLength,
    routeLayerID = 0,
    prevRouteLength,
    countyLayerID = 0,
    routingLayerId = 0,
    prevCountyLength,
    prevMode,
    prevStops=null;




var GtfsEditorMap = React.createClass({

    getDefaultProps:function(){
        return {
            mapId:'map',
            displayTracts: true,
            legendLayers:{}
        }
    },

    getInitialState: function() {
        return {
            tooltip:{
                x:0,
                y:0,
                display:'none'
            },

        };
    },

    processLayers:function(){
        var scope = this,
            emptyGeojson = {type:'FeatureCollection',features:[]},
            stops = emptyGeojson,
            tracts = emptyGeojson,
            routes = emptyGeojson,
            routingGeo = emptyGeojson,
            counties = emptyGeojson;

        //console.log('processLayers, diplay tracts',this.props.displayTracts);
        if(this.props.stops){
            stops = this.props.stops
        }
        if(this.props.tracts){
            tracts = this.props.tracts
        }
        if(this.props.routes){
            routes = this.props.routes
        }
        if(this.props.counties){
            counties = this.props.counties
        }
        if(this.props.routingGeo){
            routingGeo = this.props.routingGeo;

        }
        if(tracts.features.length !== prevTractLength){
            tractlayerID++;
            prevTractLength = tracts.features.length;
        }
        if(routes.features.length !== prevRouteLength){
            routeLayerID++;
            prevRouteLength = routes.features.length;
        }
        if( (stops.features.length !== prevStopsLength)
            || !prevStops || (prevStops !== stops)  ){
            stopslayerID++;
            prevStopsLength = stops.features.length;
            prevStops = stops;
        }
        if(this.props.mode && this.props.mode !== prevMode){
            stopslayerID++;
            prevMode = this.props.mode;
        }
        if(counties.features.length !== prevCountyLength){
            countyLayerID++;
            prevCountyLength = counties.features.length;
        }
        routingLayerId++;
        return {

            routingLayer:{
                id:routingLayerId++,
                geo:routingGeo,
                options:{}
            },
            countiesLayer:{
                id:countyLayerID,
                geo:counties,
                options:{
                    zoomOnLoad:true,
                    style:function(feature){
                        return {
                            fill:false,
                            stroke:true,
                            dashArray:'15, 10, 5, 10, 15',
                            weight:2,
                            color:'#000'
                        }
                    }
                }
            },
            tractsLayer:{
                id:tractlayerID,
                geo:tracts,
                options:{
                    zoomOnLoad:true,
                    style:function (feature) {
                        return {
                            //className: 'ma-tract',
                            fillColor:'#fff',
                            weight:1,
                            opacity: scope.props.displayTracts ? 0.5 : 0,
                            fillOpacity: scope.props.displayTracts ? 0.2 : 0
                        };
                    },
                    onEachFeature: function (feature, layer) {

                        layer.on({

                            click: function(e){
                                console.log('station_click',e.target.feature.properties);
                            },
                            mouseover: function(e){
                                e.target.setStyle({weight:6});

                            },
                            mouseout: function(e){
                                 e.target.setStyle({weight:1});

                            }
                        });

                    }
                }
            },
            routesLayer:{
                id:routeLayerID,
                geo:routes,
                options:{

                    style:function (feature,i) {
                        return {
                            className: 'route_'+feature.properties.short_name,
                            weight:7,
                            opacity:0.3,
                            color : feature.properties.color ? feature.properties.color : '#000'
                        };
                    },

                    onEachFeature: function (feature, layer) {

                        layer.on({

                            click: function(e){
                                //console.log('station_click',e.target.feature.properties);
                            },
                            mouseover: function(e){
                                var classColor = feature.properties.color ? feature.properties.color : '#000'; //d3.select('.route_color_'+feature.properties.short_name).style('background-color');
                                e.target.setStyle({opacity:0.7,weight:10});
                                d3.select('.ToolTip').style({
                                    left:e.originalEvent.clientX+'px',
                                    top:e.originalEvent.clientY+'px',
                                    display:'block',
                                    opacity:1.0,
                                    'border-top':'5px solid '+classColor
                                }).select('h4')
                                    .attr('class','TT_Title')
                                    .style({
                                        color:classColor
                                    })
                                    .html('Route '+feature.properties.short_name)
                            },
                            mouseout: function(e){
                                //console.log('mouseout1')
                                //scope._updateTooltip({ x:0,y:0,display:'none'});
                                d3.select('.ToolTip').style({opacity:0});
                                e.target.setStyle({opacity :0.3})
                                //d3.selectAll('.highlighted-station').classed('highlighted-station',false)
                            },


                        });

                    }
                }
            },
            stopsLayer:{
                id:stopslayerID,
                geo:stops,
                options:{}
            }
        };
    },
    _updateTooltip:function(tt){
        var scope = this;
        if (scope.isMounted()) {
            scope.setState({
                tooltip:tt
            });
        }
    },

    render: function() {
        console.log(this.processLayers());
        return (

            <div>
                <LeafletMap
                    layers={this.processLayers()}
                    ToolTip={this.state.tooltip}
                    mapId={this.props.mapId}
                    deleteStop={this.props.deleteStop}
                    createTrip={this.props.createTrip}
                    addStop   ={this.props.addStop}
                    onStopMove={this.props.onStopMove}
                    legendLayers={this.props.legendLayers}
                    isCreating={this.props.isCreating}
                    editStop ={this.props.editStop}
                    needZoom ={this.props.tripChange}
                    height="500px" />
            </div>

        );
    },


});

module.exports = GtfsEditorMap;
