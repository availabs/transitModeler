/*globals require,console,module*/
'use strict';
var React = require('react'),

    // -- Components
    ModelRegressionSelect = require('./ModelRegressionSelect.react'),
    FutureForecastSelect = require('./FutureForecastSelect.react'),
    CustomModelManager = require('./CustomModelManager.react'),

    // -- Actions
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator');


var ModelOptionsSelect = React.createClass({


    _setOption:function(e){

        var data = e.target.getAttribute('value').split(',');
        //console.log('_setOption',e.target.getAttribute('value'),data);
        ModelingActionsCreator.setOption(data[0],data[1]);
    },



    render: function() {
        var scope = this;
        //console.log('currentSettings',scope.props.currentSettings);
        //console.log('model options',scope.props.options);
        var fields = Object.keys(scope.props.options).map(function(option){

            var regressionInclude = (function(){
                //console.log(option)
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
                </form>
            </div>
        );
    }
});

module.exports = ModelOptionsSelect;
