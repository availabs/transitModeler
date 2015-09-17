/*globals require,console,module,d3,$*/
'use strict'
var React = require('react'),
    ModelRunStore = require('../../stores/ModelRunStore'),
    TripTableStore = require('../../stores/TripTableStore');

var ModelSummary = React.createClass({
  getDefaultProps : function(){
    return {
      modelIds:[],
    };
  },
  getInitialState : function(){
    return {
      activeId : null,
      model_runs: null,
      trip_settings:null,
      trip_table:TripTableStore.getCurrentTripTable(),
    };
  },
  _onChange : function(){//when a subscription has been updated
    this.setState({//get the trip tables from the store
      model_runs : ModelRunStore.getModelRuns(),
      trip_settings: TripTableStore.getCurrentSettings(),
      trip_table : TripTableStore.getCurrentTripTable(),
    });
    console.info('update',TripTableStore.getCurrentTripTable());
  },
  componentWillReceiveProps : function(nextProps){
    //if we receive new props and the user hasn't already chosen an id to view
    //set it blindly to the first model from the parent specified from the
    //parent component.
    if(!this.state.activeId && (!this.props.modelIds || this.props.modelIds !== nextProps.modelIds))
      this.setState({activeId:nextProps.modelIds[0]});
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
  renderSummary : function(id){
    if(!this.state.model_runs)
      return <span ></span>;
    if(this.props.modelIds.length === 0)
      return <span></span>;
    var currentSettings = this.state.model_runs[id].info;
    var currentTripTable = this.state.trip_table;
    // console.log('triptable',this.state.trip_table);
    console.log('tripsettings',this.state.trip_settings);
  
    return (
      <div>
        <h4>Model Info</h4>
        <table className="table table-hover">
            <tbody><tr>
                <td>Model Type</td>
                <td className="ng-binding">{currentSettings.type}</td>
            </tr>
            <tr>
                <td>Model Time</td>
                <td className="ng-binding">{currentSettings.time}</td>
            </tr>
            <tr>
                <td>Forcast</td>
                <td className="ng-binding">{currentSettings.forecast}</td>
            </tr>
            <tr>
               <td>Number of Trips</td>
               <td className="ng-binding">{currentTripTable.tt.length}</td>
           </tr>
           <tr>
             <td>Data</td>
             <td><ul>
               {Object.keys(currentSettings.datasources).map(function(d){
                 return (<li >{currentSettings.datasources[d]}</li>);
               })}
             </ul></td>
           </tr>
           <tr>

           </tr>
        </tbody></table>
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

    return  (<div className='row'>
                <div className='col-lg-12'>
                  <header>
                    <ul className='nav nav-tabs' >
                      {headers}
                    </ul>
                  </header>
                </div>
                {this.renderSummary(this.state.activeId || this.props.modelIds[0])}
            </div>);
  }
});

module.exports = ModelSummary;