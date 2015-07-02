function newId(){
  return Math.floor(Math.random() * 1000000000000);
}

var newTypeId = function(type){
  if(!type)
    return 'NewStop' + newId();
  else{
    return type + newId();
  }
}

module.exports=newTypeId;
