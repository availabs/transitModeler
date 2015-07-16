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
            height:400
        }
    },

    processData:function() {
		
        var scope = this;  
        
        if(scope.props.farebox.initialized){
            console.log('FareboxGraph',scope.props.farebox)
            
        }
        return [{key:'none',values:[]}]
		
	},

    _renderGraph:function(){
        var scope = this;
        if(scope.props.surveyData.initialized){
        
            nv.addGraph(function(){
                var chart = nv.models.discreteBarChart()
                    .x(function(d) { return d.key })    //Specify the data accessors.
                    .y(function(d) { return d.value })
                    .staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
                    .tooltips(true)        //Don't show tooltips
                    //.showValues(false)       //...instead, show the bar value right on top of each bar.
                    .transitionDuration(350)
                    
                    chart.discretebar.dispatch.on("elementClick", function(e) {
                        console.log(e);
                        var filter = {};
                        filter[scope.props.groupName] = e.point.key
                        console.log(filter,e);
                        scope.props.filterFunction(filter);
                    });
                    //.showControls(false)


                //console.log('_renderGraph,data',scope.processData(),'#SurveyGraph_'+scope.props.groupName+' svg')
                d3.select('#SurveyGraph_'+scope.props.groupName+' svg')
                    .datum(scope.processData())
                    .call(chart);

                //console.log('render graph',scope.processData())
                // if(scope.processData()[0].values.length > 10) {
                //  d3.selectAll('.nv-x text').attr('transform','translate(15,20)rotate(45)');
                // }
            
                nv.utils.windowResize(chart.update);
            })
        
        }
    },

    render:function(){

    	var scope = this;
        
        var svgStyle = {
              height: this.props.height+'px',
              width: '100%'
        };
        
        //this._renderGraph();

    	return(
            <div className='row' style={{color:'#000'}}>
        		<div className='col-md-12' id={'SurveyGraph_'+scope.props.groupName}>
        			<svg style={svgStyle}/>
        		</div>
            </div>
    	)
    }
});

module.exports = SurveyGraph;