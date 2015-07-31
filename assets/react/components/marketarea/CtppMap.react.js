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
    prevTractLength = 0,
    prevDomain = [];

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
                tractsLayer:{
                id: tractlayerID,
                geo: geo,
                options:{
                    zoomOnLoad:true,
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
