var SailsWebApi = require('../utils/SailsWebApiNPM'),
    AppDispatcher = require('../utils/AppDispatcher'),
    SysAdminConstants = require('../constants/AppConstants').ActionTypes;

var SysAdminActions = {
    reloadRoutes: function() {
        SailsWebApi.reloadRoutes(function(result) {
            AppDispatcher.dispatch({
                type: SysAdminConstants.RELOAD_ROUTES,
                result: result
            });
        });
        SysAdminActions.sendMessage("Reloading all routes...");
    },
    dismissMessages: function() {
        AppDispatcher.dispatch({
            type: SysAdminConstants.DISMISS_MESSAGES
        });
    },
    sendMessage: function(message) {
        AppDispatcher.dispatch({
            type: SysAdminConstants.SEND_MESSAGE,
            message: message
        });
    }
};

module.exports = SysAdminActions;
