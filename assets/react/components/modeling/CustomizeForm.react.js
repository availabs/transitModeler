/*globals require,console,module*/
'use strict';
var React = require('react'),
    censusUtils = require('../../utils/ModelCreateCensusParse'),
    RSInput = require('../../components/utils/ReactStoreInput.react'),

    // -- Actions
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator');


var numregex = /\-?[0-9]+\.?[0-9]*/;
function isValid(el){
  return el.length < 1000 && numregex.test(el);
}



var CustomizeForm = React.createClass({

    bubbleUp : function(data){
      data.geoid = this.props.modelSettings.geoid;
      ModelingActionsCreator.editModelSettings(data);
    },

    render: function() {

        var scope = this;
        if(!scope.props.modelSettings ||
          !scope.props.currentSettings || //if the forcast type isnt custom ignore
            scope.props.currentSettings.forecastType !== 'custom')
          return <span></span>;

        var settings = this.props.modelSettings;
        //if it is
        var tractCounts = censusUtils.reduceTripTable(scope.props.tt);
        var form = (function(){
          var regression, futureForecast,rows;
          if(scope.props.currentSettings.type === 'regression' && scope.props.currentSettings.regressionId){
            var head = (<tr><td><h4>Regression Variables</h4></td></tr> );
            rows = scope.props.currentSettings.regressionId.censusVariables.map(function(cvar){
              var data = scope.props.censusData.getTractData()[settings.geoid] ? parseInt(scope.props.censusData.getTractData()[settings.geoid][cvar.name]) : 0;
              return <tr><td>{cvar.name}</td><td><RSInput isValid={isValid} value={data}></RSInput></td></tr>;
            });
            regression = [head].concat(rows);
          }
          if(scope.props.currentSettings.forecast === 'future'){
            futureForecast = [];
            futureForecast.push( <tr><td><h4> 2020 Forecast </h4></td></tr> );
            futureForecast.push( <tr><td>Population Growth </td><td><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='pop2020_growth' isValid={isValid}  value={settings.pop2020_growth}></RSInput></td></tr>);
            futureForecast.push( <tr><td>Employment Growth </td><td><RSInput isNum={true} propName='emp2020_growth' isValid={isValid} value={settings.emp2020_growth}></RSInput></td></tr>);
          }
          var table = (
          <div>
            <h3>{'FIPS: ' +settings.geoid}</h3>
            <table class='table'>
              <tr><td>Origin Trips</td><td><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='origin' isValid={isValid} value={settings.origin}></RSInput></td></tr>
              <tr><td>Destination Trips</td><td><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='dest' isValid={isValid} value={settings.dest}></RSInput></td></tr>
              <tr><td>Bus To Work</td><td><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='busData' isValid={isValid} value={settings.busData}></RSInput></td></tr>
              {regression}
              {futureForecast}
            </table>
          </div>);

          return table;
        })();

      return form;
    }
});

module.exports = CustomizeForm;
