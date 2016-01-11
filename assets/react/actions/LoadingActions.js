var SailsWebApi = require('../utils/SailsWebApiNPM'),
    AppDispatcher = require('../dispatcher/AppDispatcher'),
    LoadingConstants = require('../constants/AppConstants').ActionTypes;

module.exports = {
    loadingStart: function() {
        AppDispatcher.handleViewAction({
            type: LoadingConstants.LOADING_START
        });
    },
    loadingStop: function() {
        AppDispatcher.handleViewAction({
            type: LoadingConstants.LOADING_STOP
        });
    }
};
