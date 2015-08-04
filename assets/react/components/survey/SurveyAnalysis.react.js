/*globals require,console,module*/
'use strict';

var React = require('react'),

    // -- Components
    MarketAreaMap = require('../utils/MarketAreaMap.react'),

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),

    // -- Stores
    SurveyStore = require('../../stores/SurveyStore'),
    SurveyGraph = require('./SurveyGraph.react'),
    SurveyFilters = require('./SurveyFilters.react'),

    // -- utils
    SurveyKeys = require('../../utils/data/surveyKeys');


var SurveyAnalysis = React.createClass({


    _getStateFromStore:function(){
        return {
            surveyGeo : SurveyStore.getGeo(this.props.marketarea.id),
            surveyData : SurveyStore.getData(this.props.marketarea.id),
            filters:{}
        };
    },

    getInitialState: function(){
        return this._getStateFromStore();
    },

    _addFilter:function(filter){
        console.log('add filter',filter);
        var newState = this.state;
        for(var key in filter){

            if(newState.filters[key] === filter[key]){
                newState.filters[key] = null;
            }
            else{
                newState.filters[key] = filter[key];
            }

        }
        this.setState(newState);
    },
    removeFilter : function(d){
      var newState = this.state;
      if(d){
        newState.filters[d] = null;
      }else{
        Object.keys(newState.filters).forEach(function(d){
          newState.filters[d] = null;
        });
      }
      this.setState(newState);
    },

    componentDidMount: function() {
        SurveyStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        SurveyStore.removeChangeListener(this._onChange);
    },

    _onChange:function(){
        this.setState(this._getStateFromStore());
    },


    componentWillReceiveProps:function(nextProps){
        //console.log(nextProps.marketarea.id,this.props.marketarea.id)
        if(nextProps.marketarea && nextProps.marketarea.id !== this.props.marketarea.id){
            //console.log('new ma',nextProps.marketarea.id)
            this.setState({
                surveyGeo : SurveyStore.getGeo(nextProps.marketarea.id),
                surveyData : SurveyStore.getData(nextProps.marketarea.id)
            });
        }
    },

    _filterGeo:function(){
        var scope = this,
            filterGeo = {type:'FeatureCollection',features: scope.state.surveyGeo.features.map(function(d){ return d; })};

        for(var key in this.state.filters){
          if(key){ // check if the key is valid
            filterGeo.features =  filterGeo.features.filter(function(d){
                //console.log(key,d.properties[key], scope.state.filters[key], scope.state.filters[key] === d.properties[key])
                return d.properties[key] === scope.state.filters[key];
            });
          }
        }
        //console.log('filterGeo',filterGeo.features.length)
        return filterGeo;


    },
    _renderSurveys:function(){

        var scope = this,
            discreteCats = ['busroute','captivity','accessmode','vehicleavail','tickettype','tripfreq','triptenure','qualservchg','gender','age','race'];

        return discreteCats.map(function(cat){
            return (
                <div className='col-md-4'>
                <h4>{cat}</h4>
                <SurveyGraph
                    height="250"
                    surveyData={scope.state.surveyData}
                    groupName={cat}
                    filters = {scope.state.filters}
                    filterFunction={scope._addFilter}
                    keyMap={SurveyKeys[cat]} />
                </div>
            );
        });
    },

    render: function() {
       //console.log('survey data',this.state.survey)
       console.log('Filters',this.state.filters);
        return (
        	<div>


                <div className="row">
                	<div className="col-lg-5" >
                        <div data-spy="affix" data-offset-top="240">
                            <MarketAreaMap
                                stops={this.props.stopsGeo}
                                routes={this.props.routesGeo}
                                tracts ={this.props.tracts}
                                survey= {this._filterGeo()} />
                        </div>
                        <br/>
                        <section className="widget">
                          <SurveyFilters
                            data={this.state.filters}
                            buttonclick={this.removeFilter}      />
                        </section>

                    </div>
                    <div className="col-lg-7">
                        <div className='row'>
                            <section className="widget" style={{overflow:'auto'}}>
                            Filter:{JSON.stringify(this.state.filters)}
                            {this._renderSurveys()}

                            </section>
                        </div>

                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = SurveyAnalysis;
