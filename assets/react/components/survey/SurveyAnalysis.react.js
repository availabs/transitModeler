/*globals require,console,module,d3*/
'use strict';

var React = require('react'),

    // -- Components
    MarketAreaMap = require('../utils/MarketAreaMap.react'),

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),
    GraphDisplay           = require('./GraphDisplay.react.js'),
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
            filters:{},
            type:'unweighted',
        };
    },

    getInitialState: function(){
        return this._getStateFromStore();
    },
    filterCheck : function(f){
      return (f.indexOf('_weight') < 0) ? f:f.substring(0,f.indexOf('_weight'));
    },
    _addFilter:function(filter){
        console.log('add filter',filter);
        var newState = this.state;
        for(var key in filter){
            var value = filter[key];
            key = this.filterCheck(key);
            if(newState.filters[key] === value){
                newState.filters[key] = null;
            }
            else{
                newState.filters[key] = value;
            }

        }
        this.setState(newState);
    },
    removeFilter : function(d){
      var newState = this.state;
      if(d){
        d = this.filterCheck(d);
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
          if(scope.state.filters[key]){ // check if the key is valid filter
            filterGeo.features =  filterGeo.features.filter(function(d){
                //console.log(key,d.properties[key], scope.state.filters[key], scope.state.filters[key] === d.properties[key])
                return d.properties[key] === scope.state.filters[key];
            });
          }
        }
        //console.log('filterGeo',filterGeo.features.length)
        return filterGeo;
    },
    setType : function(){
      if(this.state.type === 'unweighted')
        this.setState({type:'weighted'});
      else{
        this.setState({type:'unweighted'});
      }
    },
    optionButtons : function(){
        //set the active button based on the current selected direction
        var unWeightedClass = "btn btn-default" + (this.state.type == 'unweighted' ? ' active' : ''),
            weightedClass = "btn btn-default" + (this.state.type == 'weighted' ? ' active' : '');

        return (
            <div className="btn-group" >
                <a type="button" className={unWeightedClass} value="from_tract" onClick={ this.setType }>unweighted</a>
                <a type="button" className={weightedClass} value="to_tract" onClick={ this.setType }>weighted</a>
            </div>
        );

    },
    _renderSurveys:function(){

        var scope = this,
            discreteCats = ['busroute','captivity','accessmode','vehicleavail','tickettype','tripfreq','triptenure','qualservchg','gender','age','race'];
        var suffix = (this.state.type === 'weighted')?'_weight':'';
        var colors = d3.scale.category20().range();

        return discreteCats.map(function(cat,i){
            var groupName = cat + suffix;
            var displayFilter;
            if(cat ==='busroute'){
              displayFilter = function(d){
                return scope.props.marketarea.routes.indexOf(d.key) >=0;
              };
            }
            var obj ={
              height:"250",
              surveyData:scope.state.surveyData,
              groupName:groupName,
              filters:scope.state.filters,
              filterFunction:scope._addFilter,
              keyMap:SurveyKeys[cat],
              colors:(cat==='busroute')?scope.props.marketarea.routecolors:colors[i%20],
              label:cat,
              displayFilter:displayFilter,
            };

            var retval =  function(){
                return (
                React.createElement(SurveyGraph,obj)
              );
            };
            retval.settings = obj;
            return retval;
        });
    },

    render: function() {
       //console.log('survey data',this.state.survey)
       console.log('Filters',this.state.filters);
        return (
        	<div>


                <div className="row">
                	<div className="col-lg-5" >
                        <div >
                            <MarketAreaMap
                                stops={this.props.stopsGeo}
                                routes={this.props.routesGeo}
                                tracts ={this.props.tracts}
                                survey= {this._filterGeo()}
                                type={this.state.type} />
                        </div>
                        <br/>

                          <section className="widget">
                            {this.optionButtons()}
                            <SurveyFilters
                              data={this.state.filters}
                              buttonclick={this.removeFilter}      />
                          </section>


                    </div>
                    <div className="col-lg-7">
                        <div className='row'>
                            <section className="widget" style={{overflow:'auto'}}>
                            <GraphDisplay
                            items={this._renderSurveys()}
                            height={"500"}
                            />

                            </section>
                        </div>
                        Filter:{JSON.stringify(this.state.filters)}
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = SurveyAnalysis;
