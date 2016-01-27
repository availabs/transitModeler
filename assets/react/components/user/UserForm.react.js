'use strict';

var React = require('react'),
    assign = require("object-assign"),

    UserActions = require("../../actions/UserActions"),

    FormComponents = require("../FormComponents.react"),
    FormGroup = FormComponents.FormGroup,
    InputGroup = FormComponents.InputGroup,
    InlineCheckbox =  FormComponents.InlineCheckbox,
    CheckboxGroup = FormComponents.CheckboxGroup;

var PanelBody = React.createClass({

    getInitialState: function() {
        return {
            userName: null,
            loginName: null,
            email: null,
            group: "default",
            password: null,
            confirmation: null,
            admin: false
        }
    },

    componentWillReceiveProps: function(newProps) {
        if (newProps.mode == "update" && newProps.editTarget) {
            this.setState({
                userName: newProps.editTarget.userName,
                loginName: newProps.editTarget.loginName,
                email: newProps.editTarget.email,
                group: newProps.editTarget.group,
                admin: newProps.editTarget.admin,
            })
        }
        else if (newProps.mode == "create") {
            this.setState(this.getInitialState());
        }
    },

    handleSubmit: function(e) {
        e.preventDefault();

        if ($("#group").val() == "default") {
            alert("You must select a user group!");
            $("#group").focus();
            return;
        }

        if (this.props.mode == 'create') {
            var user = {
                name: this.state.userName,
                username: this.state.loginName,
                email: this.state.email,
                group: this.state.group || $("#group").val(),
                admin: this.state.admin,
                password: this.state.password,
                confirmation: this.state.confirmation
            }
            UserActions.createUser(user);
        }
        else if (this.props.mode == 'update') {
            var data = {
                name: this.state.userName,
                username: this.state.loginName,
                email: this.state.email,
                group: this.state.group || $("#group").val(),
                admin: this.state.admin,
            }
            if (this.state.password) {
                data.password = this.state.password;
            }
            if (this.state.confirmation) {
                data.confirmation = this.state.confirmation;
            }
            var user = assign({}, this.props.editTarget, data);
            UserActions.updateUser(user);
        }
    },
    handleChange: function(e) {
        var state = this.state;

        switch (e.target.name) {
            case "userName":
                state.userName = e.target.value;
                break;
            case "loginName":
                state.loginName = e.target.value;
                break;
            case "email":
                state.email = e.target.value;
                break;
            case "group":
                console.log("CHANGE GROUP")
                state.group = e.target.value;
                break;
            case "password":
                state.password = e.target.value;
                break;
            case "confirmation":
                state.confirmation = e.target.value;
                break;
            case "admin":
                state.admin = e.target.checked;
                break;
        }

        this.setState(state);
    },

    render: function() {
        var userName = this.state.userName,
            loginName = this.state.loginName,
            email = this.state.email,
            group = this.state.group,
            admin = this.state.mode == "create" ? null : this.state.admin,
            password = this.state.password,
            confirmation = this.state.confirmation,
            submitText = this.props.mode === "create" ? "Create User" : "Update User",
            userGroups = this.props.groups;

        var groups = userGroups.map(function(d, i) {
            return <option key={ i } value={ d.value } style={ i==0 ? d.style : null }>{ d.display }</option>;
        }, this);

        var groupDisabled = null;
        if (this.props.user && this.props.user.userGroup.type == "mpo") {
            groupDisabled = "disabled";
            group = this.props.user.userGroup.name;
        }

        return (
            <form onSubmit={ this.handleSubmit }>
                <div className="panel-body">

                    <FormGroup>
                        <InputGroup icon="fa fa-user">
                            <input className="form-control" type="text" name='userName'
                                placeholder={ "user name" } value={ userName }
                                onChange={ this.handleChange } required="required"
                                id="userName"/>
                        </InputGroup>
                    </FormGroup>

                    <FormGroup>
                        <InputGroup icon="fa fa-sign-in">
                            <input className="form-control" type="text" name='loginName'
                                placeholder={ "sign in name" } value={ loginName }
                                onChange={ this.handleChange } required="required"
                                id="loginName"/>
                        </InputGroup>
                    </FormGroup>

                    <FormGroup>
                        <InputGroup icon="fa fa-envelope">
                            <input className="form-control" type="email" name="email"
                                placeholder={ "email" } value={ email }
                                onChange={ this.handleChange } required="required"
                                id="email"/>
                        </InputGroup>
                    </FormGroup>

                    <FormGroup>
                        <InputGroup icon="fa fa-users">
                            <select className="form-control" name="group"
                                id="group" value={ group }
                                onChange={ this.handleChange }
                                disabled={ groupDisabled }>
                                { groups }
                            </select>
                        </InputGroup>
                    </FormGroup>

                    <FormGroup>
                        <InlineCheckbox label="Administrator Privileges">
                            <input type="checkbox" name="admin" onChange={ this.handleChange }
                                id="admin" checked={ admin }/>
                        </InlineCheckbox>
                    </FormGroup>


                    <FormGroup>
                        <InputGroup icon="fa fa-lock">
                            <input className="form-control" type="password" name="password"
                                placeholder={ "password" } onChange={ this.handleChange } id="password"
                                value={ password }
                                required={ this.props.mode == "create" ? "required" : null }/>
                        </InputGroup>
                    </FormGroup>


                    <FormGroup>
                        <InputGroup icon="fa fa-check">
                            <input className="form-control" type="password" name="confirmation"
                                placeholder={ "confirm password" } onChange={ this.handleChange }
                                value={ confirmation }
                                required={ this.props.mode == "create" ? "required" : null }/>
                        </InputGroup>
                    </FormGroup>
                </div>

                <div className="panel-footer">
                    <input type='submit' className="btn btn-primary btn-block" value={ submitText }/>
                </div>

            </form>
        )
    }
})

