/*globals require,console,module*/
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
        };
    },

    _renderGraph:function(){
        var scope = this;

        nv.addGraph(function(){
            var chart = nv.models.multiBarChart()
                .x(function(d) { return d.key; })    //Specify the data accessors.
                .y(function(d) { return d.value; })
                .staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
                .tooltips(true)        //Don't show tooltips
                .transitionDuration(350)
                .rotateLabels(90)
                .showControls(false);

                // if(scope.props.colors && (typeof scope.props.colors !== 'string')){
                //   chart.color(function(d){
                //     return scope.props.colors[d.key];
                //   });
                // }
                // else if(scope.props.colors){
                //   chart.color(function(d){
                //     return scope.props.colors;
                //   });
                // }else{
                //   chart.color(function(d){
                //     return '#000';
                //   });
                // }

            d3.select('#AnalysisGraph_'+scope.props.groupName+' svg')
                .datum(scope.props.data)
                .call(chart);


            nv.utils.windowResize(chart.update);
        });


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
        		<div className='col-md-12' id={'AnalysisGraph_'+scope.props.groupName}>
        			<svg style={svgStyle}/>
        		</div>
            </div>
    	);
    }
});

module.exports = SurveyGraph;
