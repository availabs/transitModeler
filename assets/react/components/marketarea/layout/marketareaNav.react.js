'use strict';

var React = require('react'),
	Link = require('react-router').Link


var MarketareNav = React.createClass({
	
    render:function(){
    	
    	return(
    		<div className="row">
	            <div className="col-lg-12">
	             	<section className="widget" style={{overflow:'auto', paddingBottom:7,paddingRight:0}}>
		    			<ul className="nav navbar-nav col-lg-12" style={{background:'#fff'}}>
		                    <li className='overview-nav' style={{display:'inline-block'}}>
		                        <Link to="MarketAreaIndex" params={{marketareaID:this.props.marketarea.id}}>Census ACS</Link>
		                    </li>
		                    <li className='overview-nav' style={{display:'inline-block'}}>
		                       <Link to="MarketAreaCtpp" params={{marketareaID:this.props.marketarea.id}}>Census CTPP</Link>
		                    </li>
		                    <li className='overview-nav'>
                                <Link to="MarketAreaSurvey" params={{marketareaID:this.props.marketarea.id}}>Survey</Link>
                            </li>
                            <li className='overview-nav'>
                               <Link to="MarketAreaFarebox" params={{marketareaID:this.props.marketarea.id}}>Farebox</Link>
                            </li>
                            <li className='overview-nav'>
                               <Link to="MarketAreaGtfs" params={{marketareaID:this.props.marketarea.id}}>Gtfs</Link>
                            </li>
                             <li className='model-nav'>
                               <Link to="ModelCreate" params={{marketareaID:this.props.marketarea.id}}>Create Model</Link>
                            </li>
                             <li className='model-nav'>
                               <Link to="ModelAnalysis" params={{marketareaID:this.props.marketarea.id}}>Model Analysis</Link>
                            </li>

                            <li className='edit-nav pull-right'>
                               <Link to="MarketAreaEdit" params={{marketareaID:this.props.marketarea.id}}>Edit Marketarea</Link>
                            </li>
		            	</ul>
	            	</section>
	            </div>
	        </div>
    	)
    }
});

module.exports = MarketareNav;