var PanelHeading = React.createClass({

    createMode: function() {
        this.props.clickHandler("create");
    },
    editMode: function() {
        this.props.clickHandler("update");
    },

    render: function() {
        var createButtonClass = this.props.mode === "create" ? "btn btn-success" : "btn btn-danger";

        if (this.props.mode === "update" && this.props.editTarget) {
            var editButtonClass = "btn btn-success";
        }
        else if (this.props.mode === "create" && this.props.editTarget) {
            var editButtonClass = "btn btn-danger";
        }
        else {
            var editButtonClass = "btn";
        }
        var disabled = this.props.editTarget ? "" : "disabled";

        var block = { display: "block", width: "100%" };
        var width50 = { width: "50%", display: "block" }
        return (
            <div className="panel-heading clearfix">
                <div style={block}className="btn-group">
                    <button style={width50}className={ createButtonClass } onClick={ this.createMode }>Create</button>
                    <button style={width50}className={ editButtonClass } disabled={ disabled } onClick={ this.editMode }>Update</button>
                </div>
            </div>
        )
    }
})

module.exports = React.createClass({

    getInitialState: function() {
        return { mode: "create" };
    },

    componentWillReceiveProps: function(newProps) {
        if (newProps.editTarget && this.state.mode == "create") {
            this.setState({ mode: "update" })
        }
    },

    handleClick: function(mode) {
        if (mode != this.state.mode) {
            this.setState({ mode: mode });
        }
    },

    render: function() {
        var target = this.state.mode === "update" ? this.props.editTarget : null;

        return (
            <div className="widget panel panel-primary">

                <PanelHeading mode={ this.state.mode } editTarget={ this.props.editTarget }
                    clickHandler={ this.handleClick }/>

                <PanelBody mode={ this.state.mode } editTarget={ target }
                    users={ this.props.users } user={ this.props.user }
                    groups={ this.props.groups }/>

            </div>
        )
    }
})
