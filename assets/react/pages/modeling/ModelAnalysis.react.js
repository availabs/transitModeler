/*globals d3,$,require,console,module,setTimeout,clearTimeout*/
'use strict';

var React = require('react'),
    Router = require('react-router'),
    Link = require('react-router').Link,


    // -- Components
    WidgetHeader = require('../../components/WidgetHeader.react'),
    ModelRunSelector = require('../../components/modelAnalysis/modelRunSelector.react'),
    RouteTotalGraph = require('../../components/modelAnalysis/routeTotalGraph.react'),
    ModelRunContainer = require('../../components/modelAnalysis/modelRunContainer.react'),
    TimeSliders = require('../../components/utils/TimeSliders.react'),
    lastAction,
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),
    // -- Stores
    ModelRunStore = require('../../stores/ModelRunStore.js');

var i18n = {
    locales: ['en-US']
};



var MarketAreaIndex = React.createClass({

    mixins: [Router.State],

    statics: {

        willTransitionTo: function (transition, params) {
            //if the market area id has been specified in the url
            if(params.marketareaID){
              //make fire an action to set that as the current market area, supporting stateless transition
               MarketAreaActionsCreator.setCurrentMarketArea(params.marketareaID);
            }
        }

    },

    getInitialState: function(){
        return {
            //get the models that have been run
            model_runs:ModelRunStore.getModelRuns()
        };
    },

    componentDidMount: function() { //after initial rendering subscribe to the ModelRunStore
        ModelRunStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() { //if component will be destroy kill subscription to the store
        ModelRunStore.removeChangeListener(this._onChange);
    },

    _onChange:function(){ //when a subscription has updated
        this.setState({//get the model runs from the store
            model_runs:ModelRunStore.getModelRuns()
        });
    },
    _renderModelRuns:function(){
        //console.log('loaded Models',this.props.loadedModels)
        //if the models are not ready display nothing
        if(!this.props.loadedModels.initialized || this.props.loadedModels.loadedModels.length === 0){
            return (
                <span />
            );
        }
        //if there is only one model run map
        if(this.props.loadedModels.loadedModels.length === 1){
            //display 1 model run
            return (
                <div className="col-lg-12">
                    <ModelRunContainer
                        marketarea={this.props.currentMarketarea}
                        tracts={this.props.tracts}
                        routesGeo={this.props.routesGeo}
                        stopsGeo={this.props.stopsGeo}
                        data={this.props.loadedModels}
                        modelId={this.props.loadedModels.loadedModels[0]} />
                </div>
            );
        }
        //otherwise display 2 model run maps
        return (
            <div>
                <div className="col-lg-6">
                    <ModelRunContainer
                        marketarea={this.props.currentMarketarea}
                        tracts={this.props.tracts}
                        routesGeo={this.props.routesGeo}
                        stopsGeo={this.props.stopsGeo}
                        data={this.props.loadedModels}
                        mapId='map1'
                        modelId={this.props.loadedModels.loadedModels[0]} />
                </div>
                <div className="col-lg-6">
                    <ModelRunContainer
                        marketarea={this.props.currentMarketarea}
                        tracts={this.props.tracts}
                        routesGeo={this.props.routesGeo}
                        stopsGeo={this.props.stopsGeo}
                        data={this.props.loadedModels}
                        mapId='map2'
                        modelId={this.props.loadedModels.loadedModels[1]} />
                </div>
            </div>
        );

    },
    _onTimeChange : function(range){
      var scope = this;
      console.log(range);
      scope.setState({timeRange:range});
    },
    _getTimeData : function(){
      var scope = this;
      if(scope.props.loadedModels.initialized){
      var datasets =   scope.props.loadedModels.loadedModels.map(function(d){ //for each model loaded
          //consider only the current run only
          scope.props.loadedModels.dimensions.run_id.filter(d);
          //get the hour groupings for that particular dataset
          var data = scope.props.loadedModels.groups.hours.top(Infinity).map(function(d){
            var key = d.key.split(';'); //key[0] = hour of day,key[1] = route id
            var color = scope.props.marketarea.routecolors[key[1]]; //get the routes color from the market area
            return {x:key[0]+':00',y:d.value,color:color,group:key[1]}; //build the record for the timeslider
          });
          return {id:d,data:data};
        });
        scope.props.loadedModels.dimensions.run_id.filterAll();
        return datasets;
      }
      return [];
    },
    deleteModel : function(id){
      ModelingActionsCreator.removeActiveModelRun(id);
    },
    render: function() {
      var hourRange;
      if(this.state.timeRange){
        hourRange = this.state.timeRange.map(function(d){return d.getHours();});
      }
      console.log('models',this.props.loadedModels.loadedModels.length);
        return (
        	<div className="content container">
            	<h2 className="page-title">{this.props.marketarea.name} <small>Model Analysis</small>
                    <div className="btn-group pull-right">
                        <Link to="ModelAnalysis" params={{marketareaID:this.props.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Model Analysis
                        </Link>
                        <Link to="ModelCreate" params={{marketareaID:this.props.marketarea.id}} type="button" className="btn btn-primary" data-original-title="" title="">
                            Run New Models
                        </Link>
                    </div>
                </h2>

                <div className="row">

                    <div className="col-lg-9">
                        <section className="widget">
                            <div className="body no-margin">

                                <ModelRunSelector marketarea={this.props.marketarea} model_runs={this.state.model_runs} />

                            </div>
                        </section>
                        <div style={{width:'100%'}}>
                            <TimeSliders
                              datasets={this._getTimeData()}
                              height={100}
                              width={700}
                              onChange={this._onTimeChange}
                              delete ={this.deleteModel}
                              />
                        </div>
                        <div style={{width:'100%'}}>
                            <RouteTotalGraph
                              colors={this.props.marketarea.routecolors}
                              timeFilter={hourRange}
                              routeData={this.props.loadedModels}  />
                        </div>
                    </div>

                    <div className="col-lg-3">
                        <section className="widget">
                            <div className="body no-margin">

                            </div>
                        </section>
                        <section className="widget">
                            <div className="body no-margin">

                            </div>
                        </section>
                    </div>
                </div>

                <div className='row'>
                    {this._renderModelRuns()}
                </div>

            </div>

        );
    }
});

module.exports = MarketAreaIndex;
