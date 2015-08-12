/*globals console,require,d3*/
'use strict';

var React = require('react'),

    //--Components
    LeafletMap = require('../utils/LeafletMap.react'),

    //--Utils
    d3 = require('d3'),
    colorbrewer = require('colorbrewer'),
     deepEqual = require('deep-equal'),
    odScale = d3.scale.quantile().range(colorbrewer.PuBu[6]),
    tractlayerID = 0,
    stopslayerID = 0,
    routeLayerID = 0,
    prevTractLength = 0,
    prevDomain = [],
    prevStopsLength = 0,
    prevRoutesLength = 0;

    //--Stores



var CtppMap = React.createClass({


    _toolTipContent:function(props,index){
        var scope = this;

        var category_name = Object.keys(this.props.censusData.getCategories())[this.props.activeCategory],
            category = this.props.censusData.getCategories()[category_name],
            tractData = this.props.censusData.getTractData();

        var total = 0;
        category.forEach(function(val){ total += tractData[props.geoid][val]; });
        var rows= category.map(function(cen_var,i){

            var row =   '<tr>'+
                            '<td style="width:10px;background-color:'+ d3.scale.category20().range()[i] +'"></td>'+
                            '<td>'+ cen_var.replace(/_/g," ") +'</td>'+
                            '<td>'+ (tractData[props.geoid][cen_var] / total*100).toFixed(2) +'%</td>'+
                            '<td>'+ tractData[props.geoid][cen_var] +'</td>'+
                        '</tr>';

            return row;

        });

        var test = rows.join('').toString();
        var c = '<table class="table">'+test+'</table>';

        //console.log(c);


        return c;
    },

    render: function() {
        var scope = this,
            geo = this.props.tracts,
            tractData = this.props.ctppData;

        var tractValues = {};
        if(tractData){

            odScale.domain(

                tractData.map(function(d){
                    if(scope.props.marketarea.zones.indexOf(d.key) > -1){
                        tractValues[d.key] = d.value;
                        return d.value;
                    }
                }).filter(function(d){
                    return d;
                }).sort(function(a,b){
                    return b-a;
                })

            );
        }
        //console.log('ctpp scale',odScale.domain())
        if(scope.props.routes.features.length !== prevRoutesLength){
          routeLayerID++;
          prevRoutesLength = scope.props.routes.features.length;
        }
        if(scope.props.stops.features.length !== prevStopsLength){
          stopslayerID++;
          prevStopsLength = scope.props.stops.features.length;
        }
        if(geo.features.length != prevTractLength || !deepEqual(prevDomain,odScale.domain())){
            tractlayerID++;
        }
        prevDomain = odScale.domain();
        prevTractLength = geo.features.length;
        d3.selectAll('.tract').attr('stroke','none');
        if(scope.props.selected){
          var ctract = d3.select('.geo_'+scope.props.selected);
          ctract.attr('stroke','black');
          ctract.attr('stroke-width','5');
        }
        var layers = {
                routesLayer:{
                    id:routeLayerID,
                    geo:scope.props.routes,
                    options:{
                        zoomOnLoad:true,
                        bringToBack:true,
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
                                        .html('Route '+feature.properties.short_name);
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
                    geo:scope.props.stops,
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
                },
                tractsLayer:{
                id: tractlayerID,
                geo: geo,
                options:{
                    zoomOnLoad:true,
                    bringToFront:true,
                    style:function(feature){
                        var styleobj =  {
                            stroke:false,
                            color:'#000',
                            opacity:1,
                            weight:5,
                            className:'tract geo_'+feature.properties.geoid,
                            fillColor:(tractValues[feature.properties.geoid]) ? odScale( tractValues[feature.properties.geoid] ): 0,
                            fillOpacity: 0.5
                        };
                        if(feature.properties.geoid === scope.props.selected){
                          styleobj.stroke = true;
                        }
                        return styleobj;

                    },
                    onEachFeature: function (feature, layer) {
                        layer.on({
                            mouseover: function(e){
                                this.setStyle({fillOpacity:1,
                                stroke:(scope.props.selected===feature.properties.geoid),
                                });
                                //  var toolTip = d3.select('.ToolTip').style({
                                //     top:e.originalEvent.clientY+'px',
                                //     left:e.originalEvent.clientX+'px',
                                //     display:'block'
                                // });

                                // toolTip.select('h4')
                                //     .attr('class','TT_Title')
                                //     .html('Tract : '+feature.properties.geoid);

                                // toolTip.select('span')
                                //     .attr('class','TT_Content')
                                //     .html(scope._toolTipContent(feature.properties,0));
                            },

                            click: function(e){
                                scope.setState({filter:feature.properties.geoid});
                                if(scope.props.selectTract){
                                  scope.props.selectTract(feature.properties.geoid);
                                  d3.selectAll('.tract').attr('stroke','none');
                                  var ctract = d3.select('.geo_'+feature.properties.geoid);
                                  ctract.attr('stroke','black');
                                  ctract.attr('stroke-width','5');
                                  // this.setStyle({stroke:true});
                                }
                            },


                            mouseout: function(e){
                               this.setStyle({fillOpacity:0.5,
                                 stroke:(scope.props.selected===feature.properties.geoid),
                                 });
                                // var toolTip = d3.select('.ToolTip').style({
                                //     top:e.originalEvent.clientY+'px',
                                //     left:e.originalEvent.clientX+'px',
                                //     display:'none'
                                // });
                            }
                        });
                    }

                }
            }
        };

        var legendLayers = {
            census:{
                title:'CTPP',
                scale:odScale
            }
        };

        return (
            <div>
                <LeafletMap layers={layers} legendLayers={legendLayers} height="750px" />
            </div>
        );
    },


});


module.exports = CtppMap;
