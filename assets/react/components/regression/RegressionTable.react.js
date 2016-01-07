'use strict';
var React = require('react'),

    // -- Components

    // -- actions
    UserActionsCreator = require('../../actions/UserActionsCreator');

var RegressionRow = React.createClass({



    render: function(){

        var vars = this.props.regression.censusVariables.map(function(v){
            return (
                <div>
                <span> {v.coef} * {v.name}</span><br/>
                </div>
            )
        });

        var ma = '';
        if(this.props.regression.marketarea && this.props.marketareas[this.props.regression.marketarea]){
            ma =  this.props.marketareas[this.props.regression.marketarea].name;
        }

        return (

            <tr>
                <td>{this.props.regression.name}</td>
                <td>{ma}</td>
                <td>{this.props.regression.constant}</td>
                <td>{vars}</td>
                <td>
                    <a onClick={this.props.setRegression.bind(null,this.props.regression.id) } data-toggle="modal" data-target="#deleteModal" data-backdrop="false" className="btn btn-sm btn-danger">
                        Delete
                    </a>
                </td>
            </tr>
        )

    }

});


var RegressionTable = React.createClass({
    getInitialState:function (){
        return {
            currentRegression:null
        }
    },

    setRegression:function(id){
        this.setState({currentRegression:id})
    },

    render: function(){


        var scope = this,
            regressions = this.props.regressions;


        var rows = Object.keys(regressions).map(function(key){

            return (
                <RegressionRow key={key} regression={regressions[key]} marketareas={scope.props.marketareas} setRegression={scope.setRegression} />
            )
        });

        var deleteModal = this.deleteModal();
        return (
            <div>
                <table className="table table-hover">
                    <thead><tr>
                        <th>Name</th>
                        <th>Market Area </th>
                        <th>Constant</th>

                        <th>Vars</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
                {deleteModal}
            </div>
        )
    },

    _deleteReg:function(id){
       //console.log(e)
       UserActionsCreator.deleteRegression(id)
    },

    deleteModal:function(){
        return (
            <div id="deleteModal" className="modal fade" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">

                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            <h4 className="modal-title" id="myModalLabel2">Delete Model</h4>
                        </div>
                        <div className="modal-body">
                            <h4>Are you sure you want to delete regression {this.props.regressions[this.state.currentRegression] ? this.props.regressions[this.state.currentRegression].name : 'none' }?</h4>
                        </div>

                        <div className="modal-footer">
                           <br />
                            <button type="button" className="btn btn-danger" data-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-info" onClick={this._deleteReg.bind(null,this.props.regressions[this.state.currentRegression] ? this.props.regressions[this.state.currentRegression].id : null)} data-dismiss="modal">Delete</button>
                        </div>

                    </div>
                </div>
            </div>
        )
    }
});

module.exports = RegressionTable;
