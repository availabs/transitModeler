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
    


var CensusMap = React.createClass({
    
     _toolTipContent:function(props,index){
        var scope = this;

        var category_name = Object.keys(this.props.censusData.getCategories())[this.props.activeCategory],
            category = this.props.censusData.getCategories()[category_name],
            tractData = this.props.censusData.getTractData();

        var total = 0;
        category.forEach(function(val){ total += tractData[props.geoid][val] });
        var rows= category.map(function(cen_var,i){
            
            var row =   '<tr>'+
                            '<td style="width:10px;background-color:'+ d3.scale.category20().range()[i] +'"></td>'+
                            '<td>'+ cen_var.replace(/_/g," ") +'</td>'+
                            '<td>'+ (tractData[props.geoid][cen_var] / total*100).toFixed(2) +'%</td>'+
                            '<td>'+ tractData[props.geoid][cen_var].toLocaleString() +'</td>'+
                        '</tr>'
        
            return row;
        
        });

        var test = rows.join('').toString();
        var c = '<table class="table">'+test+'</table>';

        //console.log(c);


        return c;
    },

    render: function() {
        var scope = this,
            geo = this.props.tracts;

        var tractData = this.props.censusData.getTractData(),
            activeVariable = this.props.activeVariable;

        odScale.domain(
            
            geo.features.map(function(feature){
                if( tractData[feature.properties.geoid] ){
                    return tractData[feature.properties.geoid][activeVariable];
                }
                return 0
            }).filter(function(d){
                return d > 0;
            }).sort(function(a,b){
                return b-a;
            })

        );

        
        if(geo.features.length != prevTractLength || !deepEqual(prevDomain,odScale.domain())){
            tractlayerID++;
        }        
        prevDomain = odScale.domain();
        prevTractLength = geo.features.length;

        var layers = {
                tractsLayer:{
                id: tractlayerID,
                geo: geo,
                options:{ 
                    zoomOnLoad:true,
                    style:function(feature){
                        return {
                            stroke:false,
                            className:'tract geo_'+feature.properties.geoid,
                            fillColor: odScale( tractData[feature.properties.geoid] ? tractData[feature.properties.geoid][activeVariable] : 0),
                            fillOpacity: 0.5
                        }
                    },
                    onEachFeature: function (feature, layer) {
                        layer.on({
                            mouseover: function(e){
                                this.setStyle({stroke:true});
                                 var toolTip = d3.select('.ToolTip').style({
                                    top:e.originalEvent.clientY+'px',
                                    left:e.originalEvent.clientX+'px',
                                    display:'block'
                                });

                                toolTip.select('h4')
                                    .attr('class','TT_Title')
                                    .html('Tract : '+feature.properties.geoid);

                                toolTip.select('span')
                                    .attr('class','TT_Content')
                                    .html(scope._toolTipContent(feature.properties,0));
                            },

                            click: function(e){

                            },


                            mouseout: function(e){
                               this.setStyle({stroke:false});
                                var toolTip = d3.select('.ToolTip').style({
                                    top:e.originalEvent.clientY+'px',
                                    left:e.originalEvent.clientX+'px',
                                    display:'none'
                                });
                            }
                        })
                    }

                }
            }
        }

        var legendLayers = {
            census:{
                title:this.props.activeVariable,
                scale:odScale
            }
        }
        
        return (
            <div>
                <LeafletMap layers={layers} legendLayers={legendLayers} height="750px" />
            </div>
        );
    },
    

});


module.exports = CensusMap;