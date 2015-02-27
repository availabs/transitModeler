<?php
 echo "status:Initializing 1";
 $conn_string = "host=".$argv[1]." port=".$argv[2]." dbname=".$argv[3]." user=".$argv[4]." password=".$argv[5];
 $dbh = pg_connect($conn_string);

 $sql = "SELECT trips FROM triptable where id = ".$argv[6];
 $result = pg_query($dbh, $sql);
 $row = pg_fetch_array($result);
 $trips = json_decode($row['trips'],true);
 $num_rows =  count($trips);
 $num_processed = 0;
 $model = array();
 $model['successful_trips'] = array();
 $model['failed_trips'] = array();
 $x = 0;
 $trip_insert_data = '';
 $model_id = $argv[6];
 echo "status:Processing";
 foreach($trips as $trip){
 	//print_r($trip['from_coords']);
 	if(count($trip['from_coords']) == 2 && count($trip['to_coords']) == 2){
 	  planTrip($trip['from_coords'][0],$trip['from_coords'][1],$trip['to_coords'][0],$trip['to_coords'][1],$trip['time'],$trip);
 	}else{
    //error_log("skip");
  }
 	//error_log ($x);
  $x+=1;
 }

 ///echo "FINISHED $model_id";
 $sql = 'Update triptable set "isFinished" = true where id = '.$model_id;
 echo "status:Success";
 pg_query($dbh, $sql) or die($sql.'\n'.pg_last_error());
 
 

function  planTrip($from_lat,$from_lon,$to_lat,$to_lon,$departure_time,$trip){
	
  //$otp_host = 'http://wim.availabs.org:8080';
	$otp_host = 'http://localhost:8080';
  $otp_url = $otp_host."/opentripplanner-api-webapp/ws/plan?";
	$otp_url .= "fromPlace=$from_lat,$from_lon";
	$otp_url .= "&toPlace=$to_lat,$to_lon";
	$otp_url .= "&mode=TRANSIT,WALK";
	$otp_url .= "&min=QUICK";
	$otp_url .= "&maxWalkDistance=800";
	$otp_url .= "&walkSpeed=1.341";
	$otp_url .= "&time=$departure_time";
	$otp_url .= "&date=7/23/2013";
	$otp_url .= "&arriveBy=false";
	$otp_url .= "&itinID=1";
	$otp_url .= "&wheelchair=false";
	$otp_url .= "&preferredRoutes=";
	$otp_url .= "&unpreferredRoutes=";
  	
  //echo "status:".$otp_url;
  // 	//echo 'Running trip at: time:'.rand($this->start_hour,$this->end_hour).':'.rand(0,59).'am<br><br>';

  processTrip(json_decode(curl_download($otp_url),true),$from_lat,$from_lon,$to_lat,$to_lon);
}

function processTrip($data,$flat,$flon,$tlat,$tlon){
    
    global $dbh,$model_id,$num_processed,$num_rows;
    if(count($data['plan']['itineraries']) > 0){
      $trip = $data['plan']['itineraries'][rand(0,count($data['plan']['itineraries'])-1)];
      $insert_data = "(".$model_id.",'".date('Y-m-d H:i:s',$trip['startTime']/1000)."','".date('Y-m-d H:i:s',$trip['startTime']/1000)."',".$trip['duration'].",".$trip['transitTime'].",".$trip['waitingTime'].",".$trip['walkTime'].",".$trip['walkDistance'].",$flat,$flon,$tlat,$tlon)";
      $sql = "INSERT into model_trips (run_id,start_time,end_time,duration,transit_time,waiting_time,walking_time,walk_distance,from_lat,from_lon,to_lat,to_lon) VALUES $insert_data RETURNING id";
      $res = pg_query($dbh, $sql) or die($sql.'\n'.pg_last_error());
      $insert_row = pg_fetch_row($res);
      $insert_trip_id = $insert_row[0];
      $leg_data = '';
      foreach ($trip['legs'] as $index => $leg) {

        if($leg['mode'] == 'BUS'){
          //echo "Route:" .$leg['route']." ".$leg['tripId']."<br>";
          $leg_data .= "(".$model_id.",$insert_trip_id,'".$leg['mode']."',".$leg['duration'].",'".$leg['distance']."','".$leg['route']."','".$leg['routeId']."','".$leg['tripId']."','".$leg['from']['stopCode']."','".$leg['from']['stopId']['id']."','".$leg['to']['stopCode']."','".$leg['to']['stopId']['id']."'),";
        
        }
        else if($leg['mode'] == 'WALK'){

          //echo "WALK<br>";
          $leg_data .= "(".$model_id.",$insert_trip_id,'".$leg['mode']."',".$leg['duration'].",'".$leg['distance']."','','','','','','',''),";
        }
        
      }
      $leg_data = substr($leg_data, 0,-1);
      $sql = "INSERT into model_legs (run_id,trip_id, mode,duration,distance,route,route_id,gtfs_trip_id,on_stop_code,on_stop_id,off_stop_code,off_stop_id) VALUES $leg_data";
      pg_query($dbh, $sql) or die($sql.'\n'.pg_last_error());
    }else{
      // $sql = "Update model_trip_table set routed = 0 where id = $itin_id";
      // pg_query($dbh, $sql) or die($sql.'\n'.pg_last_error());
    }
    $num_processed++;
    echo "progress:". intval($num_processed/$num_rows*100).':';

  }

function curl_download($Url){ 
    // is cURL installed yet?
    if (!function_exists('curl_init')){
        die('Sorry cURL is not installed!');
    }
 
  	// OK cool - then let's create a new cURL resource handle
  	
   	$ch = curl_init();
   	$headers = array('Accept: application/json');
   	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers); 
   	curl_setopt($ch, CURLOPT_URL, $Url);
   	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
   	$output = curl_exec($ch);

    return $output;
}