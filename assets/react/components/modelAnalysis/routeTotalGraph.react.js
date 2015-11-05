/*globals require,console,module,d3,$*/
'use strict';

var React = require('react'),
    _ = require('lodash'),
    // -- Stores
    FareboxStore = require('../../stores/FareboxStore'),
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
        var keyset = [];
        var tableData = startData.map(function(d){
            //console.log('tableData Map',d)
            cols.push({'key':d.key,'name':'Run '+d.key,summed:true});

             var rows = d.values.map(function(count){
               keyset.push(count.key);
                var row  = {'route':count.key};
                row[d.key]=count.value;
                var colors;
                if(scope.props.colors)
                  colors = scope.props.colors;
                else {
                  colors = {};
                }
                row.colorkey = (<div style={{height:'15px',width:'15px',backgroundColor:colors[count.key]}}></div>);
                return row;
            });
          return rows;

        });
        keyset = _.uniq(keyset);
        // console.log('keyset',keyset);
        //console.log('render data tabke',tableData,cols)
        //take the first data set
        var data = tableData[0];
        //if there are more rows than the titles
        if(tableData.length > 1){
            //for each dataset or column
            var newData = [];
            keyset.forEach(function(route){
              var newRecord = {};
              tableData.forEach(function(set,i){ //for each data set
                var newItem = set.filter(function(d){return d.route === route;})[0];
                //find the current route if it resides in that set
                newRecord[cols[0].key] = (newItem)?newItem[cols[0].key] : newRecord[cols[0].key]; //get its route
                newRecord[cols[1].key] = (newItem)?newItem[cols[1].key] : newRecord[cols[1].key]; //get its color
                newRecord[cols[i+2].key] = (newItem)?newItem[cols[i+2].key] : 0;  //get its count
              });
              newData.push(newRecord);//add the row to the final table
            });
            data = newData;
            // console.log("TotalRouteGraph",data);
        }
        //return the vdom table
        return (
            <DataTable data={data} columns={cols} />
        );
    },
    processFarebox : function(){
      var scope=this;
      var fareFilter ={}; //define a filter for the query
      if(scope.props.timeFilter){ //if we will filter by time
        fareFilter.hours = function(d){ //define time filter function
          var h = parseInt(d.split(';')[0]);
          return scope.props.timeFilter[0] <= h && h <= scope.props.timeFilter[1];
        };
      }
      if(scope.props.zoneFilter){
        var fareZones = this.props.zoneFilter;
        console.log('routetgraphfil',fareZones)
        fareFilter.zone = function(d){//define  zone filter
          var zones = d.split(';'); //get the route, boarding , and alightings
          var route = zones[0];     //get the route
          var boarding = zones[1], alighting = zones[2]; //get the b and as

          var validZone = fareZones.indexOf(boarding) >= 0;
                          //and alighting is in the list of farezones
              validZone = validZone && fareZones.indexOf(alighting) >= 0;
                          //or there are no excluded zones in which
                          //allow all
          return validZone;
        };
      }
      var numdays = scope.props.fareboxData.groups.run_date.size();
      return {
        key:'Fbox',
        color:'#000',
        values: FareboxStore.queryFarebox('route',fareFilter).map(function(d){ //then query
          return {
            key:d.key,
            value:Math.round(d.value/numdays),
          };
        }),
      };
    },
    processRoutes : function(){
      var scope=this;
      //map the current of list of runIds
      var data =  scope.props.routeData.loadedModels.map(function(runId,i){
          //where each element maps to an element
          //filter the crossfilter object's run data by the current runId
          scope.props.routeData.clearFilter();
          scope.props.routeData.dimensions.run_id.filter(runId);
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
              values: scope.props.routeData.groups.route.top(Infinity).map(function(d){
                return {key:d.key,value:d.value};
              }),//The above seems redundant but this prevents overwrite from
                //crossfilter filters, removes object reverences from the data
          };
      });
      return data;
    },
    processData:function() {

        var scope = this,data;
        //if the route data is initialized
        if(scope.props.routeData.initialized){
            //return a list by doing the following
            data= scope.processRoutes();

            if(scope.props.fareboxInit){//if we can use the farebox data
              var fbox = scope.processFarebox();
              data.push(fbox);
            }
            // console.log('Model Graph Data',data);
            return data;
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
