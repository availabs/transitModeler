/*globals console,module,require*/
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
      };
    },

    getInitialState:function(){
        return {
            mode:'stop_boarding'
        };
    },
    setMode:function(data){
        console.log('setMode',data);
        this.setState({mode:data});
    },
    mapKey : function(layer){
      var legendItems = layer.scale.quantiles().map(function(d,i){


  			return (
  				<div className='col-md-4'>
  					<div className='col-md-2'>
  						<svg style={{width:'30px',height:'30px'}}>
  							<circle cx='15' cy='15' r={parseInt(layer.scale(d))} style={{strokeWidth: '2px', fill: 'none',stroke: '#000'}}></circle>
  						</svg>
  					</div>
  					<div className='col-md-2'>{parseInt(d)}</div>
  				</div>
  			);
  		});
      var legendGroups = [];
      for(var i =0; i <= Math.floor(legendItems.length/3); i++ ){
        legendGroups.push(
          <div className='row'>
            {legendItems.splice(0,3)}
          </div>
        );

      }
  		return (
  			<div>

  				<table className="table">
  					<thead>
  						<tr >
  							<td colSpan='2'><h4>{layer.title ? layer.title.replace(/_/g," ") : ''}</h4></td>
  						</tr>
  					</thead>
  					<tbody>
  						{legendItems}
  					</tbody>
  				</table>
          <div className='row'>

          </div>
          {legendGroups}
  			</div>
  		);
    },
    render:function(){
    	var scope = this;

        this.props.data.dimensions.run_id.filter(this.props.modelId);
        var stopData = {};
        stopScale.domain(
            this.props.data.groups[scope.state.mode].top(Infinity).map(function(stop){
                stopData[stop.key]  = stop.value;
                return stop.value;
            }).filter(function(d){
                return d > 0;
            }).sort(function(a,b){
                return  b-a;
            })
        );

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
        };
        var btnStyle = 'btn btn-primary ';
        var alightingStyle = btnStyle + ((this.state.mode==='stop_alighting')?'active':'');
        var boardingStyle = btnStyle + ((this.state.mode==='stop_boarding')?'active':'');
        return(
            <div style={{color:'#000'}}>

              <MarketAreaMap
                mapId={this.props.mapId}
                tracts={this.props.tracts}
                routes={this.props.routesGeo}
                stops={this.props.stopsGeo}
                displayTracts={false}
                mode={this.state.mode}
                stopsData = {{scale:stopScale,data:stopData}}
                legendLayers ={{}}
                neverReZoom={true}/>
              <section className='widget'>
                <div className='row'>
                  <div className='col-md-6'>
                    <h4>Model Run {this.props.modelId}</h4>
                  </div>
                  <div className='col-md-6'>
                    <div className='btn-group'>
                      <button className={boardingStyle}
                        onClick={this.setMode.bind(null,'stop_boarding')}
                        >
                        Boarding
                    </button>
                      <button className={alightingStyle}
                        onClick={this.setMode.bind(null,'stop_alighting')}
                        >
                        Alighting
                      </button>
                    </div>
                  </div>
                </div>
                <div className='row'>
                  {this.mapKey(legendLayers.triptable)}
                </div>
              </section>
            </div>
    	);
    }

});

module.exports = RouteTotalGraph;
