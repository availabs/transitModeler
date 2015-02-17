'use strict';

var React = require('react'),
   
    // -- Stores
    MarketAreaStore = require('../../stores/MarketAreaStore.js'),
    CensusStore = require('../../stores/CensusStore.js'),
    d3 = require('d3'),
    // -- Utils
    nv = require('../../utils/dependencies/nvd3.js');


function getStatefromStore() {
    
    var ma  = MarketAreaStore.getCurrentMarketArea() ? MarketAreaStore.getCurrentMarketArea() : {name:'',zones:[],routes:[]};
    return {
        marketarea: ma,
        censusData: CensusStore.getCurrentDataSet()
    } 

}

var CensusGraph = React.createClass({
	
	getInitialState: function(){
        return getStatefromStore()
    },
    getDefaultProps:function(){
    	return{
    		activeCategory:0
    	}
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
    processCensusData:function() {
		var output = [];
		var category_name = Object.keys(this.state.censusData.getCategories())[this.props.activeCategory],
			category = this.state.censusData.getCategories()[category_name],
			total_data = this.state.censusData.getTotalData();
		category.forEach(function(cen_var){
			output.push({label:cen_var.replace(/_/g," "),value:parseInt(total_data[cen_var].value)});
		});
		return [{/*key:"ages",*/values:output}];
	},
    render:function(){
    	var scope = this;
    	nv.addGraph(function(){
  		  	var chart = nv.models.discreteBarChart()
  		      	.x(function(d) { return d.label })    //Specify the data accessors.
  		      	.y(function(d) { return d.value })
  		      	.staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
  		      	.tooltips(false)        //Don't show tooltips
  		      	.showValues(false)       //...instead, show the bar value right on top of each bar.
  		      	.transitionDuration(350)
  		  
  		  	d3.select('#graphDiv svg')
  		      	.datum(scope.processCensusData())
  		      	.call(chart);

  		    if(scope.processCensusData().length > 10) {
  		    	d3.selectAll('.nv-x text').attr('transform','translate(15,20)rotate(45)');
  		    }
  	  	
  		  	nv.utils.windowResize(chart.update);
  		})
    	
    	return(
    		<div id="graphDiv">
    			<svg />
    		</div>	
    	)
    }
});

module.exports = CensusGraph;