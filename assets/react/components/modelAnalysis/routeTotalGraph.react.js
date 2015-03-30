'use strict';

var React = require('react'),
   
    // -- Stores
    d3 = require('d3'),
    
    // -- Utils
    nv = require('../../utils/dependencies/nvd3.js');



var RouteTotalGraph = React.createClass({
	
    
    processData:function() {
		var scope = this;  
        if(scope.props.routeData.initialized){
            return scope.props.routeData.loadedModels.map(function(runId){
                scope.props.routeData.dimensions['run_id'].filter(runId);
                return {
                    key:runId,
                    values: scope.props.routeData.groups['route'].top(Infinity).map(function(route){
                        return {
                            key:route.key,
                            value:route.value
                        }
                    })
                }
            })
        }
        return {values:[]}
		
	 },
    
    render:function(){
    	var scope = this;
    	nv.addGraph(function(){
  		  	var chart = nv.models.multiBarChart()
  		      	.transitionDuration(350)
                  .reduceXTicks(true)   //If 'false', every single x-axis tick label will be rendered.
                  .rotateLabels(0)      //Angle to rotate x-axis labels.
                  .showControls(true)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
                  .groupSpacing(0.1)    //Distance between each group of bars.
                ;
  		  
  		  	d3.select('#routeTotalGraph svg')
  		      	.datum(scope.processData())
  		      	.call(chart);

            console.log('render graph',scope.processData())
  		    // if(scope.processData()[0].values.length > 10) {
  		    // 	d3.selectAll('.nv-x text').attr('transform','translate(15,20)rotate(45)');
  		    // }
  	  	
  		  	nv.utils.windowResize(chart.update);
  		})
    	
    	return(
    		<div id="routeTotalGraph">
    			<svg />
    		</div>	
    	)
    }
});

module.exports = RouteTotalGraph;