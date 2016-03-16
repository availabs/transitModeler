'use strict';
/*globals confirm, console,module,require*/
var React = require('react'),
    //comps
    Select2Component = require('../utils/Select2.react'),
    CreationForm     = require('./CreationForm.react'),
    // -- Actions
    GtfsActionsCreator = require('../../actions/GtfsActionsCreator');

    // -- Stores

var idGen = require('../utils/randomId');
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
            gtfsSelection:this.props.marketarea.origin_gtfs,
        };
    },
    componentWillReceiveProps : function(nextProps){
	if(nextProps.currentDataSource !== this.state.gtfsSelection)
	    this.setState({gtfsSelection:nextProps.currentDataSource});
    },
    updateData : function(e,selection){
      if(selection && this.isMounted()){
        this.props.setDataSource(selection.id);
        this.setState({gtfsSelection:selection.id});
        console.log(selection.id);
      }
    },
    render: function() {
        var scope = this;
        var classes = "btn btn-lg btn-block";
        var datasources = this.props.data;
        var gtfsDataOptions = [];
        var description='';
        console.log('datasources',datasources);
        if(datasources){
          gtfsDataOptions = Object.keys(datasources).map(function(d){
            return {id:d,'text':datasources[d].tableName}; //get a list of the ids and their tablenames
          });
          if(this.state.gtfsSelection){
            description = (<section className="widget">
              <div className='row'>
                <h4>Data Description</h4>
                {datasources[this.state.gtfsSelection].settings.description}
              </div>
            </section>);
          }
        }

        console.log('Market Area',this.props.marketarea);

        return (
          <div>
            <section className="widget">

                <div className="body no-margin" >
	         {'Current DataSet'}
                    <Select2Component
                      id="dataSelector"
                      dataSet={gtfsDataOptions}
                      multiple={false}
                      styleWidth="100%"
                      onSelection={this.updateData}
                      placeholder={"Select a Gtfs DataSource"}
                      val={this.state.gtfsSelection}/>
                </div>
            </section>
            {description}
            </div>
        );
    }
});

module.exports = MarketAreaNew;
