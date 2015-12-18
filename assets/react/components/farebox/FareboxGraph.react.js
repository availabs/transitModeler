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
            divID:'fboxGraph'
        }
    },

 //    processData:function() {

 //        var scope = this;

 //        if(this.props.farebox.initialized){
 //            console.log('FareboxGraph',scope.props.farebox)

 //            var data = scope.props.farebox.groups['line'].top(Infinity).map(function(line){

 //                if(scope.props.peak){
 //                    var lower = scope.props.peak === 'am' ? 6 : 14,
 //                        upper = scope.props.peak === 'am' ? 10 : 18;

 //                    scope.props.farebox.dimensions['run_time'].filter(function(d,i){

 //                        return d.getHours() > lower && d.getHours() < upper
 //                    });
 //                }else{
 //                   scope.props.farebox.dimensions['run_time'].filter(null)
 //                }
 //                scope.props.farebox.dimensions['line'].filter(line.key);

 //                var daySum = scope.props.farebox.groups['run_date'].top(Infinity).reduce(function(a,b){
 //                    return {value:(a.value + b.value)}

 //                })
 //                //console.log('daysum',scope.props.farebox.groups['run_date'].top(Infinity))
 //                return {key:line.key,value:(daySum.value/scope.props.farebox.groups['run_date'].top(Infinity).length)}

 //            })
 //            console.log(data)
 //            return [{key:'Time Peak',values:data}]
 //        }
 //        return [{key:'none',values:[]}]

	// },

    _renderGraph:function(){
        var scope = this;

        nv.addGraph(function(){
            var chart = nv.models.discreteBarChart()
                .x(function(d) { return d.key })    //Specify the data accessors.
                .y(function(d) { return d.value })
                .staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
                .tooltips(true)        //Don't show tooltips
                //.showValues(false)       //...instead, show the bar value right on top of each bar.
                .transitionDuration(350)

                chart.discretebar.dispatch.on("elementClick", function(e) {
                    scope.props.filterFunction(e.point.key);
                });
                // .showControls(false)

                if(scope.props.colors && (typeof scope.props.colors !== 'string')){
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
            //console.log('_renderGraph,data',scope.processData(),'#SurveyGraph_'+scope.props.groupName+' svg')
            d3.select('#FareboxGraph_'+scope.props.groupName+' svg')
                .datum(scope.props.data)
                .call(chart);

            //console.log('render graph',scope.processData())
            // if(scope.processData()[0].values.length > 10) {
            //  d3.selectAll('.nv-x text').attr('transform','translate(15,20)rotate(45)');
            // }

            nv.utils.windowResize(chart.update);
        })


    },

    render:function(){

    	var scope = this;

        var svgStyle = {
              height: this.props.height+'px',
              width: '100%'
        };
        //this.processData()
        this._renderGraph();

    	return(
            <div className='row' style={{color:'#000'}}>
        		<div className='col-md-12' id={'FareboxGraph_'+scope.props.groupName}>
        			<svg style={svgStyle}/>
        		</div>
            </div>
    	)
    }
});

module.exports = SurveyGraph;
