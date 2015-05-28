'use strict';

var React = require('react'),
   
    // -- Stores
    d3 = require('d3'),
    
    // -- Utils
    nv = require('../../utils/dependencies/nvd3.js'),
    DataTable = require('../utils/DataTable.react');



var RouteTotalGraph = React.createClass({
	
    getDefaultProps:function(){
      return {
          height:400
      }
    },

    renderDataTable:function(){
        var startData = this.processData();
        if(!startData || startData[0].key === 'none'){
            return ( <span /> )
        }

        var cols = [{name:'Route Number',key:'route'}];
        var values = [];
        var tableData = startData.map(function(d){
            //console.log('tableData Map',d)
            cols.push({'key':d.key,'name':'Run '+d.key,summed:true})
            return d.values.map(function(count){
                var row  = {'route':count.key}
                row[d.key]=count.value;
                return row;
            });
        
        });
        //console.log('render data tabke',tableData,cols)
        var data = tableData[0];
        if(tableData.length > 1){
           
            tableData.forEach(function(dataset,i){
                if(i > 0){
                     var newData = []
                     dataset.forEach(function(row){
                        
                        var newRow = data.filter(function(d){
                            return d.route === row.route;
                        })[0]
                        
                        if(newRow){
                            newRow[cols[+i+1].key] = row[cols[+i+1].key]
                            newData.push(newRow);
                        }
                    })
                    data = newData;
                }
            })
        }
        return (
            <DataTable data={data} columns={cols} />
        )
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

    _renderGraph:function(){
        var scope = this;
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
        
        this._renderGraph();

    	return(
            <div className='row' style={{color:'#000'}}>
        		<div className='col-md-8' id="routeTotalGraph">
        			<svg style={svgStyle}/>
        		</div>
                <div className='col-md-4'>
                 { this.renderDataTable() }
                </div>
            </div>
    	)
    }
});

module.exports = RouteTotalGraph;