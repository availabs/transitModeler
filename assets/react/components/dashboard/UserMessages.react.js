/*globals require,module,console*/
'use strict';
var React = require('react'),
    UserStore  = require('../../stores/UserStore'),
    UserActionsCreator = require('../../actions/UserActionsCreator'),
    SailsWebApi=require('../../utils/sailsWebApi');

var reg = /:\d\d /;
var tFormat = function(date){
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};
var JobHistory = React.createClass({
  getInitialState : function(){
    return {
        messages : UserStore.getUserActions(),
    };
  },
  componentDidMount : function(){
    UserStore.addChangeListener(this.onChange);
  },
  componentWillUnmount : function(){
    UserStore.removeChangeListener(this.onChange);
  },
  onChange : function(){
    this.setState({messages:UserStore.getUserActions()});
  },
  formMessages : function(){
    var rows = this.state.messages.map(function(d){
        return (
          <section className='feed-item'>
          <div className='feed-item-body' style={{margin:5}}>
            <div className='row' style={{fontSize:'12',fontWeight:'bold'}}>{d.user.username}</div>
            <div className='row text'>{'Action : '+d.actiontitle}</div>
            <div className='row text'>{'Description : '+d.actiondesc}</div>
            <div className='row time pull-left'>{(new Date(d.createdAt)).toString()}</div>
          </div>
          </section>
        );
    });
    return (
      <div className='row'>
        <div className='col-lg-1'></div>
        <div className='col-lg-11'>
            {rows}
        </div>
      </div>
    );
  },
  render : function(){
    console.log(this.state.messages);
    return (
          <section className="widget large">
            <header>
              <h4>{'Action Feed'}</h4>
            </header>
            <div className='body'>
              <div className='slimScrollDiv'  style={{position:"relative",overflowX:'hidden', overflowY:'hidden',width:'auto',height:'280px'}}>
                <div id='feed' className='feed' style={{overflowX:'hidden',overflowY:'scroll',width:'auto',height:'280px'}}>
                  <div className='wrapper'>
                    {this.formMessages()}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
  },
});
module.exports=JobHistory;
