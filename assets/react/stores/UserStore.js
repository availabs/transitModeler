/*global require,module,console*/
'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    UserConstants = require('../constants/AppConstants').ActionTypes,
    SailsWebApi   = require('../utils/sailsWebApi'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),

    CHANGE_EVENT = 'change';

var USERS = [],
    USERGROUPS={},
    SESSION_USER = {},
    _userActions = [],
    _actionsLoading = false,
    EDIT_TARGET = null;

function requireActions(){
  SailsWebApi.read({type:'useraction',options:{sort:'createdAt%20DESC',limit:'100'}});
}

function assignActions(actions){
  var _users = {};
  USERS.forEach(function(d){
    _users[d.id] = d;
  });
  actions.forEach(function(d){
    d.user = _users[d.userid];
  });
}
function buildGroups(){
    console.log('USERS',USERS);
    USERS.forEach(function(d){
      USERGROUPS[d.group] = USERGROUPS[d.group] || [];
      USERGROUPS[d.group][d.id]  =  d;
    });
}

var UserStore = assign({}, EventEmitter.prototype, {

    emitChange: function() {
        this.emit(CHANGE_EVENT);
    },
    addChangeListener: function(callback) {
        this.on(CHANGE_EVENT, callback);
    },
    removeChangeListener: function(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    getUser: function(id) {
        return USERS[id];
    },
    getAllUsers: function() {
        return USERS;
    },
    getSessionUser:function() {
        return SESSION_USER;
    },
    getEditTarget: function() {
        return EDIT_TARGET;
    },
    getUserActions : function(){
      if(_userActions.length === 0){
        requireActions();
        _actionsLoading = true;
        return [];
      }else{
        return _userActions;
      }
    },
    getCurrentGroupUsers : function(){
      if(!USERGROUPS[SESSION_USER.group])
      {
        return [];
      }
      return Object.keys(USERGROUPS[SESSION_USER.group])
            .map(function(d){return USERGROUPS[SESSION_USER.group][d];});
    },
});

UserStore.dispatchToken = AppDispatcher.register(function(payload) {
    var action = payload.action;
    switch(action.type) {

    case UserConstants.SET_SESSION_USER:
        SESSION_USER = action.user;
        UserStore.emitChange();
        break;

    case UserConstants.RECEIVE_USERS:
        USERS = action.users;
        buildGroups();
        UserStore.emitChange();
        break;

    case UserConstants.SET_EDIT_TARGET:
        EDIT_TARGET = action.user;
        UserStore.emitChange();
        break;

    case UserConstants.DELETE_USER:
        USERS = USERS.filter(function(d) { return d.id != action.user.id; });
        EDIT_TARGET = null;
        UserStore.emitChange();
        break;

    case UserConstants.CREATE_USER:
        USERS.push(action.user);
        EDIT_TARGET = null;
        UserStore.emitChange();
        break;

    case UserConstants.UPDATE_USER:
        USERS = USERS.filter(function(d) { return d.id != action.user.id; });
        USERS.push(action.user);
        EDIT_TARGET = action.user;
        UserStore.emitChange();
        break;

    case UserConstants.USER_ACTION:
      console.log('Attempted USER AcTion',action.data);
      if(action.data.id)
        SailsWebApi.update('useraction',action.data,function(){
          requireActions();
        });
      else {
        SailsWebApi.create('useraction',action.data,function(){
          requireActions();
        });
      }
      break;

    case UserConstants.RECEIVE_USERACTIONS:
      console.log('received user actions from server',action.data);
      _userActions = action.data;
      assignActions(_userActions);
      _actionsLoading = false;
      UserStore.emitChange();
      break;
  }

});

module.exports = UserStore;
