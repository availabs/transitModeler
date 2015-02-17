/**
 * DatasourcesController
 *
 * @description :: Server-side logic for managing datasources
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
function getCensusData(marketarea,table,cb){

    var sql = 'SELECT a.*,b.aland FROM public.'+table+' as a'
          + ' join tl_2013_34_tract as b on a.geoid = b.geoid'
          + ' where a.geoid in '+JSON.stringify(marketarea.zones).replace(/\"/g,"'").replace("[","(").replace("]",")");
    MarketArea.query(sql,{},function(err,data){
      if (err) { return console.log(err,sql);}
      return cb(data.rows);
    });
}

module.exports = {
	
	getACS:function(req,res){
		if(!req.param('year')){
			res.send('{status:"error",message:"Must send 4 digit [year] of data."}',500);
		}
	    var censusTable = 'acs5_34_'+req.param('year')+'_tracts';
	   
	    //Allow user to specify census table
	    MarketArea.findOne(req.param('marketareaId')).exec(function(err,ma){
	      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
	        getCensusData(ma,censusTable,function(census){
	          res.json({census:census})
	        })
	    })
	    
 	},
 	getRoutes:function(req,res){
		if(!req.param('tablename')){
			res.send('{status:"error",message:"Must send gtfs tablename."}',500);
		}
		
		var sql = 'SELECT route_id, route_short_name, route_long_name FROM '+req.param('tablename')+'.routes';

	    Datasource.query(sql,{},function(err,data){
	      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}

	      output = data.rows;
	      return res.json(output);

	    });
		
	},
};

