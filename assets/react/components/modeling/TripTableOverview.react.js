'use strict';
var React = require('react'),

    // -- Actions
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator');

var TripTableOverview = React.createClass({


    _loadNewTripTable:function(){
        var settings = this.props.currentSettings;
        settings.marketarea = {id:this.props.marketarea.id,zones:this.props.marketarea.zones,routes:this.props.marketarea.routes};
        ModelingActionsCreator.loadTripTable(settings)
    },

    _runModel:function(){
        var settings = this.props.currentSettings;
        settings.marketarea = {id:this.props.marketarea.id,name:this.props.marketarea.name,zones:this.props.marketarea.zones,routes:this.props.marketarea.routes};
        var tripTableCreate  = {
            info:JSON.stringify(settings),
            marketareaId: this.props.marketarea.id
        };
        console.log('Run Model',tripTableCreate);
        
        ModelingActionsCreator.runModel(tripTableCreate);
    },

    render: function() {
        var scope = this;

        var buttonStyle = {
            marginTop:'-10px',
            marginLeft:'5px'
        }

        return (
            <div className="body">
                Trips Planned:{this.props.currentTripTable.tt.length}
                
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

    renderRunModal:function(){
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
                                    <td className="ng-binding">{this.props.currentTripTable.tt.length}</td>
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
        )
    }
});

module.exports = TripTableOverview;

