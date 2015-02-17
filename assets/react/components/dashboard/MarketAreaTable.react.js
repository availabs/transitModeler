'use strict';
var React = require('react'),
    Link = require('react-router').Link,
    // -- Components 
    
    // -- Action Creators
    MarketAreaStore = require('../../stores/MarketAreaStore');

var MarketAreaRow = React.createClass({
    
     _onClick: function(id){
        //console.log('clicked');
    },

    render: function(){

        return (
            
            <tr>
                <td><Link to="MarketAreaIndex" params={{marketareaID:this.props.marketarea.id}}>{this.props.marketarea.name}</Link></td>
                <td>{this.props.marketarea.routes ? this.props.marketarea.routes.length : 0}</td>
                <td>{this.props.marketarea.zones ? this.props.marketarea.zones.length : 0}</td>
                <td>
                    <a className="btn btn-sm btn-warning">
                        Edit
                    </a>
                </td> 
                <td>
                    <a data-toggle="modal" data-target="#deleteModal" data-backdrop="false" className="btn btn-sm btn-danger">
                        Delete
                    </a>
                </td>
            </tr>
        )
        
    }
    
})

function getStatefromStore(){
    return {
        marketareas: MarketAreaStore.getAll()
    }
}
var MarketAreaTable = React.createClass({
    
    
    getInitialState: function(){
       return getStatefromStore()
    },

    componentDidMount: function() {
        MarketAreaStore.addChangeListener(this._onChange);
        
    },

    componentWillUnmount: function() {
        MarketAreaStore.removeChangeListener(this._onChange);
    },

    _onChange:function(){
        this.setState(getStatefromStore());
    },
    _deleteUser : function(){
        UserActionsCreator.deleteUser(this.props.editUser);
    },
    render: function(){
        var scope = this;
        
        var rows = Object.keys(this.state.marketareas).map(function(key){
            var marketarea = scope.state.marketareas[key];
            return (
                <MarketAreaRow key={marketarea.id} marketarea={marketarea}  />
            )
        });
        ///var deleteModal = this.deleteModal();
        return (
            <div>
                <table className="table table-hover">
                    <thead><tr>
                        <th>Name</th>
                        <th># of Routes</th>
                        <th># of Zones</th>
                        <th></th>
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

module.exports = MarketAreaTable;