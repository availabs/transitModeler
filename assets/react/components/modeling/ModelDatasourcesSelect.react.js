'use strict';
var React = require('react'),

    // -- Actions
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator');

var ModelDatasourcesSelect = React.createClass({


    _setDatasource:function(e){
        
        var data = e.target;
        //console.log('_setOption',this.refs['regressionSelect'].getDOMNode().value,data)
        //ModelingActionsCreator.setOption(data[0],data[1]);
    },

    render: function() {
        var scope = this;
        var fields = Object.keys(this.props.datasources).map(function(source){

            var Options = Object.keys(scope.props.datasources[source]).map(function(key){
                var currClass = "btn btn-default";
                //if(key === scope.props.currentSettings[source]){ currClass+= ' active'; }

                var name = ''
                switch(source){
                    
                    case 'acs':
                        name = scope.props.datasources[source][key].settings.year +' 5 Year Summary';
                    break;
                    
                    case 'ctpp':
                        name = scope.props.datasources[source][key].settings.year +' CTPP';
                    break;

                     case 'gtfs':
                        name = scope.props.datasources[source][key].tableName;
                    break;

                }

                return (
                    <option value={[source,key]}>{name}</option>
                )
            
            });
            
            var selectStyle = {
                width:'100%'
            }
            
            return (
                <div className="form-group">
                    <label className="col-sm-4 control-label">{source.toUpperCase()} SOURCE</label>
                    <div className="col-sm-8">

                        <select className ='form-control' ref="regressionSelect" style={selectStyle} onChange={scope._setDatasource}>
                            {Options}
                        </select>
                        
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

module.exports = ModelDatasourcesSelect;

