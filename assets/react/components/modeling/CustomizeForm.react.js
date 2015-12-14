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
      
      console.log('bubbleUp',data);
      this.props.editTract(Object.keys(data)[0],data[Object.keys(data)[0]],this.props.modelSettings.geoid)
      //ModelingActionsCreator.editModelSettings(data);
    },

    validChange : function(d){
        return validNameInput(d);
    },

    reset : function() {
      ModelingActionsCreator.resetModelSettings();
    },

    renderEditor:function(){
        
        var scope = this,
            regression, 
            futureForecast,
            rows,
            settings = this.props.modelSettings;

          if(scope.props.currentSettings.type === 'regression' && scope.props.currentSettings.regressionId){
            var head = (<tr><td><h4>Regression Variables</h4></td></tr> );
            rows = scope.props.currentSettings.regressionId.censusVariables.map(function(cvar){
              return <tr><td>{cvar.name}</td><td><RSInput isValid={isValid} isNum={true} bubbleup={scope.bubbleUp} propName={cvar.name} value={scope.props.tractData[settings.geoid][cvar.name]}></RSInput></td></tr>;
            });
            regression = [head].concat(rows);
          }
          //console.log('is there tract data',scope.props.tractData)
          futureForecast = [];
          futureForecast.push( <tr><td><h4 class="page-title"> Forecast </h4></td></tr> );
          futureForecast.push( <tr><td>Population Growth </td><td style={{textAlign:'center'}}><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='pop2020_growth' isValid={isValid}  value={scope.props.tractData[settings.geoid].pop2020_growth || 0}></RSInput></td></tr>);
          futureForecast.push( <tr><td>Employment Growth </td><td style={{textAlign:'center'}}><RSInput isNum={true} bubbleup={scope.bubbleUp} propName='emp2020_growth' isValid={isValid} value={scope.props.tractData[settings.geoid].emp2020_growth || 0}></RSInput></td></tr>);
          
          return  (
            <div className="row">
              <div  className='col-sm-12'>
              <h3>{'FIPS: ' +settings.geoid}</h3>
              <table class='table'>
                <tbody>
                {regression}
                {futureForecast}
                </tbody>
              </table>
              </div>
            </div>
          )

    },


    loadSettings:function(settingsId){
      //call up props

      if(this.props.loadCustomSettings){
        if(settingsId === -1){
          var newSettings = {name:'',settings:''}
          //console.log('new settings,newSettings');
          this.props.loadCustomSettings( newSettings );
        
        }else{
        
          this.props.loadCustomSettings( this.props.customSettingsList[settingsId] )
        
        }
      }
    },

    editModelName:function(e){
      //console.log(e.target.value)
      if(this.props.changeName){
        this.props.changeName(e.target.value)
      }
    },

    render: function() {
        //console.log('render custom',this.props.modelSettings,this.props.currentSettings)
        var scope = this,
            settings = this.props.modelSettings,
            form = <span />

        if(!settings.geoid){
          form =  <span>Click Tract to Edit Data</span>
        }else{
          form = this.renderEditor();
        }
        //console.log('from settings',this.props.customSettingsList);
        var settingList = Object.keys(scope.props.customSettingsList).map(function(settingId){
           return(
              <li><a onClick={scope.loadSettings.bind(null,settingId)}>{scope.props.customSettingsList[settingId].name} </a></li>
            )
        })

      return (
        <div>
          <h4 class="page-title">Custom Forecast Editor</h4>
        <div  className="row">
          <fieldset>
            <div className="form-group" style={{minHeight:30}}>
                <label className="col-sm-1 control-label"></label>
                    
                        
                <div className="col-sm-11 input-group" style={{paddingRight:5}}>
                    <input onChange={this.editModelName} value={this.props.customModel.name} placeholder='Enter Settings Name' id="segmented-dropdown" className="form-control" type="text" style={{marginRight:0}} />
                    <div className="input-group-btn">
                        <button className="btn btn-warning" tabindex="-1" onClick={this.props.saveModel}>Save</button>
                        <button className="btn btn-warning dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                            Load<i className="fa fa-caret-down"></i>
                        </button>
                        <ul className="dropdown-menu">
                            <li><a onClick={scope.loadSettings.bind(null,-1)}>New Settings</a></li>
                            <li className="divider"></li>
                            {settingList}
                        </ul>
                    </div>
                </div>
            </div>
          </fieldset>
        </div>
          {form}
        </div>
      )
    }
});

module.exports = CustomizeForm;
