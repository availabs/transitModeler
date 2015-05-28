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

	renderLayer:function(layer){
		var legendItems = layer.scale.quantiles().map(function(d,i){
			if(i === 0){
				return (
					<tr key={i}>
						<td>
							<div  style={{margin:'0 auto',width:'20px',height:'20px',backgroundColor:layer.scale(d)}}></div>
						</td>
						<td> { '< ' + parseInt(d) }</td>
					</tr>
				) 
			}

			if(i === layer.scale.quantiles().length-1){
				return (
					<tr key={i}>
						<td style={{borderTop:'none'}} > 
							<div  style={{margin:'0 auto',width:'20px',height:'20px',backgroundColor:layer.scale(d)}}></div>
						</td>
						<td style={{borderTop:'none'}} > { '> ' + parseInt(d) }</td>
					</tr>
				) 
			}

			return (
				<tr key={i}>
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
							<td colSpan='2'><h4>{layer.title ? layer.title.replace(/_/g," ") : ''}</h4></td>
						</tr>
					</thead>
					<tbody>
						{legendItems}
					</tbody>
				</table>
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
					<thead>
						<tr >
							<td colSpan='2'><h4>{layer.title ? layer.title.replace(/_/g," ") : ''}</h4></td>
						</tr>
					</thead>
					<tbody>
						{legendItems}
					</tbody>
				</table>
			</div>
		)
	},
	
	renderButtonGroup:function(layer){
		var buttons = layer.buttons.map(function(d,i){
			var btnClass = 'btn btn-primary';
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
			position:'absolute',
			display:this.props.config.display,
			backgroundColor:'white',
			padding:'5',
			borderTop:'5px solid black',
			minWidth:'200px',
			width:this.props.size.width,
			color:'#000',
			borderRadius:'5px',
			zIndex:100
		}

		if(this.props.options.location === 'bottomRight'){
			displayStyle.right=this.props.config.x;
			displayStyle.bottom=this.props.config.y;
		}else if(this.props.options.location === 'topLeft'){
			displayStyle.left=this.props.config.x;
			displayStyle.top=this.props.config.y;
		}else if(this.props.options.location === 'topRight'){
			displayStyle.right=this.props.config.x;
			displayStyle.top=this.props.config.y;
		}
		
		var layers = Object.keys(scope.props.layers).map(function(key){

			if(scope.props.layers[key].type === 'circle'){
				return scope.renderCircleLayer(scope.props.layers[key])
			}
			else if(scope.props.layers[key].type === 'buttonGroup'){
				return scope.renderButtonGroup(scope.props.layers[key])
			}
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