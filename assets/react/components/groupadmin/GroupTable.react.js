'use strict';

var React = require('react'),

    GroupAdminActions = require('../../actions/GroupAdminActions');

var GroupRow = React.createClass({

    handleDeleteClick: function() {
        var modal = $("#deleteModal");
        modal.find('.modal-body h4')
            .text("Are you sure you want to delete "+this.props.group.name+"?");
        modal.data(this.props.group)
            .modal();
    },

    handleEditClick: function() {
        GroupAdminActions.setEditTarget(this.props.group);
    },

    render: function() {
        return (
            <tr onClick={ this.handleClick } className={ this.props.classString } >
                <td>{ this.props.group.name }</td>
                <td>{ this.props.group.displayName }</td>
                <td>{ this.props.group.type }</td>
                <td>
                    <button onClick={ this.handleEditClick } data-group={ this.props.group } className="btn btn-xs btn-primary">
                        Update
                    </button>
                </td>
                <td>
                    <button onClick={ this.handleDeleteClick } data-group={ this.props.group } className="btn btn-xs btn-danger">
                        Delete
                    </button>
                </td>
            </tr>
        )
    }
})

module.exports = React.createClass({

    deleteGroup: function() {
        GroupAdminActions.deleteGroup($("#deleteModal").data());
    },

    render: function() {
        var rows = this.props.groups.map(function(group, i) {
            return (
                <GroupRow key={ i } group={ group } />
            )
        }, this);

        return (
            <div className="widget panel panel-default">
                <table className="table table-striped table-hover">

                    <thead>
                        <tr>
                            <th>Group Name</th>
                            <th>Display Name</th>
                            <th>Group Type</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        { rows }
                    </tbody>

                    <div id="deleteModal" className="modal fade" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">

                                <div className="modal-header">
                                    <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                                    <h4 className="modal-title" id="myModalLabel2">Delete Group</h4>
                                </div>

                                <div className="modal-body">
                                    <h4>Are you sure you want to delete?</h4>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-primary" data-dismiss="modal">Cancel</button>
                                    <button type="button" className="btn btn-danger" onClick={ this.deleteGroup } data-dismiss="modal">Delete</button>
                                </div>

                            </div>
                        </div>
                    </div>

                </table>
            </div>
        )
    }
})
