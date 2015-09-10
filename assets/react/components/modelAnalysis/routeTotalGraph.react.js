/*globals require,console,module,d3,$*/
'use strict';

var React = require('react'),

    // -- Stores
    // d3 = require('d3'),

    // -- Utils
    nv = require('../../utils/dependencies/nvd3.js'),
    DataTable = require('../utils/DataTable.react');



var RouteTotalGraph = React.createClass({

    getDefaultProps:function(){
      return {
          height:400
      };
    },

    renderDataTable:function(odata){
        var scope = this;
        //process the data for easy display format
        var startData = odata || this.processData();

        //if nothing is worth plotting, display nothing
        if(!startData || startData[0].key === 'none'){
            return ( <span /> );
        }
        var cols = [{name:'Route Number',key:'route'}];
        if(scope.props.colors){
          cols.push({'key':'colorkey',name:'Color Key'});
        }
        var values = [];
        console.log('starting data',startData);
        var tableData = startData.map(function(d){
            //console.log('tableData Map',d)
            cols.push({'key':d.key,'name':'Run '+d.key,summed:true});

            return d.values.map(function(count){

                var row  = {'route':count.key};
                row[d.key]=count.value;
                row.colorkey = (<div style={{height:'15px',width:'15px',backgroundColor:scope.props.colors[count.key]}}></div>);
                return row;
            });

        });
        console.log('table Data',tableData);
        //console.log('render data tabke',tableData,cols)
        //take the zeroth entry of the array
        var data = tableData[0];
        //if there are more rows than the titles
        if(tableData.length > 1){
          //for each row of the data
            tableData.forEach(function(dataset,i){
                //if we are not looking at the headers
                if(i > 0){
                    //instantiate new list
                     var newData = [];
                     //for every element of the dataset
                     dataset.forEach(function(row){

                        var newRow = data.filter(function(d){
                            return d.route === row.route;
                        })[0];
                        console.log(row);
                        if(newRow){
                            newRow[cols[+i+2].key] = row[cols[+i+2].key];
                            newData.push(newRow);
                        }
                    });
                    console.log(newData);
                    data = newData;
                }
            });
        }
        //return the vdom table
        return (
            <DataTable data={data} columns={cols} />
        );
    },

    processData:function() {

        var scope = this;
        //if the route data is initialized
        if(scope.props.routeData.initialized){
            //return a list by doing the following
            //map the current of list of runIds
            return scope.props.routeData.loadedModels.map(function(runId,i){
                //where each element maps to an element
                //filter the crossfilter object's run data by the current runId
                scope.props.routeData.dimensions['run_id'].filter(runId);
                if(scope.props.timeFilter){
                  scope.props.routeData.dimensions.hours.filter(function(d){
                    var h = parseInt(d.split(';')[0]);
                    return scope.props.timeFilter[0] <= h && h <= scope.props.timeFilter[1];
                  });
                }
                //create a plottable object for the nvd3 multibar plot
                return {
                    key:runId,
                    color:d3.scale.category20().range()[i%20],
                    values: scope.props.routeData.groups['route'].top(Infinity).map(function(route){
                        return {
                            key:route.key,
                            value:route.value,
                        };
                    })
                };
            });
        }
        //if it's not initialized then just give a list without any data
        return [{key:'none',values:[]}];

	},

    _renderGraph:function(){
        var scope = this;
        if(scope.props.routeData.initialized){

            nv.addGraph(function(){
                var chart = nv.models.multiBarChart()
                  .x(function(d) { return d.key; })    //Specify the data accessors.
                  .y(function(d) { return d.value; })
                  .staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
                  .tooltips(true)        //Don't show tooltips
                  //.showValues(false)       //...instead, show the bar value right on top of each bar.
                  .transitionDuration(350)
                      .showControls(false);


              var temp=  d3.select('#routeTotalGraph svg')
                    .datum(scope.processData())
                    .call(chart)
                    .selectAll('g text')
                    .style('fill','#000');

                //console.log('render graph',scope.processData())
                // if(scope.processData()[0].values.length > 10) {
                //  d3.selectAll('.nv-x text').attr('transform','translate(15,20)rotate(45)');
                // }

                nv.utils.windowResize(chart.update);
            });

        }
    },

    render:function(){

    	var scope = this;
      if(!scope.props.routeData.initialized)
        return <span></span>;
        var svgStyle = {
              height: this.props.height+'px',
              width: '100%'
        };
        var data = this.processData();
        this._renderGraph(data);

    	return(
            <div className='row' style={{color:'#000'}}>
        		<div className='col-md-8' id="routeTotalGraph">
        			<svg style={svgStyle}/>
        		</div>
                <div className='col-md-4'>
                 { this.renderDataTable(data) }
                </div>
            </div>
    	);
    }
});

module.exports = RouteTotalGraph;
