'use strict';

var React = require('react'),

    //--Components
    LeafletMap = require('../utils/LeafletMap.react'),
    //--Utils
    stopslayerID = 0,
    prevStopsLength,
    tractlayerID = 0,
    outerTractsLength,
    prevTractLength,
    routeLayerID = 0,
    prevRouteLength,
    countyLayerID = 0,
    prevCountyLength,
    surveyLayerID = 0,
    prevSurveyLength,
    prevMode;


var tractChange = function(tracts){//check the number of tracts with outer type
  var outers = tracts.features.filter(function(d){// get a list of the outers
    return d.properties.type === 1;
  });
  if(outers.length !== outerTractsLength ){ //check if the length is the same as last time
    outerTractsLength = outers.length;
    return true;                          //if not return true for an update
  }
  return false;
};

var MarketAreaMap = React.createClass({

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
            counties = emptyGeojson,
            survey = emptyGeojson;

        //console.log('processLayers, diplay tracts',this.props.survey);
        if(this.props.stops){
            stops = this.props.stops;
        }
        if(this.props.tracts){
            tracts = this.props.tracts;
        }
        if(this.props.routes){
            routes = this.props.routes;
        }
        if(this.props.counties){
            counties = this.props.counties;
        }
        if(this.props.survey){
            survey = this.props.survey;
        }

        if(survey.features.length !== prevSurveyLength){
            surveyLayerID++;
            prevSurveyLength = survey.features.length;
        }

        if(tracts.features.length !== prevTractLength || tractChange(tracts)){
            tractlayerID++;
            prevTractLength = tracts.features.length;
        }
        if(routes.features.length !== prevRouteLength){
            routeLayerID++;
            prevRouteLength = routes.features.length;
        }
        if(stops.features.length !== prevStopsLength){
            stopslayerID++;
            prevStopsLength = stops.features.length;
        }
        if(this.props.mode && this.props.mode !== prevMode){
            stopslayerID++;
            prevMode = this.props.mode;
        }
        if(counties.features.length !== prevCountyLength){
            countyLayerID++;
            prevCountyLength = counties.features.length;
        }
        return {
            surveyLayer:{
                id:surveyLayerID,
                geo:survey,
                options:{
                    pointToLayer: function (d, latlng) {
                        //console.log('s',d)
                        var options = {


                            color: "#000" ,
                            weight: 3,
                            opacity: 1,
                            fillOpacity: 0.3,
                            stroke:false,
                            className:'survey',
                            fillColor:'#00a',
                            radius: 5
                        };
                        return L.circleMarker(latlng, options);
                    },
                    onEachFeature: function (feature, layer) {

                        layer.on({

                            click: function(e){
                                console.log('station_click',e.target.feature.properties);
                            },
                            mouseover: function(e){
                                e.target.setStyle({weight:6,fillColor:'#a00',fillOpacity:0.8,stroke:true});

                            },
                            mouseout: function(e){
                                 e.target.setStyle({weight:3,fillColor:'#00a',fillOpacity:0.3,stroke:false});

                            }
                        });

                    }
                }
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
                        };
                    },

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
                            fillColor:(!feature.properties.type)?'#45ED8B':'#BA1274',
                            weight:1,
                            opacity: scope.props.displayTracts ? 0.5 : 0,
                            fillOpacity: scope.props.displayTracts ? 0.2 : 0
                        };
                    },
                    onEachFeature: function (feature, layer) {

                        layer.on({
                            click: function(e){
                                console.log('station_click',e.target.feature.properties);
                                if(scope.props.toggleTracts)
                                  scope.props.toggleTracts(feature);
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
                    zoomOnLoad:true,
                    zoomOnUpdate:true,
                    bringToFront:true,
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
                                e.target.setStyle({opacity :0.3});
                                //d3.selectAll('.highlighted-station').classed('highlighted-station',false)
                            },


                        });

                    }
                }
            },
            stopsLayer:{
                id:stopslayerID,
                geo:stops,
                options:{
                    pointToLayer: function (d, latlng) {

                        var r = scope.props.stopsData ?  scope.props.stopsData.scale(scope.props.stopsData.data[d.properties.stop_code]) : 2;
                        if(isNaN(r)){
                            r = 2;
                        }
                        var options = {


                            color: "#00a" ,
                            weight: 3,
                            opacity: 1,
                            fillOpacity: 0.8,
                            stroke:false,
                            className:'busStop',
                            fillColor: scope.props.mode === 'stop_alighting' ? "#0a0" :'#a00',
                            radius: r
                        };
                        return L.circleMarker(latlng, options);
                    },
                }
            }
        }
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

        return (

            <div>
                <LeafletMap
                    layers={this.processLayers()}
                    ToolTip={this.state.tooltip}
                    mapId={this.props.mapId}
                    legendLayers={this.props.legendLayers}
                    height="500px" />
            </div>

        );
    },


});

module.exports = MarketAreaMap;
