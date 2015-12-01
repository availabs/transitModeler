'use strict';

var React = require('react'),
	Link = require('react-router').Link


var MarketareHeader = React.createClass({
	
    render:function(){
    	
    	return(
    		<h2 className="page-title">{this.props.marketarea.name} <small>marketarea overview</small>
                <div className="btn-group pull-right">
                    <Link to="MarketAreaIndex" params={{marketareaID:this.props.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                        Overview
                    </Link>
                    <Link to="MarketAreaEdit" params={{marketareaID:this.props.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                        Edit
                    </Link>
                </div>
            </h2>
    	)
    }
});

module.exports = MarketareHeader;


