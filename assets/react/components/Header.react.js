var React = require('react'),
    Link = require('react-router').Link,

    // -- Stores
    UserStore = require('../stores/UserStore');

var Message = React.createClass({
    render:function(){
        return (
            <li role="presentation">
                <a href="#" className="message">
                    <img src={this.props.data.sender.img} alt="" />
                    <div className="details">
                        <div className="sender">{this.props.data.sender.name}</div>
                        <div className="text">
                            {this.props.data.text}
                        </div>
                    </div>
                </a>
            </li>
        )
    }
})

var MessagesMenu = React.createClass({
    getInitialState: function() {
      return {
        messages: [{sender:{name:'Alex Muro',img:''},text:'Hey, John! How is it going? ...'}],
      };
    },
    render: function(){
        var messages = this.state.messages.map(function(message){
            return (
                <Message data={message} />
            );
        });

        return (
             <li className="dropdown">
                <a href="#" title="Messages" id="messages" className="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                    <i className="fa fa-comments"></i>
                </a>
                <ul id="messages-menu" className="dropdown-menu messages" role="menu">
                    {messages}
                    <li role="presentation">
                        <a href="#" className="text-align-center see-all">
                            See all messages <i className="fa fa-arrow-right"></i>
                        </a>
                    </li>
                </ul>
            </li>
        )
    }
});

var MenuSearch = React.createClass({
    render:function(){
        return (
            <li className="visible-phone-landscape">
                <a href="#" id="search-toggle">
                    <i class="fa fa-search"></i>
                </a>
            </li>
        )
    }
})

function getSessionUserfromStore(){
    return {
        sessionUser: UserStore.getSessionUser(),
    }
};

var Header = React.createClass({
    getInitialState: function() {
        return getSessionUserfromStore();
    },

    componentDidMount: function() {
        UserStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        UserStore.removeChangeListener(this._onChange);
    },
    _onChange :function(){
        this.setState(getSessionUserfromStore());
    },
    render: function() {
        var userAdminLinks = '',groupAdminLinks = '';
        if(this.state.sessionUser.admin){
            userAdminLinks = <li role="presentation"><Link to="userAdmin"><i className="fa fa-users"></i>User Admin</Link></li>;
        }
        if(this.state.sessionUser.admin && this.state.sessionUser.userGroup.type ==='sysAdmin'){
          groupAdminLinks = <li role='presentation'><Link to='groupAdmin'><i className='fa fa-users'></i>Group Admin</Link></li>;
        }
        console.log('session user',this.state.sessionUser);
        return (
            <header className="page-header">
                <div className="navbar">
                    <ul className="nav navbar-nav">
                        <li><h2 className='page-title' style={{marginTop:5}}>{this.props.marketarea ? this.props.marketarea.name : ''}</h2></li>
                    </ul>
                    <ul className="nav navbar-nav navbar-right pull-right">

                        <li className="hidden-xs dropdown">
                            <a href="#" title="Account" id="account" className="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                <i className="fa fa-user"></i>
                            </a>
                            <ul id="account-menu" className="dropdown-menu account" role="menu">
                                <li role="presentation" className="account-picture">

                                    {this.state.sessionUser.name}
                                </li>
                                <li role="presentation">
                                    <a href="" className="link">
                                            <i className="fa fa-user"></i>
                                            Profile

                                    </a>
                                </li>
                                {userAdminLinks}
                                {groupAdminLinks}
                            </ul>
                        </li>
                        <li className="visible-xs">
                            <a href="#" className="btn-navbar" data-toggle="collapse" data-target=".sidebar" title="">
                                <i className="fa fa-bars"></i>
                            </a>
                        </li>
                        <li className="hidden-xs"><a href="/logout"><i className="fa fa-sign-out"></i></a></li>
                    </ul>
                </div>
            </header>
        );
    }
});

module.exports = Header;
