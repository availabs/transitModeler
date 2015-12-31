/*globals require,module*/
'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    SysAdminConstants = require('../constants/AppConstants').ActionTypes,
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),

    CHANGE_EVENT = 'change';

var MESSAGES = [];

var SysAdminStore = assign({}, EventEmitter.prototype, {

    emitChange: function() {
        this.emit(CHANGE_EVENT);
    },
    addChangeListener: function(callback) {
        this.on(CHANGE_EVENT, callback);
    },
    removeChangeListener: function(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    getMessages: function() {
        return MESSAGES;
    }
});

SysAdminStore.dispatchToken = AppDispatcher.register(function(action) {
    switch(action.type) {

    case SysAdminConstants.RELOAD_ROUTES:
        var errors = action.result.filter(function(d) { return d.status == "failed"; });

        MESSAGES = errors.map(function(d) { return "Failed to reload route " + d.route.name + "."; });

        if (!MESSAGES.length) {
            MESSAGES = ["Successfully reloaded all routes."];
        }
        SysAdminStore.emitChange();
        break;

    case SysAdminConstants.DISMISS_MESSAGES:
        MESSAGES = [];
        SysAdminStore.emitChange();
        break;

    case SysAdminConstants.SEND_MESSAGE:
        MESSAGES.push(action.message);
        SysAdminStore.emitChange();
        break;
    }
});

module.exports = SysAdminStore;
