var React = require('react');

var MapLegend = React.createClass({
 
	getDefaultProps:function(){
		return {
			config:{
				x:10,
				y:10,
			},
			size:{
				width:100,
				height:200
			},
			options:{
				location:'bottomRight'
			}
		}
	},

	mapControlClick:function(layer){

		if(this.props.layerToggle){
			this.props.layerToggle(layer);
		}
	},

	renderMapControls:function(){
		return (
			<div className="btn-group" data-toggle="buttons">
	            
	            <label className="btn btn-sm btn-info active" onClick={this.mapControlClick.bind(null,'route')}>
	                <input type="checkbox" /> Routes
	            </label>
	            
	            <label className="btn btn-sm btn-info active" onClick={this.mapControlClick.bind(null,'stop')}>
	                <input type="checkbox" /> Stops
	            </label>
	            
	        </div>
	    )
	},

	renderLayer:function(layer){
		//console.log('renderLayer',layer);

		var legendItems = layer.scale.quantiles().map(function(d,i){
			if(i === 0){
				return (
					
						<td style ={{backgroundColor:layer.scale(d),textAlign:'center'}}>
							{ '< ' + parseInt(d) }
						</td>
						
				) 
			}

			if(i === layer.scale.quantiles().length-1){
				return (
					
						<td style={{borderTop:'none',backgroundColor:layer.scale(d),textAlign:'center'}} > 
						 { '> ' + parseInt(d) }
						</td>
					
				) 
			}

			return (
				
				<td style={{borderTop:'none',backgroundColor:layer.scale(d),textAlign:'center'}} >
					{ parseInt(layer.scale.quantiles()[i-1]) } - {parseInt(d)}
				</td>
			)
		});

		return (
			
				
				<table className="table">
					<tbody>
						<tr>
						{legendItems}
						</tr>
					</tbody>
				</table>
		
		)
	},
	renderHeader:function(){
		var scope = this,
			buttonLayer = Object.keys(scope.props.layers).map(function(key){
			
			if(scope.props.layers[key].type === 'buttonGroup'){
				return scope.renderButtonGroup(scope.props.layers[key])
			}

		}).filter(function(d){ return d });

		return (
			<div className='row' style={{padding:10}}>
				<div className='col-xs-4'>
					<span style={{fontSize:'16px'}}>{this.props.options.title ? this.props.options.title.replace(/_/g," ") : ''}</span>
				</div>
				<div className='col-xs-4'>
					{this.renderMapControls()}
				</div>
				<div className='col-xs-4'>
					{this.props.customControls ? this.props.customControls : ''}
					{buttonLayer.length > 0 ? buttonLayer : ''}
				</div>
		</div>
		)
	},

	renderCircleLayer:function(layer){
		var legendItems = layer.scale.quantiles().map(function(d,i){
			

			return (
				<tr key={i}>
					<td style={{borderTop:'none',padding:'0px'}} >
						<svg style={{width:'30px',height:'30px'}}>
							<circle cx='15' cy='15' r={parseInt(layer.scale(d))} style={{strokeWidth: '2px', fill: 'none',stroke: '#000'}}></circle>
						</svg>
					</td>
					<td style={{borderTop:'none',padding:'0px'}} >{parseInt(d)} </td>
				</tr>
			)	
		});

		return (
			<div>
				
				<table className="table">
					<tbody>
						{legendItems}
					</tbody>
				</table>
			</div>
		)
	},
	
	renderButtonGroup:function(layer){
		var buttons = layer.buttons.map(function(d,i){
			var btnClass = 'btn btn-primary btn-xs';
			if(d.value === layer.active){
				btnClass+= ' active';
			}
			return (
			  	<button key={i} type='button' className={btnClass} onClick={d.click.bind(null,d.value)}>
	                {d.text}
	           	</button>
	        )
        });

		return (
			<div style={{width:'100%'}}>
				<div className="btn-group" style={{margin:'0 auto'}}>
					{buttons}
				</div>
			</div>
		)
                                      
	},
	
	render: function() {
		var scope = this,
		displayStyle  = {
			display:this.props.config.display,
			backgroundColor:'white',
			padding:2,
			borderTop:'1px solid black',
			minWidth:'200px',
			color:'#000',
			borderRadius:'0px',
			fontFamily: "'Open Sans', sans-serif",
			fontWeight: 300
			
		}
		var layers = Object.keys(scope.props.layers).map(function(key){

			if(scope.props.layers[key].type === 'circle'){
				return scope.renderCircleLayer(scope.props.layers[key])
			}
			else if(scope.props.layers[key].type === 'buttonGroup'){
				//return null
			}else{
				return scope.renderLayer(scope.props.layers[key])
			}
			


		}).filter(function(d){ return d });

	

		return (
			<div className="mapControls col-xs-12" style={displayStyle}>
				{this.renderHeader()}	
				{layers}
			</div>
		);
	}
});

module.exports = MapLegend;