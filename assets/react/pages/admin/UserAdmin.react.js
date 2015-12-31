/*globals require,module*/
'use strict';

var React = require('react'),

    UserTable = require('../../components/user/UserTable.react'),
    UserForm = require('../../components/user/UserForm.react'),

    GroupAdminStore = require("../../stores/GroupAdminStore"),
    UserStore = require('../../stores/UserStore'),

    UserActions = require('../../actions/UserActions');

function getState() {
    var groups = [{ value: "default", display: "user group", style: { display: "none"} }];
    return {
        user: UserStore.getSessionUser(),
        users: UserStore.getAllUsers(),
        editTarget: UserStore.getEditTarget(),
        groups: groups.concat(GroupAdminStore.getAllGroups().map(function(d) {
            return { value: d.name, display: d.name };
        }))
    };
}

module.exports = React.createClass({

    getInitialState: function() {
        return getState();
    },

    componentDidMount: function() {
        GroupAdminStore.addChangeListener(this.onChange);
        UserStore.addChangeListener(this.onChange);

        UserActions.getAllUsers();
    },
    componentWillUnmount: function() {
        GroupAdminStore.removeChangeListener(this.onChange);
        UserStore.removeChangeListener(this.onChange);
    },

    onChange: function() {
        this.setState(getState());
    },

    render: function() {
        return (
            <div>

                <div className="col-lg-10">
                    <UserTable users={ this.state.users }/>
                </div>
                <div className="col-lg-2">
                    <UserForm users={ this.state.users } user={ this.state.user }
                        editTarget={ this.state.editTarget } groups={ this.state.groups }/>
                </div>

            </div>
        );
    }
});
