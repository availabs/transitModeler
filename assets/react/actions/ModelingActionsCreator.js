/**
 Modeling Actions Creator
 */

var AppDispatcher = require('../dispatcher/AppDispatcher'),
	Constants = require('../constants/AppConstants'),
	ActionTypes = Constants.ActionTypes,

	SailsWebApi = require('../utils/sailsWebApi');


module.exports = {

  setOption: function(option,data) {

    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_NEW_MODEL_OPTION,
      option: option,
      value: data
    });

  },
  loadTripTable:function(settings){
  	//console.log('MAC / Load Trip Table',settings)
  	SailsWebApi.getTriptable(settings);
  	//data handled by server actions
  },

  runModel:function(tt){
    //console.log('MAC / Run Model',tt)
    SailsWebApi.runModel(tt);
    //data handled by server actions
  },

  analyzeModel:function(id){
     AppDispatcher.handleViewAction({
      type: ActionTypes.ANALYZE_MODEL,
      id: id
    });
  },

  addActiveModelRun:function(id){
    AppDispatcher.handleViewAction({
      type: ActionTypes.ADD_ACTIVE_MODEL_RUN,
      id: id
    });
  },
	removeActiveModels : function(){
		AppDispatcher.handleViewAction({
			type: ActionTypes.DEL_ACTIVE_MODEL_RUNS
		});
	},

	removeActiveModelRun : function(id){
		AppDispatcher.handleViewAction({
			type: ActionTypes.DEL_ACTIVE_MODEL_RUN,
			id:id
		});
	},

	addModelSettings : function(settings){
		AppDispatcher.handleViewAction({
			type: ActionTypes.SET_MODELSETTINGS,
			data:settings,
		});
	},

	createModelSetting : function(settings){
		AppDispatcher.handleViewAction({
			type: ActionTypes.CREATE_MODELSETTING,
			data: settings,
		});
	},

	saveModelSettings : function(data){
		AppDispatcher.handleViewAction({
			type: ActionTypes.SAVE_MODELSETTINGS,
			data:data
		});
	},

	resetModelSettings : function(){
		AppDispatcher.handleViewAction({
			type: ActionTypes.UNDO_MODEL_EDITS,
		});
	},

	editModelSettings : function( settings ){
		AppDispatcher.handleViewAction({
			type: ActionTypes.EDIT_MODELSETTINGS,
			data: settings,
		});
	},
	updateModel : function(model){
		AppDispatcher.handleViewAction({
			type: ActionTypes.UPDATE_MODEL,
			data: model,
		});
	},
  setMode:function(mode){
    //console.log('setMode',mode)
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_TRIPTABLE_MODE,
      value: mode
    });
  }


};
