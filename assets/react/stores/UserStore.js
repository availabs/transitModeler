/*globals require,module,console*/
'use strict';
/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),
    SailsWebApi = require('../utils/sailsWebApi'),
    ActionTypes = Constants.ActionTypes,
    CHANGE_EVENT = 'change';

var _editUserID = null,
    _users = {},
    _userActions = [],
    _actionsLoading = false,
    _sessionUser = {};

function _addUsers(rawData) {
  //console.log('stores/UserStore/_addUsers',rawData);
  rawData.forEach(function(user) {

      _users[user.id] = user;

  });
}

function _deleteUser(id){
  //console.log('stores/userstore/deleteuser',id)
  delete _users[id];
  _editUserID = null;
}

function _setEditUserID(id){
    _editUserID = id;
}

function requireActions(){
  SailsWebApi.read({type:'useraction',options:{sort:'createdAt%20DESC',limit:'100'}});
}

function assignActions(actions){
  actions.forEach(function(d){
    d.user = _users[d.userid];
  });
}

var UserStore = assign({}, EventEmitter.prototype, {

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  /**
   * @param {function} callback
   */

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  get: function(id) {
    return _users[id];
  },

  getAll: function() {
    return _users;
  },

  getEditUserId:function(){
    return _editUserID;
  },
  getSessionUser:function(){
    return _sessionUser;
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
});

UserStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    case ActionTypes.SET_SESSION_USER:
      _sessionUser = action.user;
      UserStore.emitChange();
    break;

    case ActionTypes.RECEIVE_USERS:
      _addUsers(action.data);
      UserStore.emitChange();
    break;

    case ActionTypes.SELECT_USER:
      _setEditUserID(action.userID);
      UserStore.emitChange();
    break;

    case ActionTypes.DELETE_USER:
      _deleteUser(action.Id);
      UserStore.emitChange();
    break;

    case ActionTypes.USER_ACTION:
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

    case ActionTypes.RECEIVE_USERACTIONS:
      console.log('received user actions from server',action.data);
      _userActions = action.data;
      assignActions(_userActions);
      _actionsLoading = false;
      UserStore.emitChange();
    break;

    default:
      // do nothing
  }

});

module.exports = UserStore;
