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
        console.log('forecast render',this.props.currentSettings.forecastType)
        var mpoClass="btn btn-default",
            customClass="btn btn-default";
        if(this.props.currentSettings.forecastType === 'mpo'){
            mpoClass += ' active'
        }else{
            customClass +=' active'
        }

        return (
            <div >
                <label className="col-sm-4 control-label">Future Forecase</label>
                <div className="col-sm-8">
                    <div className="btn-group">
                        <a type="button" className={mpoClass} value="forecastType,mpo" onClick={this._setOption}>MPO 2020 Forecast</a>
                        <a type="button" className={customClass} value="forecastType,custom" onClick={this._setOption}>Custom Forcast</a>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = FutureForecast;