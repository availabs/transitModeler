'use strict';

var React = require('react'),

    //--Components
    LeafletMap = require('../utils/LeafletMap.react'),
    MapControls = require('../utils/MapControls.react'),

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
    prevRoutesLength = 0,
     divmarker = L.divIcon({
                    className:'stop busStop',
                    iconSize:[2,2]
                });
    //--Stores



var CensusMap = React.createClass({

    getInitialState : function(){
        return {
            stop:true,
            route:true,
            display:'total'
        }
    },

    _getDomain:function(disp){
        var category_name = Object.keys(this.props.censusData.getCategories())[this.props.activeCategory],
            category = this.props.censusData.getCategories()[category_name],
            tractData = this.props.censusData.getTractData(),
            activeVariable = this.props.activeVariable,
            geo = this.props.tracts;

        if(disp === 'total'){
            return geo.features.map(function(feature){
                if( tractData[feature.properties.geoid] ){
                    return tractData[feature.properties.geoid][activeVariable];
                }
                return 0
            })

        }else if(disp === 'percent'){


            return geo.features.map(function(feature){
                if( tractData[feature.properties.geoid] ){
                     var total = 0;
                    category.forEach(function(val){ total += tractData[feature.properties.geoid][val] });
                    return (tractData[feature.properties.geoid][activeVariable]/total)*100;
                }
                return 0
            })

        }
    },

    _changeDisplay:function(disp){


        if(disp !== this.state.disp){

            odScale.domain(this._getDomain(disp));
            this.colorTracts()
            this.setState({display:disp})
        }
    },


    _customButtons: function(){
        return (
            <div className="btn-group" data-toggle="buttons">
                <label className="btn btn-success active" onClick={this._changeDisplay.bind(null,'total')}>
                    <input type="radio" name="options" id="option1" /> Total
                </label>
                <label className="btn btn-success" onClick={this._changeDisplay.bind(null,'percent')}>
                    <input type="radio" name="options" id="option2" /> Percent
                </label>

            </div>
        )
        // <label className="btn btn-success" onClick={this._changeDisplay.bind(null,'density')}>
        //     <input type="radio" name="options" id="option3" /> Density
        // </label>
    },

    _layerToggle:function(layer){
        //console.log('toggle layer',layer)
        var newState = {}
        if(this.state[layer]){
            d3.selectAll('.'+layer)
                .style('display','none')
            newState[layer] = false
            this.setState(newState)
        }else{
             d3.selectAll('.'+layer)
                .style('display','block')
            newState[layer] = true
            this.setState(newState)
        }
    },

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

    colorTracts:function (){
        // this.props.tracts.features.forEach(function(d){
        //     console.log(d.properties.geoid)
        // })
        var scope=this,
            category_name = Object.keys(this.props.censusData.getCategories())[this.props.activeCategory],
            category = this.props.censusData.getCategories()[category_name],
            tractData = this.props.censusData.getTractData(),
            activeVariable = this.props.activeVariable;

        d3.selectAll('.tract')
        .attr('fill',function(d){
            var geoid = this.classList[1].split('_')[1]
            if(scope.state.display === 'total'){
                return odScale( tractData[geoid] ? tractData[geoid][activeVariable] : 0)
            }else if(scope.state.display === 'percent'){
                    var total = 0;
                    category.forEach(function(val){ total += tractData[geoid][val] });
                  return odScale( tractData[geoid] ? (tractData[geoid][activeVariable]/total)*100 : 0)
            }
        })
    },

    render: function() {
        var scope = this,
            geo = this.props.tracts;

         var tractData = this.props.censusData.getTractData(),
            category_name = Object.keys(this.props.censusData.getCategories())[this.props.activeCategory],
            category = this.props.censusData.getCategories()[category_name],
            activeVariable = this.props.activeVariable;

        odScale.domain(

           this._getDomain(this.state.display)

        );

        if(scope.props.routes.features.length !== prevRoutesLength){
          routeLayerID++;
          prevRoutesLength = scope.props.routes.features.length;
        }
        if(scope.props.stops.features.length !== prevStopsLength){
          stopslayerID++;
          prevStopsLength = scope.props.stops.features.length;
        }
        if(geo.features.length != prevTractLength ){
            tractlayerID++;
        }
        if( !deepEqual(prevDomain,odScale.domain()) ){
            //console.log('color tracts here')
            this.colorTracts()
        }

        prevDomain = odScale.domain();
        prevTractLength = geo.features.length;

        var layers = {
                tractsLayer:{
                id: tractlayerID,
                geo: geo,
                options:{
                    zoomOnLoad:true,
                    //bringToFront:true,
                    bringToBack:true,
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

                                this.setStyle({
                                    stroke:true,
                                    fillColor: d3.select('.geo_'+feature.properties.geoid).attr('fill')
                                })

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
                               this.setStyle({
                                    stroke:false,
                                    fillColor: d3.select('.geo_'+feature.properties.geoid).attr('fill')
                                });
                                var toolTip = d3.select('.ToolTip').style({
                                    top:e.originalEvent.clientY+'px',
                                    left:e.originalEvent.clientX+'px',
                                    display:'none'
                                });
                            }
                        })
                    }

                }
            },
            routesLayer:{
                id:routeLayerID,
                geo:scope.props.routes,
                options:{
                    //bringToBack:true,
                    style:function (feature,i) {
                        return {
                            className: 'route route_'+feature.properties.short_name,
                            weight:7,
                            opacity:0.3,
                            color : scope.props.routeColors[feature.properties.short_name] ? scope.props.routeColors[feature.properties.short_name] : '#000'
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
                                // d3.select('.ToolTip').style({
                                //     left:e.originalEvent.clientX+'px',
                                //     top:e.originalEvent.clientY+'px',
                                //     display:'block',
                                //     opacity:1.0,
                                //     'border-top':'5px solid '+classColor
                                // }).select('h4')
                                //     .attr('class','TT_Title')
                                //     .style({
                                //         color:classColor
                                //     })
                                //     .html('Route '+feature.properties.short_name)
                            },
                            mouseout: function(e){
                                //console.log('mouseout1')
                                //scope._updateTooltip({ x:0,y:0,display:'none'});
                                // d3.select('.ToolTip').style({opacity:0});
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
                  bringToFront:true,
                    pointToLayer: function (d, latlng) {
                        var options = {
                            icon:divmarker,
                            draggable:false,
                            //className:'stop busStop',
                        },
                        obj = L.marker(latlng, options);
                        return obj;
                    },
                    // pointToLayer: function (d, latlng) {

                    //     var r = scope.props.stopsData ?  scope.props.stopsData.scale(scope.props.stopsData.data[d.properties.stop_code]) : 2;
                    //     if(isNaN(r)){
                    //         r = 2;
                    //     }
                    //     var options = {


                    //         color: "#00a" ,
                    //         weight: 3,
                    //         opacity: 1,
                    //         fillOpacity: 0.8,
                    //         stroke:false,
                    //         className:'stop busStop',
                    //         fillColor: scope.props.mode === 'stop_alighting' ? "#0a0" :'#a00',
                    //         radius: r
                    //     };
                    //     return L.circleMarker(latlng, options);
                    // },
                }
            }
        }

        var legendLayers = {

            census:{
                title:'Variable: '+this.props.activeVariable,
                scale:odScale
            }
        },

        legendOptions = {
            title:'Variable: '+this.props.activeVariable,
            location:'beneath'
        }

        //console.log('render map',odScale.domain());
        return (
            <div>

                <LeafletMap layers={layers}
                            height="750px"
                            label={(this.props.gtfsSettings)?"Gtfs:: " + (new Date(this.props.gtfsSettings.started)).toLocaleDateString():''}
                            />

                <MapControls  layers={legendLayers} options={legendOptions} layerToggle={this._layerToggle} customControls={this._customButtons()}/>
            </div>
        );
    },


});


module.exports = CensusMap;
