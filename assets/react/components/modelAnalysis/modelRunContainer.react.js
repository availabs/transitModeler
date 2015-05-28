'use strict';

var React = require('react'),
   
    // -- Stores
    d3 = require('d3'),
    
    // -- Utils
    nv = require('../../utils/dependencies/nvd3.js'),
    DataTable = require('../utils/DataTable.react'),
    MarketAreaMap = require('../utils/MarketAreaMap.react'),

    stopScale = d3.scale.quantile().range([2,4,6,8,10,12,14]);



var RouteTotalGraph = React.createClass({
	
    getDefaultProps:function(){
      return {
          height:400,
          mapId:'map'
      }
    },

    getInitialState:function(){
        return {
            mode:'stop_boarding'
        }
    },
    setMode:function(data){
        console.log('setMode',data)
        this.setState({mode:data});
    },
    
    render:function(){
        console.log('render container')
    	var scope = this;

        this.props.data.dimensions['run_id'].filter(this.props.modelId);
        var stopData = {}
        stopScale.domain(
            this.props.data.groups[scope.state.mode].top(Infinity).map(function(stop){
                stopData[stop.key]  = stop.value; 
                return stop.value
            }).filter(function(d){
                return d > 0
            }).sort(function(a,b){
                return  b-a;
            })
        )

        var legendLayers = {
            od:{
                type:'buttonGroup',
                buttons:[
                    {text:'Boarding',value:'stop_boarding',click:this.setMode},
                    {text:'Alighting',value:'stop_alighting',click:this.setMode}
                ],
                active:this.state.mode
            },
            triptable:{
                title:this.state.mode,
                type:'circle',
                scale:stopScale,
                data:stopData
            }
            
        }


        return(
            <div style={{color:'#000'}}>
        		  <h4>Model Run {this.props.modelId}</h4>
              <MarketAreaMap 
                mapId={this.props.mapId}
                tracts={this.props.tracts} 
                routes={this.props.routesGeo}
                stops={this.props.stopsGeo}
                displayTracts={false}
                mode={this.state.mode}
                stopsData = {{scale:stopScale,data:stopData}}
                legendLayers ={legendLayers} />
               
            </div>
    	)
    }

});

module.exports = RouteTotalGraph;