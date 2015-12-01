/*globals require,console,module,d3,$*/
'use strict'
var React = require('react'),
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),
    ModelRunStore = require('../../stores/ModelRunStore'),
    TripTableStore = require('../../stores/TripTableStore');

var ModelSummary = React.createClass({
  getDefaultProps : function(){
    return {
      modelIds:[],
    };
  },
  getInitialState : function(){
    var id = this.props.activeId || this.props.modelIds[0];
    var Is =  {
      activeId : id,
      model_runs: ModelRunStore.getModelRuns(),
      trip_table:TripTableStore.getCurrentTripTable(),
    };
    return Is;
  },

  _onChange : function(){//when a subscription has been updated
    this.setState({//get the trip tables from the store
      model_runs : ModelRunStore.getModelRuns(),
      trip_table : TripTableStore.getCurrentTripTable(),
    });
    //console.info('update',TripTableStore.getCurrentTripTable());
  },

  componentWillReceiveProps : function(nextProps){
    //if we receive new props and the user hasn't already chosen an id to view
    //set it blindly to the first model from the parent specified from the
    //parent component.
      if(!this.state.activeId || (this.props.modelIds === nextProps.modelIds))
        this.setState({activeId:nextProps.modelIds[0]});
      if(nextProps.modelIds.length === 0){
        this.setState({activeId:null});
      }
  },

  componentDidMount : function(){
    ModelRunStore.addChangeListener(this._onChange);
    TripTableStore.addChangeListener(this._onChange);
  },

  componentWillUnmount : function(){
    ModelRunStore.removeChangeListener(this._onChange);
    TripTableStore.removeChangeListener(this._onChange);
  },

  
  _setActiveModel : function(id){
    this.setState({activeId:id});
  },

  renderExtraInfo : function(){

  },
  renderSummary : function(id){
    // console.log('model runs',this.state.model_runs);
    if(!this.state.model_runs)
      return <span ></span>;
    if(this.props.modelIds.length === 0)
      return <span></span>;
    var currentModel = this.state.model_runs[id];
    // console.log('triptable',this.state.trip_table);
    // console.log('tripsettings',this.state.model_settings);
    //{currentModel.trips.length}
    return (
      <div>
        <h4>Model Info</h4>
        <table className="table table-hover">
            <tbody><tr>
                <td>Model Type</td>
                <td className="ng-binding">{currentModel.info.type}</td>
            </tr>
            <tr>
                <td>Model Time</td>
                <td className="ng-binding">{currentModel.info.time}</td>
            </tr>
            <tr>
                <td>Forecast</td>
                <td className="ng-binding">{currentModel.info.forecast}</td>
            </tr>
            <tr>
              <td># Trips</td>
              <td className="ng-binding"></td>
            </tr>
           <tr>
             <td>Data</td>
             <td><ul>
               {Object.keys(currentModel.info.datasources).map(function(d){
                 return (<li >{currentModel.info.datasources[d]}</li>);
               })}
             </ul></td>
           </tr>
           {this.renderExtraInfo()}
        </tbody></table>
      </div>
    );
  },
  _variableSummary : function(id){
    if( !this.state.model_runs[id] || !this.state.model_runs[id].info.regressionId )
      return <span></span>;
    var regression = this.state.model_runs[id].info.regressionId;
    var modelName = regression.name;
    var censusVars= regression.censusVariables;
    censusVars = censusVars.map(function(cv){
      return (<tr><td style={{padding:'5px'}}>{cv.name}</td><td style={{padding:'5px'}}>{cv.coef}</td></tr>);
    });
    return (
      <div>
        <h4>{modelName}</h4>
        <table>
          <thead>
            <tr><th>Variable</th><th>Value</th></tr>
          </thead>
          <tbody>
            {censusVars}
          </tbody>
        </table>
      </div>
    );
  },
  render : function(){
    var scope = this;
    var headers = this.props.modelIds.map(function(d,i){
      var active = '';
      if(scope.state.activeId){
        active = (i===scope.state.activeId)?'active':'';
      }else{
        active = (i===0)?'active':'';
      }
      return (<li className={active} value={'model_' + d} onClick={scope._setActiveModel.bind(null,d)}>
              <a href={'#model_'+d} data-toggle='tab' value={''+d}>{d}</a>
              </li>);
    });
    var footers = this.props.modelIds.map(function(d){
      return (<div id={'model_'+d} className='tab-pane clearfix'>
        {d}
      </div>);
    });
    // console.log('State',this.state);
    var id = this.state.activeId || this.props.modelIds[0];
    return  (
      <div>
      <section className="widget">
          <div className="body no-margin">
            <div className='row'>
                      <div className='col-lg-12'>
                        <header>
                          <ul className='nav nav-tabs' >
                            {headers}
                          </ul>
                        </header>
                      </div>
                      {this.renderSummary(id)}
            </div>
          </div>
        </section>
        <section className='widget'>
            {this._variableSummary(id)}
        </section>
      </div>
    );
  },
});

module.exports = ModelSummary;
