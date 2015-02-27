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
        
        var vars = this.props.regression.censusVariables.map(function(v){
            return (
                <div>
                <span> {v.coef} * {v.name}</span><br/>
                </div>
            )
        })
        var ma = '';
        if(this.props.regression.marketarea){
            ma =  this.props.marketareas[this.props.regression.marketarea].name;
        }
        return (
        
            <tr>
                <td>{this.props.regression.name}</td>
                <td>{ma}</td>
                <td></td>
                <td>{vars}</td>
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
                <RegressionRow key={key} regression={regressions[key]} marketareas={scope.props.marketareas}  />
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

    _deleteReg:function(e){
        
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
                            <h4>Are you sure you want to delete this regression?</h4>     
                        </div>
                        
                        <div className="modal-footer">
                           <br />
                            <button type="button" className="btn btn-danger" data-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-info" onClick={this._deleteReg} data-dismiss="modal">Delete</button>
                        </div>

                    </div>
                </div>
            </div>
        )
    }
});

module.exports = RegressionTable;