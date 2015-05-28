 'use strict';

var React = require('react'),
    d3 = require('d3'),
    colorbrewer  = require('colorbrewer'),
    deepEqual = require('deep-equal'),
    // -- Actions 
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),
    // --Components
    LeafletMap = require('../utils/LeafletMap.react'),
    
    //  --Component Globals
    tractlayerID = 0,
    prevTractLength,
    routeLayerID = 0,
    prevRouteLength,
    odScale = d3.scale.quantile().range(colorbrewer.PuBu[9]);    



var ModelMap = React.createClass({
    
    getDefaultProps: function() {
        return {
            mode:'Origin'
        };
    },

    _reduceTripTable:function(){
        var ttTractCount= {};
        this.props.currentTripTable.tt.forEach(function(trip){
            if(!ttTractCount[trip.from_geoid]){ ttTractCount[trip.from_geoid] = {o:0,d:0} }
            if(!ttTractCount[trip.to_geoid]){ ttTractCount[trip.to_geoid] = {o:0,d:0} }
            
            ttTractCount[trip.from_geoid].o++;
            ttTractCount[trip.to_geoid].d++;
        });
        return ttTractCount;
    },

    processLayers:function(){
        var scope = this,
            tractCounts = this._reduceTripTable();

        if(this.props.tracts.features.length !== prevTractLength){
            tractlayerID++;
            prevTractLength = this.props.tracts.features.length
        }
        if(this.props.routes.features.length !== prevRouteLength){
            routeLayerID++;
            prevRouteLength = this.props.tracts.features.length
        }
        
        
        var flatTrips = Object.keys(tractCounts).map(function(key){
            return scope.props.mode === 'Origin' ? tractCounts[key].o : tractCounts[key].d
        }).sort(function(a, b) { return a - b; });

        
        if( !deepEqual(odScale.domain(),flatTrips) ){
            
            odScale.domain(flatTrips);
            d3.selectAll('.tract')
                .attr('fill',function(feature){
                    
                   
                    var geoid = d3.select(this).attr('class').split('_')[1];
                    var scaleValue = 0; 

                    if(tractCounts[geoid]){
                        scaleValue = scope.props.mode === 'Origin' ? tractCounts[geoid].o : tractCounts[geoid].d;
                    }
                    return odScale(scaleValue);
                })

        }
        //console.log('testing',tractCounts)
        return {
            tractsLayer:{
                id:tractlayerID,
                geo:this.props.tracts,
                options:{
                    zoomOnLoad:true,
                    style:function (feature) {

                        
                        //console.log(scaleValue,feature.properties.geoid, tractCounts[feature.properties.geoid])
                        return {
                            className: 'tract geo_'+feature.properties.geoid+'_',
                            stroke:false,
                            weight:2
                        };
                    },
                    onEachFeature: function (feature, layer) {
                        
                        layer.on({
                            click: function(e){
                            },
                            mouseover: function(e){
                                //console.log(feature.properties)
                                this.setStyle({weight:2,stroke:true,fillColor:this._path.attributes[3].nodeValue});
                                var table='<table class="table"><tr><td>Origin Trips</td><td>'+tractCounts[feature.properties.geoid]+'</td></tr><tr><td>Destination Trips</td><td>'+tractCounts[feature.properties.geoid]+'</td></tr></table>';
                                var tt = d3.select('.ToolTip').style({
                                    left:e.originalEvent.clientX+'px',
                                    top:e.originalEvent.clientY+'px',
                                    display:'block',
                                    opacity:1.0
                                })
                                tt.select('h4')
                                    .attr('class','TT_Title')
                                    .html('Tract '+feature.properties.geoid)
                                tt.select('span')
                                    .attr('class','TT_Content')
                                    .html(table)

                            },
                            mouseout: function(e){
                                this.setStyle({stroke:false,fillColor:this._path.attributes[3].nodeValue});
                                var tt = d3.select('.ToolTip').style({opacity:0});
                                tt.select('span')
                                    .attr('class','TT_Content')
                                    .html('')
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
                            opacity:1,
                            color:'#333',
                            fillColor:'#999'
                        };
                    },
                    onEachFeature: function (feature, layer) {
                        
                        layer.on({

                            click: function(e){
                                console.log('station_click',e.target.feature.properties);
                            },
                            mouseover: function(e){
                                e.target.setStyle({opacity:1,weight:12});
                                d3.select('.ToolTip').style({
                                    left:e.originalEvent.clientX+'px',
                                    top:e.originalEvent.clientY+'px',
                                    display:'block',
                                    opacity:1.0
                                }).select('h4')
                                    .attr('class','TT_Title')
                                    .html('Route '+feature.properties.short_name)
                            },
                            mouseout: function(e){
                                //scope._updateTooltip({ x:0,y:0,display:'none'});
                                d3.select('.ToolTip').style({opacity:0});
                                e.target.setStyle({opacity :1,weight:5})
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
        var legendLayers = {
            od:{
                type:'buttonGroup',
                buttons:[
                    {text:'Origins',value:'Origin',click:ModelingActionsCreator.setMode},
                    {text:'Destinations',value:'Destination',click:ModelingActionsCreator.setMode}
                ],
                active:this.props.mode
            },
            triptable:{
                title:'Trip '+this.props.mode+'s',
                scale:odScale
            }
            
        }

        return (
              
            <div>
                <LeafletMap layers={this.processLayers()} legendLayers={legendLayers} legendOptions={{location:'bottomRight'}} height="800px" />
            </div>
                            
        );
    },
    

});

module.exports = ModelMap;