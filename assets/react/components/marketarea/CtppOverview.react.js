'use strict';

var React = require('react'),
    
    // -- Components
    DataTable = require('../utils/DataTable.react'),
    CtppMap = require('./CtppMap.react'),
   

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
   
var i18n = {
    locales: ['en-US']
};


var CtppOverview = React.createClass({

    getInitialState: function(){
    
        var state = {}
        state.direction = 'from_tract';
        state.filter = null;
        return state;
    
    },

    setDirection : function(e){
        console.log('setDirection',e.target.getAttribute('value'))
        this.setState({direction:e.target.getAttribute('value')})
    },

    directionButtons : function(){
        var homeClass = "btn btn-default" + (this.state.direction == 'from_tract' ? ' active' : ''),
            workClass = "btn btn-default" + (this.state.direction == 'to_tract' ? ' active' : '');
            
        return (
            <div className="btn-group" >
                <a type="button" className={homeClass} value="from_tract" onClick={ this.setDirection }>Home Origin</a>
                <a type="button" className={workClass} value="to_tract" onClick={ this.setDirection }>Work Origin</a>
            </div>
        )

    },

    _selectTract : function(e){
        console.log('select Tracct',e.target.getAttribute('data-key'))
        this.setState({filter:e.target.getAttribute('data-key')})
    },

    _clearFilter :function(){

        this.setState({filter:null})
    
    },

    _renderSelectedTract : function(d){

        if(this.state.filter){
            return (
                <div>
                    <h4> {this.state.filter} <a className='btn btn-default' onClick={this._clearFilter}>Clear</a> </h4>
                </div>
            )
        }
        return (
            <span />
        )

    },

    render: function() {
       
        var direction = this.state.direction,
            opposite = this.state.direction === 'from_tract' ? 'to_tract' : 'from_tract';

            this.props.ctppData.dimensions[direction].filter(this.state.filter)

            var cdata = this.props.ctppData.groups[direction].top(Infinity),
            ctppColumns = [
                {key:'key',name:'Tract'},
                {key:'value',name:'Num Trips'},
            ]

        return (
        	<div >
                
                <div className="row">
                	<div className="col-lg-7">
                       
                        <CtppMap 
                            tracts={this.props.tracts}
                            ctppData={cdata}
                            marketarea={this.props.marketarea}
                            direction = {this.state.direction}/>
                             
                    </div>
                    <div className="col-lg-5">
                        

                        <section className="widget">
                            <header>
                                <h4>
                                    Trips <small> By Tract</small>
                                </h4>
                            </header>
                            <div className="form-group" >
                                {this.directionButtons()}
                            </div>
                            {this._renderSelectedTract()}
                            <div className="body no-margin">
                            
                                <DataTable data={cdata} columns={ctppColumns} rowValue={'key'} rowClick={this._selectTract} />
                            
                            </div>
                        </section>
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = CtppOverview;