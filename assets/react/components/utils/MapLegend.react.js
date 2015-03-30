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
			}
		}
	},

	renderLayer:function(layer){
		var legendItems = layer.scale.quantiles().map(function(d,i){
			if(i === 0){
				return (
					<tr>
						<td>
							<div  style={{margin:'0 auto',width:'20px',height:'20px',backgroundColor:layer.scale(d)}}></div>
						</td>
						<td> { '< ' + parseInt(d) }</td>
					</tr>
				) 
			}

			if(i === layer.scale.quantiles().length-1){
				return (
					<tr>
						<td style={{borderTop:'none'}} > 
							<div  style={{margin:'0 auto',width:'20px',height:'20px',backgroundColor:layer.scale(d)}}></div>
						</td>
						<td style={{borderTop:'none'}} > { '> ' + parseInt(d) }</td>
					</tr>
				) 
			}

			return (
				<tr>
					<td style={{borderTop:'none'}} >
						<div  style={{margin:'0 auto',width:'20px',height:'20px',backgroundColor:layer.scale(d)}}></div>
					</td>
					<td style={{borderTop:'none'}} >{parseInt(layer.scale.quantiles()[i-1])} - {parseInt(d)}</td>
				</tr>
			)	
		});

		return (
			<div>
				
				<table className="table">
					<thead>
						<tr >
							<td colSpan='2' ><h4>{layer.title ? layer.title.replace(/_/g," ") : ''}</h4></td>
						</tr>
					</thead>
					<tbody>
						{legendItems}
					</tbody>
				</table>
			</div>
		)
	},

	render: function() {
		var scope = this,
		displayStyle  = {
			position:'absolute',
			right:this.props.config.x,
			bottom:this.props.config.y,
			display:this.props.config.display,
			backgroundColor:'white',
			padding:'5',
			borderTop:'5px solid black',
			minWidth:'200px',
			width:this.props.size.width,
			color:'#000',
			zIndex:100
		
		}
		
		var layers = Object.keys(scope.props.layers).map(function(key){

				return scope.renderLayer(scope.props.layers[key])
			
			});


		return (
			<div className="mapLegend" style={displayStyle}>
				{layers}
			</div>
		);
	}
});

module.exports = MapLegend;