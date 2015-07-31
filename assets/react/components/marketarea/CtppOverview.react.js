/*globals module,console,require,d3*/
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

        var state = {};
        state.direction = 'from_tract'; //default to departures from tracts
        state.filter = null;            //don't filter at all
        return state;

    },

    setDirection : function(e){
        console.log('setDirection',e.target.getAttribute('value'));
        //set the departure direction based on the select button
        this.setState({direction:e.target.getAttribute('value')});
    },

    directionButtons : function(){
        //set the active button based on the current selected direction
        var homeClass = "btn btn-default" + (this.state.direction == 'from_tract' ? ' active' : ''),
            workClass = "btn btn-default" + (this.state.direction == 'to_tract' ? ' active' : '');

        return (
            <div className="btn-group" >
                <a type="button" className={homeClass} value="from_tract" onClick={ this.setDirection }>To Work</a>
                <a type="button" className={workClass} value="to_tract" onClick={ this.setDirection }>To Home</a>
            </div>
        );

    },
    mapTractSelect : function(geoid){
      this.setState({filter:geoid});
    },
    _selectTract : function(e){
        var geoid = e.target.getAttribute('data-key');
        console.log('select Tract',geoid);
        this.setState({filter:geoid});
    },

    _clearFilter :function(){
        this.setState({filter:null});
    },

    _renderSelectedTract : function(d){

        if(this.state.filter){
            return (
                <div>
                    <h4> {this.state.filter} <a className='btn btn-default' onClick={this._clearFilter}>Clear</a> </h4>
                </div>
            );
        }
        return (
            <span />
        );

    },

    render: function() {

        var direction = this.state.direction,
            opposite = (this.state.direction === 'from_tract') ? 'to_tract' : 'from_tract';
            //filter the ctppData based on the current direction and geoid


            var cdata;
            var sum = function(list){
              return list.map(function(d){return d.value;}).reduce(function(p,c){return p + c;});
            };
            if(this.state.filter){
              var dim = this.props.ctppData.dimensions[direction];
              console.log('original sum',sum(this.props.ctppData.groups[opposite].top(Infinity)));
              var content = dim.filter(this.state.filter);
              console.log('after filter sum',sum(this.props.ctppData.groups[opposite].top(Infinity)));
              cdata = content.top(Infinity).map(function(d){return {key:d[opposite],value:d.est};});
              dim.filterAll();
              console.log('after filter clear sum',sum(this.props.ctppData.groups[opposite].top(Infinity)));
            }else{
              cdata = this.props.ctppData.groups[direction].top(Infinity);
           }

            //get all the groups from the ctpp

            var ctppColumns = [
                {key:'key',name:'Tract'},
                {key:'value',name:'Num Trips'},
            ];

        return (
        	<div >

                <div className="row">
                	<div className="col-lg-7">

                        <CtppMap
                            tracts={this.props.tracts}
                            ctppData={cdata}
                            marketarea={this.props.marketarea}
                            direction = {this.state.direction}
                            selected={this.state.filter}
                            censusData={this.props.censusData}
                            selectTract={this.mapTractSelect}/>

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
