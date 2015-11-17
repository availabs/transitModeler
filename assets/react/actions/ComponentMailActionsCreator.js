/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

module.exports = {

  sendMail : function(id,subject,data){
    AppDispatcher.handleViewAction({
      type:ActionTypes.SEND_MAIL,
      data:data,
      id:id,
      subject:subject,
    });
  },

  setStopColors : function(colorMap){
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_FARESTOPCOLORS,
      data:colorMap,
    });
  },
};
