/*globals require,module,console*/
'use strict';

var React = require('react'),
    d3 = require('d3'),
    colorbrewer  = require('colorbrewer'),
    deepEqual = require('deep-equal'),
    censusUtils = require('../../utils/ModelCreateCensusParse'),
    _ = require('lodash'),
    // -- Actions
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),
    // --Components
    LeafletMap = require('../utils/LeafletMap.react'),

    //  --Component Globals
    currentType = null,
    currentForecast = null,
    forecastData = {},
    tractlayerID = 0,
    prevTractLength,
    prevTracts = {},
    routeLayerID = 0,
    prevRouteLength,
    tractCounts={},
    odScale = d3.scale.quantile().range(colorbrewer.PuBu[6]);



var ModelMap = React.createClass({

    getDefaultProps: function() {
        return {
            mode:'Origin'
        };
    },

    _reduceTripTable:function(){

        return censusUtils.reduceTripTable(this.props.currentTripTable.tt);
    },

    processLayers:function(){
        var scope = this;
        tractCounts = this._reduceTripTable();

        if( this.props.tracts.features.length !== prevTractLength ){
            tractlayerID++;
            prevTractLength = this.props.tracts.features.length;
        }
        if(this.props.routes.features.length !== prevRouteLength){
            routeLayerID++;
            prevRouteLength = this.props.tracts.features.length;
        }


        var flatTrips = Object.keys(tractCounts).map(function(key){
            return scope.props.mode === 'Origin' ? tractCounts[key].o : tractCounts[key].d
        }).sort(function(a, b) { return a - b; });
        odScale.range(colorbrewer.PuBu[5])

        if(scope.props.mode === 'pop' ||  scope.props.mode === 'emp' ){
            //flatTrips
            flatTrips = this.props.tracts.features.map(function(d){
                forecastData[d.properties.geoid] = d.properties;
                if(scope.props.currentSettings.forecast ==='future' &&
                    scope.props.currentSettings.forecastType === 'custom')
                    return scope.props.mode === 'pop' ? d.properties.pop_growth_custom || forecastData[d.properties.geoid].pop2020_growth : d.properties.emp_growth_custom || forecastData[d.properties.geoid].emp2020_growth;
                return scope.props.mode === 'pop' ? d.properties.pop2020_growth : d.properties.emp2020_growth;
            });


            odScale.range(colorbrewer.OrRd[5])
        }


        if( !deepEqual(odScale.domain(),flatTrips) ){


            odScale.domain(flatTrips);
            d3.selectAll('.tract')
                .attr('fill',function(feature){
                    var geoid = d3.select(this).attr('class').split('_')[1];
                    var scaleValue = 0;

                    if(tractCounts[geoid]){
                        scaleValue = scope.props.mode === 'Origin' ? tractCounts[geoid].o : tractCounts[geoid].d;

                    }
                    //console.log('fdata',forecastData)
                    if((scope.props.mode === 'pop'  || scope.props.mode === 'emp') &&  forecastData[geoid]){
                        //console.log('pop',geoid,forecastData[geoid].pop2020_growth)
                        if(scope.props.currentSettings.forecast ==='future' &&
                            scope.props.currentSettings.forecastType === 'custom' && geoid === '34001010700')
                            scaleValue =  (scope.props.mode === 'pop') ? forecastData[geoid].pop_growth_custom || forecastData[geoid].pop2020_growth : forecastData[geoid].emp_growth_custom || forecastData[geoid].emp2020_growth;
                        else{
                            scaleValue = (scope.props.mode === 'pop') ? forecastData[geoid].pop2020_growth : forecastData[geoid].emp2020_growth;
                          }
                    }

                    return odScale(scaleValue);
                });

        }
        var tractProperties = function(feature){
            feature.properties.origin = tractCounts[feature.properties.geoid] ? tractCounts[feature.properties.geoid].o : '0';
            feature.properties.dest = tractCounts[feature.properties.geoid] ? tractCounts[feature.properties.geoid].d : '0';
            feature.properties.busData = censusUtils.bus2work(scope.props.censusData,feature.properties.geoid);
          if( currentType ==='regression' && scope.props.currentSettings.regressionId){
            feature.properties.regression = {};
            scope.props.currentSettings.regressionId.censusVariables.forEach(function(cenvar){
                var data = scope.props.censusData.getTractData()[feature.properties.geoid] ? parseInt(scope.props.censusData.getTractData()[feature.properties.geoid][cenvar.name]) : 0;
                feature.properties.regression[cenvar.name] = data;
            });
          }
        };
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
                            weight:2,
                            fillOpacity:0.8
                        };
                    },
                    onEachFeature: function (feature, layer) {
                        layer.on({
                            click: function(e){
                              tractProperties(feature);
                              console.log(feature.properties);
                              ModelingActionsCreator.addModelSettings(feature);
                            },
                            mouseover: function(e){
                                //console.log(feature.properties,tractCounts)
                                this.setStyle({weight:2,stroke:true,fillColor:this._path.attributes[3].nodeValue});
                                var table=scope.renderToolTip(feature,tractCounts);
                                var tt = d3.select('.ToolTip').style({
                                    left:e.originalEvent.clientX+'px',
                                    top:e.originalEvent.clientY+'px',
                                    display:'block',
                                    opacity:1.0
                                });
                                tt.select('h4')
                                    .attr('class','TT_Title')
                                    .html('Tract '+feature.properties.geoid);
                                tt.select('span')
                                    .attr('class','TT_Content')
                                    .html(table);

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
    renderToolTip:function(feature,tractCounts){
        //,this.props.mode === 'Origin' ?  : tractCounts[feature.properties.geoid].d )
        //console.log('rtt',tractCounts,tractCounts[feature.properties.geoid],feature.properties.geoid)
        var scope = this,
            origin = tractCounts[feature.properties.geoid] ? tractCounts[feature.properties.geoid].o : '0',
            dest = tractCounts[feature.properties.geoid] ? tractCounts[feature.properties.geoid].d : '0',
            busData = censusUtils.bus2work(scope.props.censusData,
                                            feature.properties.geoid),
            table = ''+
            '<table class="table">'+
            '<tr><td>Origin Trips</td><td>'+origin+'</td></tr>'+
            '<tr><td>Destination Trips</td><td>'+dest +'</td></tr>'+
            '<tr><td>Bus To Work</td><td>'+busData +'</td></tr>';
            if(currentType === 'regression'){
                table += '<tr><td colspan=2 style="textAlign:center;"><strong> Regression Variables</strong></td></tr>';
                var censusRows = this.props.currentSettings.regressionId.censusVariables.map(function(cenvar){
                    var data = scope.props.censusData.getTractData()[feature.properties.geoid] ? parseInt(scope.props.censusData.getTractData()[feature.properties.geoid][cenvar.name]) : 0;
                    return '<tr><td>'+cenvar.name+'</td><td>'+data+'</td></tr>';
                });
                table+=censusRows.join(' ')
            }
            if(scope.props.currentSettings.forecast === 'future'){
                table   += '<tr><td colspan=2 style="textAlign:center;"><strong> 2020 Forceast</strong></td></tr>'
                        + '<tr><td>Population Growth</td><td>'+feature.properties.pop2020_growth +'%</td></tr>'
                        + '<tr><td>Employment Growth</td><td>'+feature.properties.emp2020_growth +'%</td></tr>';
            }

            table +='</table>';
            return table;
    },
    _updateTooltip:function(tt){
        var scope = this;
        if (scope.isMounted()) {
            scope.setState({
                tooltip:tt
            });
        }
    },
    componentWillReceiveProps:function(nextProps){

        if(currentType !== nextProps.currentSettings.type){
            //console.log('new type',nextProps.currentSettings.type)
            currentType = nextProps.currentSettings.type
        }


    },

    render: function() {

        //console.log('censusData',this.props.censusData.getTractData())

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
        if(this.props.currentSettings.forecast === 'future'){
            legendLayers.od.buttons.push({text:'Pop Change',value:'pop',click:ModelingActionsCreator.setMode});
            legendLayers.od.buttons.push({text:'Emp Change',value:'emp',click:ModelingActionsCreator.setMode});
        }

        return (

            <div>
                <LeafletMap layers={this.processLayers()} legendLayers={legendLayers} legendOptions={{location:'bottomRight'}} height="800px" />
            </div>

        );
    },


});

module.exports = ModelMap;
