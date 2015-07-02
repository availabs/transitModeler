'use strict';

var React = require('react'),
    
    // -- Components
    MarketAreaMap = require('../utils/MarketAreaMap.react'),
    
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator')
    
    // -- Stores
    //TripTableStore = require('../../stores/TripTableStore'),

    // -- Comp Globals
    ;


var FareboxAnalysis = React.createClass({


   
    getInitialState: function(){
        return {
          
        }
    },

    willTransitionTo: function (transition, params) {
      //console.log('will transition to',transition,params);
    },

    componentDidMount: function() {
        
    },

    componentWillUnmount: function() {
        
    },
    

    componentWillReceiveProps:function(nextProps){
        
    },
    
    render: function() {
        console.log('this.props.stopsGeo',this.props.stopsGeo)
         var FareZones = [];
         this.props.stopsGeo.features.forEach(function(d){
            if(FareZones.indexOf(d.properties.fare_zone) === -1){
                FareZones.push(d.properties.fare_zone)
            }
         })
         console.log(FareZones);
        return (
    	<div>
            	
                
                <div className="row">
                	<div className="col-lg-7">
                    
                        <MarketAreaMap 
                            stops={this.props.stopsGeo} 
                            routes={this.props.routesGeo} 
                            tracts ={this.props.tracts}
                            stopFareZones={true}/>
                            
                    
                    </div>
                    <div className="col-lg-5">
                        
                        <section className="widget">
                           FareZones


                        </section>
                    
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = FareboxAnalysis;