'use strict';

var React = require('react'),
   
    // -- Stores
    d3 = require('d3'),
    
    // -- Utils
    nv = require('../../utils/dependencies/nvd3.js');



var RouteTotalGraph = React.createClass({
	
    getDefaultProps:function(){
      return {
          height:400
      }
    },
    processData:function() {
		var scope = this;  
        if(scope.props.routeData.initialized){
            return scope.props.routeData.loadedModels.map(function(runId,i){
                scope.props.routeData.dimensions['run_id'].filter(runId);
                return {
                    key:runId,
                    color:d3.scale.category20().range()[i],
                    values: scope.props.routeData.groups['route'].top(Infinity).map(function(route){
                        return {
                            key:route.key,
                            value:route.value,
                            
                        }
                    })
                }
            })
        }
        return [{key:'none',values:[]}]
		
	 },
    
    render:function(){

    	var scope = this;
    	var svgStyle = {
          height: this.props.height+'px',
          width: '100%'
      }
      if(scope.props.routeData.initialized){
        nv.addGraph(function(){
    		  	var chart = nv.models.multiBarChart()
                  .x(function(d) { return d.key })    //Specify the data accessors.
                  .y(function(d) { return d.value })
                  .staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
                  .tooltips(true)        //Don't show tooltips
                  //.showValues(false)       //...instead, show the bar value right on top of each bar.
                  .transitionDuration(350)
    		          .showControls(false)


    		  	d3.select('#routeTotalGraph svg')
    		      	.datum(scope.processData())
    		      	.call(chart);

              console.log('render graph',scope.processData())
    		    // if(scope.processData()[0].values.length > 10) {
    		    // 	d3.selectAll('.nv-x text').attr('transform','translate(15,20)rotate(45)');
    		    // }
    	  	
    		  	nv.utils.windowResize(chart.update);
    		})
      }
      	
    	return(
    		<div id="routeTotalGraph">
    			<svg style={svgStyle}/>
    		</div>	
    	)
    }
});

module.exports = RouteTotalGraph;