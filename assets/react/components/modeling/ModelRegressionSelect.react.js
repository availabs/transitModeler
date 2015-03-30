'use strict';
var React = require('react'),

    // -- Actions
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator');

var ModelRegressionSelect = React.createClass({
    
    _setOption:function(e){
        
        var data = this.refs['regressionSelect'].getDOMNode().value;
        // console.log(
        //     '_setOption',
        //     data
        // )
        
        ModelingActionsCreator.setOption('regressionId',this.props.regressions[data]);
    },

    _initOption:function(data){
         //console.log('_initOption',data);
         ModelingActionsCreator.setOption('regressionId',data);
    },
    
    componentDidMount:function(){
        var scope = this;

        var setDefault = Object.keys(scope.props.regressions).filter(function(key){ 
            return scope.props.regressions[key].marketarea == scope.props.marketarea.id
        });
        
        this._initOption(scope.props.regressions[setDefault[0]]);

    },

    selectedModel: function(){
        var scope = this;
        var rows = '';
        if(scope.props.currentSettings['regressionId']){
            rows = scope.props.currentSettings['regressionId'].censusVariables.map(function(cv){
                return (
                    <tr>
                        <td>{cv.name}</td>
                        <td>{cv.coef}</td>
                    </tr>
                )
            })
            var constant = '';
            if(+scope.props.currentSettings['regressionId'].constant !== 0){
                constant =  (function getConstant(){
                    return (
                        <tr>
                            <td>constant</td>
                            <td>{+scope.props.currentSettings['regressionId'].constant}</td>
                        </tr>
                    )
                })()
            }
        }
        

        return (
            <table className="table table-hover">
                <thead>
                    <th>Variable</th>
                    <th>Coefficient</th>
                </thead>
                <tbody>
                    {constant}
                </tbody>
                <tbody>
                    {rows}
                </tbody>
                
            </table>
        )
    },

    render: function() {

        var scope = this;
        //console.log(scope.props.regressions);

       
        
        var Options = Object.keys(scope.props.regressions).map(function(key,i){
            
            if(scope.props.regressions[key].marketarea == scope.props.marketarea.id){
                return(
                    <option value={[scope.props.regressions[key].id]}>{scope.props.regressions[key].name}</option>
                )
            }
        
        }).filter(function(d){
            return d;
        });

        var selectedModel = scope.selectedModel();

        var selectStyle = {
            width:'100%'
        }

        return (
            <div >
                <label className="col-sm-4 control-label">REGRESSION MODEL</label>
                <div className="col-sm-8">
                    <select value={scope.props.currentSettings['regressionId'] ? scope.props.currentSettings['regressionId'].id  : 0 } className ='form-control'  ref="regressionSelect" style={selectStyle} onChange={scope._setOption}>
                        {Options}
                    </select>
                    <br />
                     { selectedModel }
                </div>
            </div>
        );
    }
});

module.exports = ModelRegressionSelect;