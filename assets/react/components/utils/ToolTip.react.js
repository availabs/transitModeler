var React = require('react');

var ToolTip = React.createClass({
 
	getDefaultProps:function(){
		return {
			config:{
				x:0,
				y:0,
				display:'none',
				content:'test 4123123 default',
				title:'Tooltip Title default',
			},
			size:{
				width:200,
				height:200
			}
		}
	},



	render: function() {
		displayStyle  = {

			position:'fixed',
			left:this.props.config.x,
			top:this.props.config.y,
			display:this.props.config.display,
			backgroundColor:'white',
			padding:'5',
			borderTop:'5px solid black',
			minWidth:'200px',
			// width:this.props.size.width,
			// height:this.props.size.height,
			zIndex:100
		
		}
		headerStyle = {
			fontWeight:700,
			width:'100%',
			color:'#000'
		}

		return (
			<div className="ToolTip" style={displayStyle}>
		    	<h4 className="TT_Title" style={headerStyle}></h4>
		    	<span className="TT_Content"></span>
			</div>
		);
	}
});

module.exports = ToolTip;