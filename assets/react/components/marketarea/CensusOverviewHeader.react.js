'use strict';

var React = require('react'),
	
   
    // -- Stores
    MarketAreaStore = require('../../stores/MarketAreaStore.js'),
    CensusStore = require('../../stores/CensusStore.js');


function getStatefromStore() {
    
    var ma  = MarketAreaStore.getCurrentMarketArea() ? MarketAreaStore.getCurrentMarketArea() : {name:'',zones:[],routes:[]};
    return {
        marketarea: ma,
        censusData: CensusStore.getCurrentDataSet()
    } 

}

var censusOverviewHeader = React.createClass({
	

	getInitialState: function(){
        return getStatefromStore()
    },

    componentDidMount: function() {
        MarketAreaStore.addChangeListener(this._onChange);
        CensusStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        MarketAreaStore.removeChangeListener(this._onChange);
        CensusStore.removeChangeListener(this._onChange);
    },
    _onChange:function(){
        this.setState(getStatefromStore())
    },
    render:function(){
    	var census = this.state.censusData.getTotalData();
    	return (
    		<div className="row">
				<div className="col-md-2 col-sm-4 col-xs-6">
			        <div className="box">
			            <h3>
			                {this.state.marketarea.zones.length}
			            </h3>
			            <div className="description">
			                Census Tracts
			            </div>
			        </div>
			    </div>
			    <div className="col-md-2 col-sm-4 col-xs-6">
			        <div className="box">
			            <h3>
			            {parseInt(census.total_population.value).toLocaleString()}
			               
			            </h3>
			            <div className="description">
			                Population
			            </div>
			        </div>
			    </div>
			    <div className="col-md-2 col-sm-4 col-xs-6">
			        <div className="box">
			            <h3>
			               {parseInt(census.occupied_housing.value).toLocaleString()}
			            </h3>
			            <div className="description">
			                Households
			            </div>
			        </div>
			    </div>
			    <div className="col-md-2 col-sm-4 col-xs-6">
			        <div className="box">
			            <h3>
			                {parseInt(census.employment.value+census.unemployment.value).toLocaleString()}
			            </h3>
			            <div className="description">
			                in Labor Force<br />
			                <small>{parseInt( (census.unemployment.value/(census.employment.value+census.unemployment.value))*100 ) }% Unemployment</small>
			            </div>
			        </div>
			    </div>
			    <div className="col-md-2 col-sm-4 col-xs-6">
			        <div className="box">
			            <h3>
			               {this.state.marketarea.routes.length.toLocaleString()}
			            </h3>
			            <div className="description">
			                # Bus Routes<small> defined in marketarea</small>
			            </div>
			        </div>
			    </div>

			    <div className="col-md-2 col-sm-4 col-xs-6">
			        <div className="box">
			            <h3>
			                {parseInt(census.bus_to_work.value).toLocaleString()}
			            </h3>
			            <div>
			            	{parseInt(census.bus_to_work.value/census.travel_to_work_total.value*100)}%<br />
			                Bus To Work
			            </div>
			        </div>
			    </div>
    
			</div>
    	)
    }
});

module.exports = censusOverviewHeader;