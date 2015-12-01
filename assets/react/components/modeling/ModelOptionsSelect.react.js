/*globals require,console,module*/
'use strict';
var React = require('react'),

    // -- Components
    ModelRegressionSelect = require('./ModelRegressionSelect.react'),
    FutureForecastSelect = require('./FutureForecastSelect.react'),
    ReactStoreInput = require('../utils/ReactStoreInput.react'),

    // -- Actions
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator');

var ModelOptionsSelect = React.createClass({


    _setOption:function(e){

        var data = e.target.getAttribute('value').split(',');
        console.log('_setOption',e.target.getAttribute('value'),data);
        ModelingActionsCreator.setOption(data[0],data[1]);
    },

    _customizeModel : function(){
      var scope = this;
      if(!this.props.modelSettings)
        return <span></span>;
      var settings = this.props.modelSettings;
      var form = (function(){
        var regression, futureForecast,rows;
        if(scope.props.currentSettings.type === 'regression' && scope.props.currentSettings.regressionId){
          var head = (<tr><td><h4>Regression Variables</h4></td></tr> );
          rows = scope.props.currentSettings.regressionId.censusVariables.map(function(cvar){
            var data = scope.props.censusData.getTractData()[settings.geoid] ? parseInt(scope.props.censusData.getTractData()[settings.geoid][cvar.name]) : 0;
            return <tr><td>{cvar.name}</td><td><input className='form-control' value={data}></input></td></tr>;
          });
          regression = [head].concat(rows);
        }
        if(scope.props.currentSettings.forecast === 'future'){
          futureForecast = [];
          futureForecast.push( <tr><td><h4> 2020 Forecast </h4></td></tr> );
          futureForecast.push( <tr><td>Population Growth </td><td><input className='form-control' value={settings.pop2020_growth}></input></td></tr>);
          futureForecast.push( <tr><td>Employment Growth </td><td><input className='form-control' value={settings.emp2020_growth}></input></td></tr>);
        }
        var table = (
        <div>
          <h3>{'FIPS: ' +settings.geoid}</h3>
          <table class='table'>
            <tr><td>Origin Trips</td><td><input className='form-control' value={settings.origin}></input></td></tr>
            <tr><td>Destination Trips</td><td><input className='form-control' value={settings.dest}></input></td></tr>
            <tr><td>Bus To Work</td><td><input className='form-control' value={settings.busData}></input></td></tr>
            {regression}
            {futureForecast}
          </table>
        </div>);

        return table;
      })();

      return form;
    },

    render: function() {
        var scope = this;
        console.log('currentSettings',scope.props.currentSettings);
        console.log('model options',scope.props.options);
        var fields = Object.keys(scope.props.options).map(function(option){

            var regressionInclude = (function(){

                if(option === 'type' && scope.props.currentSettings[option] === 'regression'){
                    return <ModelRegressionSelect
                                currentSettings={scope.props.currentSettings}
                                regressions={scope.props.regressions}
                                marketarea={scope.props.marketarea} />;
                }else if(option === 'forecast' && scope.props.currentSettings[option] === 'future'){
                    return (
                        <FutureForecastSelect currentSettings={scope.props.currentSettings}/>
                    );
                }

                return <span />;
            })();


            var Buttons = Object.keys(scope.props.options[option]).map(function(key){
                var currClass = "btn btn-default";
                if(key === scope.props.currentSettings[option]){ currClass+= ' active'; }

                return (
                    <a type="button" className={currClass}  value={[option,key]} onClick={scope._setOption}>{scope.props.options[option][key].name}</a>
                );
            });
            return (
                <div className="form-group">
                    <label className="col-sm-4 control-label">MODEL {option.toUpperCase()}</label>
                    <div className="col-sm-8">
                       <div className="btn-group">
                            {Buttons}
                        </div>
                        <br/>
                        <span className="help-block pull-left">{scope.props.options[option][scope.props.currentSettings[option]].helpText}</span>
                    </div>
                    {regressionInclude}
                </div>
            );

        });

        return (
            <div className="body">
                <form className="form-horizontal form-label-left" action="" method="POST">
                    <fieldset>
                        {fields}

                    </fieldset>
                    {scope._customizeModel()}
                </form>
            </div>
        );
    }
});

module.exports = ModelOptionsSelect;
