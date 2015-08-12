/*globals $,d3,require,module,console*/
'use strict';

var React = require('react'),
    downloadFile = require('../utils/downloadHelper'),
    // -- Components
    Select2Component = require('../utils/Select2.react'),
    CensusOverviewHeader = require('./CensusOverviewHeader.react'),
    CensusMap = require('./CensusMap.react'),
    CensusGraph = require('./CensusGraph.react'),
    CensusTable = require('./CensusTable.react'),

    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),
    SailsWebApi = require('../../utils/sailsWebApi'),

    // -- Stores
    DataSourceStore = require('../../stores/DatasourcesStore');

var i18n = {
    locales: ['en-US']
};


var CensusOverview = React.createClass({



    getInitialState: function(){

        var state = {};
        state.activeCensusCategory = 18;
        state.activeState = '34';
        state.activeCensus = 0;
        state.censusData = this.props.censusData;
        return state;

    },
    censusSelection : function(e,selections){
      if(selections.id !== this.state.activeCensus){
        var newState = this.state;
        newState.activeCensus = selections.id;
        console.log(selections);
        SailsWebApi.getRawCensus(this.props.marketarea.id,selections.year);
        this.setState(newState);
      }
    },
    censusCategorySelections: function (e, selections) {
        var newState = this.state;
        newState.activeCensusCategory = selections.id;
        MarketAreaActionsCreator.setActiveCensusVariable(this.props.censusData.getCategories()[Object.keys(this.props.censusData.getCategories())[selections.id]][0]);
        this.setState(newState);
    },
    downloadShape : function(type){
      var scope = this;
      if(type){
        var geoData = {
          zones:this.props.marketarea.zones,
          outputName:'acs5_34_2010_tracts',
          name:this.props.marketarea.name,
        };
        d3.xhr('/acs/geoJsonToShp')
          .post(JSON.stringify({geoData:geoData}),function(err,data){
            if(err){console.log('err',err);}
            console.log('got shapefile',JSON.parse(data.response).url,$('#downloadShp'));
            $('#downloadShp')
              .attr({
                'download':geoData.name+'_'+geoData.outputName+'.zip',
                'href':JSON.parse(data.response).url,
                'target':'_blank'
              });
              $('#downloadShp')[0].click();
          });
      }else{//get the census tract data points
        var tracts = this.props.censusData.getTractData();
        //get their geoids
        var tractIds = Object.keys(tracts);
        var geoJson = {type:"FeatureCollection",features:[]};
        var tractMap = {};
        //create a maping for which geo id is which feature in the geoTract collection
        this.props.tracts.features.forEach(function(d,i){
          tractMap[d.properties.geoid] = i;
        });
        //set the features for the new Feature Collection
        geoJson.features = tractIds.map(function(id){
          tracts[id].geoid=id;
          return  {type:"Feature",
            properties:tracts[id],
            geometry:scope.props.tracts.features[tractMap[id]].geometry
          };
        });
        downloadFile('data:text/json;charset=utf-8,',JSON.stringify(geoJson),this.props.marketarea.name+'.geojson','#downloadGeo');
      }
    },
    render: function() {
        var scope = this;
        var censusData = this.props.censusData.getTotalData();
        var data = Object.keys(this.props.censusData.getCategories()).map(function(cat,id){
            return {"id":id,"text":cat};
        });
        var acss = DataSourceStore.getType('acs');

        var censi = Object.keys(acss).filter(function(d){
          return acss[d].stateFips === scope.state.activeState;
        }).map(function(d,i){
          return {id:i,text:acss[d].tableName,year:acss[d].settings.year};
        });
        console.log(this.props.tracts);
        console.log(this.props.activeVariable);
        console.log(this.props.censusData);
        console.log(this.state.activeCensusCategory);
        return (
        	<div >
                <CensusOverviewHeader/>
                <div className="row">
                	<div className="col-lg-7">

                        <CensusMap
                            tracts={this.props.tracts}
                            activeVariable={this.props.activeVariable}
                            censusData={this.props.censusData}
                            activeCategory={this.state.activeCensusCategory} />

                    </div>
                    <div className="col-lg-5">
                      <section className="widget">
                        <div className="body no-margin">
                          <fieldset>

                              <div className="form-group">
                                  <label className="col-sm-3 control-label" htmlFor="grouped-select">Census</label>
                                  <div className="col-sm-9">
                                       <Select2Component
                                        id="the-other-hidden-input-id"
                                        dataSet={censi}
                                        onSelection={this.censusSelection}
                                        multiple={false}
                                        styleWidth="100%"
                                        val={[this.state.activeCensus]} />
                                  </div>
                              </div>

                          </fieldset>
                        </div>
                      </section>
                        <div>
                            <CensusGraph
                                activeCategory={this.state.activeCensusCategory}
                                censusData={this.props.censusData}
                                marketarea={this.props.marketarea}
                                />

                        </div>

                        <section className="widget">
                            <div className="body no-margin">

                                <fieldset>

                                    <div className="form-group">
                                        <label className="col-sm-3 control-label" htmlFor="grouped-select">Census Category</label>
                                        <div className="col-sm-9">
                                             <Select2Component
                                              id="the-hidden-input-id"
                                              dataSet={data}
                                              onSelection={this.censusCategorySelections}
                                              multiple={false}
                                              styleWidth="100%"
                                              val={[this.state.activeCensusCategory]} />
                                        </div>
                                    </div>

                                </fieldset>

                            </div>
                        </section>

                        <section className="widget">
                            <div className="body no-margin">
                                <CensusTable
                                    censusData={this.props.censusData}
                                    activeVariable={this.props.activeCensusVariable}
                                    activeCategory={this.state.activeCensusCategory} />
                            </div>
                        </section>
                        <section className="widget" style={{overflow:'hidden'}}>
                          <div className="body no-margin">
                            <a type='button' className="btn btn-block btn-warning col-sm-4 pull-right" onClick={this.downloadShape.bind(null,null)} id='downloadGeo'>
                              Download Census GeoJson</a>


                            <a type='button' className="btn btn-block btn-danger col-sm-4 pull-right" onClick={this.downloadShape.bind(null,'shape')} id='downloadShape'>
                              Download Census ShapeFile</a><a id='downloadShp'></a>
                          </div>
                        </section>
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = CensusOverview;
