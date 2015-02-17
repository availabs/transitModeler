'use strict';
var React = require('react');
    
    // -- Components 
    
    // -- Action Creators
    

var RegressionRow = React.createClass({
    
    //  _onClick: function(id){
    //     UserActionsCreator.selectUser(this.props.user.id);
    //     //console.log('clicked');
    // },

    render: function(){
        return (
        
            <tr>
                <td>{this.props.regression.name}</td>
                <td>
                    <a data-toggle="modal" data-target="#deleteModal" data-backdrop="false" className="btn btn-sm btn-danger">
                        Delete
                    </a>
                </td>
            </tr>
        )
        
    }
    
})


var RegressionTable = React.createClass({
    
    
    render: function(){

        var scope = this,
            regressions = this.props.regressions;
           
        
        var rows = Object.keys(regressions).map(function(key){
            
            return (
                <RegressionRow key={key} regression={regressions[key]}  />
            )
        });

        //var deleteModal = this.deleteModal();
        return (
            <div>
                <table className="table table-hover">
                    <thead><tr>
                        <th>Name</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        )
    },
    deleteModal:function(){
        var username = this.props.users[this.props.editUser] ? this.props.users[this.props.editUser].name : '';
        return (
            <div id="deleteModal" className="modal fade" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">

                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            <h4 className="modal-title" id="myModalLabel2">Delete User</h4>
                        </div>
                        <div className="modal-body">
                            <h4>Are you sure you want to delete {username}?</h4>     
                        </div>
                        
                        <div className="modal-footer">
                           <br />
                            <button type="button" className="btn btn-danger" data-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-info" onClick={this._deleteUser} data-dismiss="modal">Delete</button>
                        </div>

                    </div>
                </div>
            </div>
        )
    }
});

module.exports = RegressionTable;