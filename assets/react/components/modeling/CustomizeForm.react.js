/*globals require,console,module*/
'use strict';
var React = require('react'),
    censusUtils = require('../../utils/ModelCreateCensusParse'),
    RSInput = require('../../components/utils/ReactStoreInput.react'),
    CreationForm = require('../gtfs/CreationForm.react'),

    // -- Actions
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator');


var numregex = /\-?[0-9]+\.?[0-9]*/;
function isValid(el){
  return el.length < 1000 && numregex.test(el);
}

var validStringRegex = new RegExp('^[A-Za-z0-9\\.\\_\\-]+$');
var validNameInput = function(str){
  return (str.length < 1000) && validStringRegex.test(str);
};

var CustomizeForm = React.createClass({

    bubbleUp : function(data){
      data.geoid = this.props.modelSettings.geoid;
      ModelingActionsCreator.editModelSettings(data);
    },

    validChange : function(d){
        return validNameInput(d);
    },

    save : function(d){
      var scope = this;
      console.log(d.Name);
      var settingsGroupObj = {}; //initialize the object to hold the group of settings
      settingsGroupObj.Name = d.Name;
      settingsGroupObj.Group = [];

      //get the tract counts for origin destination and bus 2 work
      var tractCounts = censusUtils.reduceTripTable(scope.props.tt);
      scope.props.tracts.features.forEach(function(d){
        if(d.properties.dirty)
          return;
        var geoid = d.properties.geoid;
        d.properties.origin = tractCounts[geoid] ? tractCounts[geoid].o : '0';
        d.properties.dest = tractCounts[geoid] ? tractCounts[geoid].d : '0';
        d.properties.busData = censusUtils.bus2work(scope.props.censusData,geoid);
        if( scope.props.currentSettings.type ==='regression' && scope.props.currentSettings.regressionId){
          d.properties.regression = {};
          scope.props.currentSettings.regressionId.censusVariables.forEach(function(cenvar){
              var regData = scope.props.censusData.getTractData()[geoid] ? parseInt(scope.props.censusData.getTractData()[geoid][cenvar.name]) : 0;
              d.properties.regression[cenvar.name] = regData;
          });
        }
      });

      settingsGroupObj.Group = scope.props.tracts.features;
      ModelingActionsCreator.saveModelSettings(settingsGroupObj);
    },

    reset : function() {
      ModelingActionsCreator.resetModelSettings();
    },

    render: function() {

        var scope = this;
        if(!scope.props.modelSettings ||
          !scope.props.currentSettings || //if the forcast type isnt custom ignore
            scope.props.currentSettings.forecastType !== 'custom')
          return <span></span>;

        var settings = this.props.modelSettings;
        console.log('from settings',settings);
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
            futureForecast.push( <tr><td><h4> Forecast </h4></td></tr> );
            futureForecast.push( <tr><td>Population Growth </td><td><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='pop_growth_custom' isValid={isValid}  value={settings.pop_growth_custom || settings.pop2020_growth}></RSInput></td></tr>);
            futureForecast.push( <tr><td>Employment Growth </td><td><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='emp_growth_custom' isValid={isValid} value={settings.emp_growth_custom || settings.emp2020_growth}></RSInput></td></tr>);
          }
          var table = (
          <div>
            <h3>{'FIPS: ' +settings.geoid}</h3>
            <table class='table'>
              <tbody>
              <tr><td>Origin Trips</td><td><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='origin' isValid={isValid} value={settings.origin}></RSInput></td></tr>
              <tr><td>Destination Trips</td><td><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='dest' isValid={isValid} value={settings.dest}></RSInput></td></tr>
              <tr><td>Bus To Work</td><td><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='busData' isValid={isValid} value={settings.busData}></RSInput></td></tr>
              {regression}
              {futureForecast}
              <tr>
                <td>
                   <a onClick={scope.reset} className='btn btn-danger' >Reset All</a>
                 </td>
                 <td>
                    <CreationForm className='btn btn-danger'
                      buttonText={'Save Settings'}
                      id={'formTractSettings'}
                      handleChange={scope.validChange}
                      invalidMessages={{Name:'Name cannot be empty'}}
                      saveAction={scope.save}
                      values={{Name:'ModelSettings'}}
                      />
                </td>
              </tr>
              </tbody>
            </table>

          </div>);

          return table;
        })();

      return form;
    }
});

module.exports = CustomizeForm;
