'use strict'

var React = require("react"),

    GroupTable = require("../../components/groupadmin/GroupTable.react"),
    GroupForm = require("../../components/groupadmin/GroupForm.react"),

    GroupAdminStore = require("../../stores/GroupAdminStore"),

    GroupAdminActions = require("../../actions/GroupAdminActions");

function getState() {
    return {
        groups: GroupAdminStore.getAllGroups(),
        editTarget: GroupAdminStore.getEditTarget()
    };
}

module.exports = React.createClass({

    getInitialState: function() {
        return getState();
    },

    componentDidMount: function() {
        GroupAdminStore.addChangeListener(this.onChange);

        if (!GroupAdminStore.getAllGroups().length) {
            GroupAdminActions.getAllGroups();
        }
    },
    componentWillUnmount: function() {
        GroupAdminStore.removeChangeListener(this.onChange);
    },

    onChange: function() {
        this.setState(getState());
    },

    render: function() {
        return (
            <div >

                <div className="col-lg-10">
                    <GroupTable groups={ this.state.groups }/>
                </div>
                <div className="col-lg-2">
                    <GroupForm groups={ this.state.groups }
                        editTarget={ this.state.editTarget } />
                </div>

            </div>
        );
    }
});
