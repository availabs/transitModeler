var SailsWebApi = require('../utils/SailsWebApiNPM'),
    AppDispatcher = require('../dispatcher/AppDispatcher'),
    GroupAdminConstants = require('../constants/AppConstants').ActionTypes;

module.exports = {
   getAllGroups: function() {
       SailsWebApi.getAllGroups(function(groups) {
           AppDispatcher.handleViewAction({
               type: GroupAdminConstants.GET_ALL_GROUPS,
               groups: groups
           });
       });
   },
   setEditTarget: function(group) {
       AppDispatcher.handleViewAction({
           type: GroupAdminConstants.SET_GROUP_EDIT_TARGET,
           group: group
       });
   },
   createGroup: function(grp) {
       SailsWebApi.createGroup(grp, function(group) {
           AppDispatcher.handleViewAction({
               type: GroupAdminConstants.CREATE_GROUP,
               group: group
           });
       });
   },
   updateGroup: function(grp) {
       SailsWebApi.updateGroup(grp, function(group) {
           AppDispatcher.handleViewAction({
               type: GroupAdminConstants.UPDATE_GROUP,
               group: group
           });
       });
   },
   deleteGroup: function(grp) {
       SailsWebApi.deleteGroup(grp, function(group) {
           AppDispatcher.handleViewAction({
               type: GroupAdminConstants.DELETE_GROUP,
               group: group
           });
       });
   }
};
