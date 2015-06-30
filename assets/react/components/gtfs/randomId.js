function newId(){
  return Math.floor(Math.random() * 1000000000000);
}

var newStopId = function(){
  return 'NewStop' + newId();
}

module.exports=newStopId;
