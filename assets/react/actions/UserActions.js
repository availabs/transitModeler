var SailsWebApi = require('../utils/SailsWebApiNPM'),
    AppDispatcher = require('../dispatcher/AppDispatcher'),
    UserConstants = require('../constants/AppConstants').ActionTypes;

module.exports = {
   setSessionUser: function(user) {
       AppDispatcher.handleViewAction({
           type: UserConstants.SET_SESSION_USER,
           user: user
       });
   },
   getAllUsers: function(id) {
    SailsWebApi.getAllUsers(function(users) {
         AppDispatcher.handleViewAction({
             type: UserConstants.RECEIVE_USERS,
             users: users
         });
     }); 
   },
   setEditTarget: function(user) {
       AppDispatcher.handleViewAction({
           type: UserConstants.SET_EDIT_TARGET,
           user: user
       });
   },
   createUser: function(user) {
       SailsWebApi.createUser(user, function(user) {
           AppDispatcher.handleViewAction({
               type: UserConstants.CREATE_USER,
               user: user
           });
       });
   },
   updateUser: function(user) {
       SailsWebApi.updateUser(user, function(user) {
           AppDispatcher.handleViewAction({
               type: UserConstants.UPDATE_USER,
               user: user
           });
       });
   },
   deleteUser: function(user) {
       SailsWebApi.deleteUser(user, function(user) {
           AppDispatcher.handleViewAction({
               type: UserConstants.DELETE_USER,
               user: user
           });
       });
   }
};
