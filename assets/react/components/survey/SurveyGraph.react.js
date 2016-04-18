/*globals console,module,require*/
'use strict';

var React = require('react'),

    // -- Stores
    d3 = require('d3'),

    // -- Utils
    nv = require('../../utils/dependencies/nvd3.js'),
    DataTable = require('../utils/DataTable.react');



var SurveyGraph = React.createClass({

    getDefaultProps:function(){
      return {
          height:400,
          displayFilter:function(){return true;},
      };
    },



    processData:function() {

        var scope = this;

        if(scope.props.surveyData.initialized){

            var data = {key: scope.props.groupName};

            for(var key in scope.props.filters){
                scope.props.surveyData.dimensions[key].filterAll();
                scope.props.surveyData.dimensions[key].filter(scope.props.filters[key]);
            }

            data.values = scope.props.surveyData.groups[scope.props.groupName].top(Infinity)
            .filter(this.props.displayFilter)
            .map(function(d){
                return {
                    key:d.key,
                    value:d.value,
                };
            });
            //console.log('busroute group',data)
            if(this.props.keyMap){
                data.values = data.values.map(function(d){
                    d.key = d.key //scope.props.keyMap[];
                    return d;
                });
            }
            if(data.values.length ===0){
              return [{key:'none',values:[[]]}];
            }
            return [data];
        }
        return [{key:'none',values:[]}];

	},

    _renderGraph:function(){
        var scope = this;
        var data = scope.processData();
        if(scope.props.surveyData.initialized){

            nv.addGraph(function(){
                var chart = nv.models.discreteBarChart()
                    .x(function(d) { return d.key; })    //Specify the data accessors.
                    .y(function(d) { return d.value; })
                    .staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
                    .tooltips(true)        //Don't show tooltips
                    //.showValues(false)       //...instead, show the bar value right on top of each bar.
                    .transitionDuration(350);

                    chart.discretebar.dispatch.on("elementClick", function(e) {
                        //console.log(e);
                        var filter = {};
                        filter[scope.props.groupName] = e.point.key;
                        //console.log(filter,e);
                        scope.props.filterFunction(filter);
                    });
                    //.showControls(false)
                    chart.xAxis     //Chart x-axis settings
                    .tickFormat(function(d){
                        if(scope.props.keyMap){
                            return scope.props.keyMap[d];
                        }
                        return d;
                    })

                    if(scope.props.colors && (typeof scope.props.colors !== 'string')){
                      //console.log(scope.props.colors);
                      chart.color(function(d){
                        return scope.props.colors[d.key];
                      });
                    }
                    else if(scope.props.colors){
                      chart.color(function(d){
                        return scope.props.colors;
                      });
                    }else{
                      chart.color(function(d){
                        return '#000';
                      });
                    }

                //
                //console.log('_renderGraph,data',scope.processData(),'#SurveyGraph_'+scope.props.groupName+' svg')
                d3.select('#SurveyGraph_'+scope.props.groupName+' svg')
                    .datum(data)
                    .call(chart);
//d3.selectAll('#adtchart svg .nv-x .tick text').text('')
                console.log('render graph',scope.processData())
                //if(scope.processData()[0].values.length > 10) {
                 d3.selectAll('#SurveyGraph_'+scope.props.groupName+' svg .nv-x text').remove();
                //}

                nv.utils.windowResize(chart.update);
            });

        }

    },

    render:function(){

    	var scope = this;

        var svgStyle = {
              height: this.props.height+'px',
              width: '100%'
        };

        this._renderGraph();

    	return(
            <div className='row' style={{color:'#000'}}>
        		<div className='col-md-12' id={'SurveyGraph_'+scope.props.groupName}>
        			<svg style={svgStyle}/>
        		</div>
            </div>
    	);
    }
});

module.exports = SurveyGraph;
