/*globals console,require,module*/

'use strict'
/**
 * Survey Store
 *
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,

    assign = require('object-assign'),

    ActionTypes = Constants.ActionTypes,
    CHANGE_EVENT = 'change',
    SailsWebApi = require('../utils/sailsWebApi'),


    //--Store Globals--------------------
    mailbox = {};

/*simple mail type system for messages between components*/
/*messages are immediately deleted after reading*/
var ComponentMailStore = assign({}, EventEmitter.prototype, {

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

  sendMail : function(id,subj,data){
    mailbox[id] = {subject:subj,data:data};
  },
  getMail : function(id){
    var data = mailbox[id];
    mailbox[id] = {};
    return data;
  },

});

ComponentMailStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  //console.log('action happening',action);

  switch(action.type) {

    case ActionTypes.SEND_MAIL:
      ComponentMailStore.sendMail(action.id, action.subject, action.data);
      ComponentMailStore.emitChange();
    break;

    default:
      // do nothing
  }

});

module.exports = ComponentMailStore;
