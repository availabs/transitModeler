'use strict';
var React = require('react'),

    // -- Actions
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator');

var ModelOptionsSelect = React.createClass({


    _setOption:function(e){
        
        var data = e.target.getAttribute('value').split(',');
        console.log('_setOption',e.target.getAttribute('value'),data)
        ModelingActionsCreator.setOption(data[0],data[1]);
    },

    render: function() {
        var scope = this;

        var fields = Object.keys(scope.props.options).map(function(option){

            var Buttons = Object.keys(scope.props.options[option]).map(function(key){
                var currClass = "btn btn-default";
                if(key === scope.props.currentSettings[option]){ currClass+= ' active'; }

                return (
                    <a type="button" className={currClass}  value={[option,key]} onClick={scope._setOption}>{scope.props.options[option][key].name}</a>
                )
            });
            return (
                <div className="form-group">
                    <label className="col-sm-4 control-label">MODEL {option.toUpperCase()}</label>
                    <div className="col-sm-8">
                       <div className="btn-group">
                            {Buttons}
                        </div>
                    
                        <span className="help-block pull-left">{scope.props.options[option][scope.props.currentSettings[option]].helpText}</span>
                    </div>
                </div>
            )

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

