/*globals require,console,module*/
'use strict';
var React = require('react'),

    DescriptionArea = require('../../components/utils/DescriptionArea.react'),
    // -- Actions
    UserActionsCreator     = require('../../actions/UserActionsCreator'),
    UserStore              = require('../../stores/UserStore'),
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator');

var TripTableOverview = React.createClass({

    getInitialState : function(){
      return {
        model_name: '',
        model_description:'',
      };
    },
    _loadNewTripTable:function(){
        var scope = this;
        var settings = {};
        Object.keys(scope.props.currentSettings).forEach(function(d){
          settings[d] = scope.props.currentSettings[d];
        });
        settings.tract_forecasts = this.props.tractData;
        settings.marketarea = {id:this.props.marketarea.id,zones:this.props.marketarea.zones,routes:this.props.marketarea.routes};
        console.log('--------------------------')
        console.log('Load New Triptable',settings);
        console.log('--------------------------')
        ModelingActionsCreator.loadTripTable(settings);
    },

    _runModel:function(){
        var settings = this.props.currentSettings;
        settings.tract_forecasts = this.props.tractData;
        settings.marketarea = {id:this.props.marketarea.id,name:this.props.marketarea.name,zones:this.props.marketarea.zones,routes:this.props.marketarea.routes};
        var tripTableCreate  = {
            info:JSON.stringify(settings),
            name:this.state.model_name,
            description:this.state.model_description,
            marketareaId: this.props.marketarea.id
        };
        console.log('--------------------------')
        console.log('Run Model',tripTableCreate);
        console.log('--------------------------')
        var message = {
          actiondesc:this.state.model_description,
          actiontitle:'Creating New Model '+this.state.model_name,
          maid: this.props.marketarea.id,
          userid: UserStore.getSessionUser().id,
        };
        UserActionsCreator.userAction(message);

        ModelingActionsCreator.runModel(tripTableCreate);
    },

    render: function() {
        var scope = this;

        var buttonStyle = {
            marginTop:'-10px',
            marginLeft:'5px'
        };

        return (
            <div className="body">
                Trips Planned:{this.props.currentTripTable && this.props.currentTripTable.tt  ? this.props.currentTripTable.tt.length : 0}

                <button type="submit"
                    className="btn btn-danger pull-right"
                    data-toggle="modal"
                    data-target="#runModal"
                    data-backdrop="false"
                    style={buttonStyle}>
                        Run Model
                </button>

                <button
                    className="btn btn-primary pull-right"
                    onClick={scope._loadNewTripTable}
                    style={buttonStyle} >
                        Generate Trip Table
                </button>

                {scope.renderRunModal()}
            </div>
        );
    },
    _onNameChange : function(text){
      this.setState({model_name:text});
    },
    _onDescChange : function(text){
      this.setState({model_description:text});
    },
    renderRunModal:function(){
      var scope = this;
        return (
            <div id="runModal" className="modal fade in" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="false">
                <div className="modal-dialog">
                    <div className="modal-content">

                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            <h4 className="modal-title" id="myModalLabel2">Run Model</h4>
                        </div>
                        <div className="modal-body">
                            <h4>Model Info</h4>
                            <table className="table table-hover">

                                <tbody><tr>
                                    <td>Model Type</td>
                                    <td className="ng-binding">{this.props.currentSettings.type}</td>
                                </tr>
                                <tr>
                                    <td>Model Time</td>
                                    <td className="ng-binding">{this.props.currentSettings.time}</td>
                                </tr>
                                <tr>
                                    <td>Forcast</td>
                                    <td className="ng-binding">{this.props.currentSettings.forecast}</td>
                                </tr>
                                 <tr>
                                    <td>Number of Trips</td>
                                    <td className="ng-binding">{this.props.currentTripTable && this.props.currentTripTable.tt ? this.props.currentTripTable.tt.length : 0}</td>
                                </tr>
                                <tr>
                                    <td>Model Name</td>
                                    <td>
                                      <DescriptionArea
                                        text={scope.state.model_name}
                                        onChange={scope._onNameChange}
                                        type={'input'}
                                      />
                                      </td>
                                </tr>
                                <tr>
                                    <td>Description</td>
                                    <td>
                                      <DescriptionArea
                                        text={scope.state.model_description}
                                        onChange={scope._onDescChange}
                                      />
                                    </td>
                                </tr>
                            </tbody></table>

                        </div>
                        <div className="modal-footer ng-binding">

                            <button type="button" className="btn btn-danger" data-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-info" data-dismiss="modal" onClick={this._runModel} >Run Model</button>
                        </div>

                    </div>
                </div>
            </div>
        );
    }
});

module.exports = TripTableOverview;
