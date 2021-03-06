'use strict';

var React = require('react'),
    
    //--Components
    LeafletMap = require('../utils/LeafletMap.react'),
    //--Utils
    tractlayerID = 0,
    prevTractLength,
    routeLayerID = 0,
    prevRouteLength;    



var EditMap = React.createClass({
    
    getInitialState: function() {
        return {
            tooltip:{
                x:0,
                y:0,
                display:'none'
            }
        };
    },

    processLayers:function(){
        var scope = this;
        if(this.props.tracts.features.length !== prevTractLength){
            tractlayerID++;
            prevTractLength = this.props.tracts.features.length
        }
        if(this.props.routes.features.length !== prevRouteLength){
            routeLayerID++;
            prevRouteLength = this.props.tracts.features.length
        }
        return {
            tractsLayer:{
                id:tractlayerID,
                geo:this.props.tracts,
                options:{
                    zoomOnLoad:true,
                    style:function (feature) {
                        return {
                            className: 'ma-tract'
                        };
                    },
                    onEachFeature: function (feature, layer) {
                        
                        layer.on({

                            click: function(e){
                                console.log('station_click',e.target.feature.properties);
                            },
                            mouseover: function(e){
                                //e.target.setStyle({stroke:true});
                                // if (scope.isMounted()) {
                                //     scope.setState({
                                //         tooltip:{
                                //             x:e.originalEvent.clientX,
                                //             y:e.originalEvent.clientY,
                                //             content:'test123',
                                //             title:e.target.feature.properties.address,
                                //             display:'block'
                                //         }
                                //     });
                                // }
                            },
                            mouseout: function(e){
                                //e.target.setStyle({stroke:false})
                                //d3.selectAll('.highlighted-station').classed('highlighted-station',false)
                                //console.log('mouseout tract');
                            }
                        });
                        
                    }
                }
            },
            routesLayer:{
                id:routeLayerID,
                geo:this.props.routes,
                options:{
                    style:function (feature) {
                        return {
                            className: 'route_'+feature.properties.short_name,
                            weight:5,
                            opacity:0.3,
                            color : d3.select('.route_color_'+feature.properties.short_name).style('background-color')
                        };
                    },
                    onEachFeature: function (feature, layer) {
                        
                        layer.on({

                            click: function(e){
                                console.log('station_click',e.target.feature.properties);
                            },
                            mouseover: function(e){
                                var classColor = d3.select('.route_color_'+feature.properties.short_name).style('background-color');
                                e.target.setStyle({opacity:0.7});
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
                                console.log('mouseout1')
                                //scope._updateTooltip({ x:0,y:0,display:'none'});
                                d3.select('.ToolTip').style({opacity:0});
                                e.target.setStyle({opacity :0.3})
                                //d3.selectAll('.highlighted-station').classed('highlighted-station',false)
                            },
                            
                            
                        });
                        
                    }
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
                <LeafletMap layers={this.processLayers()}   ToolTip={this.state.tooltip} height="800px" />
            </div>
                            
        );
    },
    

});

module.exports = EditMap;