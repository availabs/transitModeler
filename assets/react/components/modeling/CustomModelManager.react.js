'use strict';
var React = require('react'),

    // -- Actions
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator');

var FutureForecast = React.createClass({
    
    
    _setOption:function(e){
        
        var data = e.target.getAttribute('value').split(',');
        //console.log('_setOption',e.target.getAttribute('value'),data)
        ModelingActionsCreator.setOption(data[0],data[1]);
    },

    render: function() {

        var scope = this;
        //console.log(scope.props.regressions);

      
        var selectStyle = {
            width:'100%'
        }
        //console.log('forecast render',this.props.currentSettings.forecastType)
       

        return (
            <div >
                <label className="col-sm-4 control-label">Load Model</label>
                <div className="col-sm-8">
                    Selector
                </div>
                <label className="col-sm-4 control-label">Current Model</label>
                <div className="col-sm-8">
                    <Input type="text" value="New Model Settings" />
                </div>
            </div>
        );
    }
});

module.exports = FutureForecast;