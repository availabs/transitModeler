'use strict';

var React = require('react'),
    
    // -- Components
    MarketAreaMap = require('../utils/MarketAreaMap.react'),
    FareboxGraph = require('./FareboxGraph.react'),
    
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),
    
    // -- Stores
    FareboxStore = require('../../stores/FareboxStore');
    //TripTableStore = require('../../stores/TripTableStore'),

    // -- Comp Globals
    


var FareboxAnalysis = React.createClass({


    
    _getStateFromStore:function(){
        return {
            farebox : FareboxStore.getFarebox(this.props.marketarea.id),
            filters:{}
        }
    },

    getInitialState: function(){
        return this._getStateFromStore();
    },

    componentDidMount: function() {
        FareboxStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        FareboxStore.removeChangeListener(this._onChange)
    },

    _onChange:function(){
        this.setState(this._getStateFromStore())
    },
        
    componentWillReceiveProps:function(nextProps){
        //console.log(nextProps.marketarea.id,this.props.marketarea.id)
        if(nextProps.marketarea && nextProps.marketarea.id !== this.props.marketarea.id){
            //console.log('new ma',nextProps.marketarea.id)
            this.setState({
                farebox : FareboxStore.getFarebox(nextProps.marketarea.id),
            })
        }
    },
    
    _renderFareZones:function(){
        var FareZones = {};
        this.props.stopsGeo.features.forEach(function(d){
            if(!FareZones[d.properties.line]){ FareZones[d.properties.line] = [] }
            if(d.properties.fare_zone && FareZones[d.properties.line].indexOf(d.properties.fare_zone) === -1){
                FareZones[d.properties.line].push(d.properties.fare_zone)
            }
        })

        return Object.keys(FareZones).map(function(key){
            
            var secondRow =  FareZones[key].map(function(d){
                return <td>{d}</td>
            });

            return (
                <table className="table">
                    <tbody>
                        <tr colSpan={secondRow.length}>
                            <td colSpan={secondRow.length} style={{textAlign:'center'}}>{key}</td>
                        </tr>
                        <tr>{secondRow}</tr>
                    </tbody>
                </table>
            )
        });

        
    },

    render: function() {
       
        console.log(this.state.farebox,this.state.farebox.all)
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
                        <FareboxGraph farebox={this.state.farebox} />
                        <section className="widget">
                           FareZones
                           {this._renderFareZones()}

                        </section>
                    
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = FareboxAnalysis;