DROP FUNCTION IF EXISTS add_stop_to_stop_times(stop TEXT, sequence_id INTEGER, id TEXT, schema TEXT);
DROP FUNCTION IF EXISTS add_stop_to_stop_times(stop_id TEXT, sequence_id INT, ids TEXT[], schema TEXT);
DROP FUNCTION IF EXISTS del_stop_from_stop_times(sequence_id INTEGER, id TEXT, schema TEXT);
DROP FUNCTION IF EXISTS del_stop_from_stop_times(sequence_id INT, ids TEXT[], schema TEXT);
DROP FUNCTION IF EXISTS update_st_times(trip_id TEXT, time_deltas INT[], schema TEXT);
DROP FUNCTION IF EXISTS update_st_times(trip_ids TEXT[], time_deltas INT[], schema TEXT);
DROP FUNCTION IF EXISTS delete_and_update_shapes_with_trips(trip_ids TEXT[],lats REAL[],lons REAL[],geoms TEXT[],schema TEXT);
DROP FUNCTION IF EXISTS insert_into_shapes_with_trips(shape_id TEXT,trip_ids TEXT[],lats REAL[],lons REAL[],geoms TEXT[], schema TEXT);
DROP FUNCTION IF EXISTS update_route_geom(route_id TEXT,schema TEXT);
DROP FUNCTION IF EXISTS create_or_update_route(route_id TEXT, short_name TEXT, type INT, schema TEXT);
DROP FUNCTION IF EXISTS create_or_update_trip(text,text,text,text,text,text);
DROP FUNCTION IF EXISTS create_or_update_service(text,text);
DROP FUNCTION IF EXISTS create_or_update_freq(text,text,text,integer,text);
CREATE OR REPLACE FUNCTION add_stop_to_stop_times(stop TEXT, sequence_id INTEGER, id TEXT, schema TEXT)
RETURNS void AS $$
	DECLARE
		curs REFCURSOR;
		rec RECORD;
	BEGIN
		OPEN curs FOR EXECUTE format('SELECT * FROM %I.stop_times
		 								WHERE trip_id=$1 AND stop_sequence >= $2 ORDER BY stop_sequence DESC;',schema)
									USING id, sequence_id;
		LOOP
			FETCH NEXT FROM curs INTO rec;
			EXIT WHEN rec IS NULL;
			EXECUTE format('UPDATE %I.stop_times SET stop_sequence=stop_sequence+1 WHERE trip_id=$1 AND stop_sequence=$2',schema)
							USING rec.trip_id,rec.stop_sequence;
			--UPDATE cdta_20130906_0131.stop_times SET stop_sequence = stop_sequence + 1 WHERE CURRENT OF curs;
		END LOOP;
		EXECUTE format('INSERT INTO %I.stop_times(trip_id,stop_sequence,stop_id) VALUES ($1, $2, $3);',schema)
						USING id, sequence_id, stop;
		--INSERT INTO cdta_20130906_0131.stop_times(trip_id,stop_sequence,stop_id) VALUES (id, sequence_id, stop);
	END;
	$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_stop_to_stop_times(stop_id TEXT, sequence_id INT, ids TEXT[], schema TEXT)
RETURNS void as $$
	DECLARE
		index INT;
	BEGIN
		FOR index IN 1..array_length(ids,1) LOOP
			PERFORM add_stop_to_stop_times(stop_id,sequence_id,ids[index],schema);
		END LOOP;
	END;
	$$LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION del_stop_from_stop_times(sequence_id INTEGER, id TEXT, schema TEXT)
RETURNS void as $$
	DECLARE
		curs REFCURSOR;
		rec RECORD;
	BEGIN
		EXECUTE format('DELETE FROM %I.stop_times WHERE stop_sequence=$1 AND trip_id=$2;',schema)
						USING sequence_id, id;
		OPEN curs FOR EXECUTE format('SELECT * FROM %I.stop_times WHERE trip_id=$1 and stop_sequence > $2;',schema)
								USING id, sequence_id;
		LOOP
			FETCH NEXT FROM curs INTO rec;
			EXIT WHEN rec IS NULL;
			EXECUTE format('UPDATE %I.stop_times SET stop_sequence=stop_sequence - 1 WHERE trip_id=$1 AND stop_sequence=$2;',schema)
							USING rec.trip_id, rec.stop_sequence;
			--UPDATE cdta_20130906_0131.stop_times SET stop_sequence=stop_sequence - 1 WHERE CURRENT OF curs;
		END LOOP;
	END;
	$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION del_stop_from_stop_times(sequence_id INT, ids TEXT[], schema TEXT)
RETURNS void as $$
	DECLARE
		index INT;
	BEGIN
		FOR index IN 1..array_length(ids,1) LOOP
			PERFORM del_stop_from_stop_times(sequence_id,ids[index],schema);
		END LOOP;
	END;
	$$LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_st_times(id TEXT, time_deltas INT[], schema TEXT)
RETURNS void as $$
	DECLARE
		inx INT := 1;
		curs REFCURSOR;
		rec RECORD;
		upInterval INTERVAL;
		newArrTime TEXT;
		newDepTime TEXT;
	BEGIN
		OPEN curs FOR EXECUTE format('SELECT trip_id,stop_sequence,arrival_time,departure_time FROM %I.stop_times WHERE trip_id=$1 ORDER BY stop_sequence;',schema)
		USING id;
		LOOP
			FETCH NEXT FROM curs INTO rec;
			EXIT WHEN rec IS NULL;
			IF rec.stop_sequence > 1 THEN
				upInterval := (time_deltas[inx]::text||' seconds')::INTERVAL;
				newArrTime := to_char(newArrTime::INTERVAL + upInterval,'HH24:MI:SS');
				newDepTime := to_char(newDepTime::INTERVAL + upInterval,'HH24:MI:SS');
				--RAISE NOTICE 'index is %, ArrivalTime is now %, DepartureTime is now %, delta %', inx, newArrTime, newDepTime, upInterval;
				EXECUTE format('UPDATE %I.stop_times SET arrival_time=$1,
													departure_time=$2
													WHERE trip_id=$3 AND stop_sequence=$4;',schema)
													USING newArrTime,newDepTime,rec.trip_id,rec.stop_sequence;
				inx := inx + 1;
			ELSE
				newArrTime = rec.arrival_time;
				newDepTime = rec.departure_time;

			END IF;
		END LOOP;

	END;
	$$LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_st_times(ids text[], time_deltas INT[], schema TEXT)
RETURNS void as $$
	DECLARE
		id TEXT;
	BEGIN
		FOREACH id IN ARRAY ids LOOP
			PERFORM update_st_times(id,time_deltas,schema);
		END LOOP;
	END;
	$$LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_and_update_shapes_with_trips(trip_ids TEXT[],lats REAL[],lons REAL[],geoms TEXT[],schema TEXT)
RETURNS void as $$
	DECLARE
		rec RECORD;
		len INT;
		ix INT := 1;
	BEGIN
		EXECUTE format('Select Distinct shape_id FROM %I.trips WHERE trip_id = ANY ($1)',schema)
				INTO rec
				USING trip_ids;
		EXECUTE format('DELETE FROM %I.shapes WHERE shape_id=$1',schema) USING rec.shape_id;
		len := array_length(geoms,1); --get the length of the geometry array
		WHILE ix <= len LOOP
			EXECUTE format('INSERT INTO %I.shapes(shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,geom) VALUES
							($1,$2,$3,$4,ST_SetSRID(ST_GeomFromGeoJSON($5),4326)) ',schema)
							USING rec.shape_id,lats[ix],lons[ix],ix,geoms[ix];
			ix := ix + 1;
		END LOOP;

	END;
	$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_into_shapes_with_trips(shape_id TEXT, trip_ids TEXT[],lats REAL[],lons REAL[],geoms TEXT[], schema TEXT)
RETURNS void as $$
	DECLARE
		len INT :=array_length(geoms,1);
		ix INT :=1;
	BEGIN
		WHILE ix <= len LOOP
			EXECUTE format('INSERT INTO %I.shapes(shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,geom) VALUES
							($1,$2,$3,$4,ST_SetSRID(ST_GeomFromGeoJSON($5),4326)) ',schema)
							USING shape_id,lats[ix],lons[ix],ix,geoms[ix];
			ix := ix +1;
		END LOOP;
		END;
		$$LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION update_route_geom(route_id TEXT,schema TEXT)
RETURNS void AS $$
	DECLARE
		rec RECORD;
		dbug RECORD;
	BEGIN --first collect the set of shape ids that are associated with this road.
		EXECUTE format('Select array_agg(distinct shape_id::TEXT) as shapes FROM %I.trips WHERE route_id=$1 AND shape_id IS NOT NULL',schema)
						INTO rec
						USING route_id;
		RAISE NOTICE 'IDS : %',rec.shapes::character varying[];
		--using the array of shape ids from the trips table we create lines from their point lists and then multilines from those lines
		EXECUTE format(E'SELECT ST_Multi(ST_COLLECT(array_agg(T.LINE))) as GEO FROM (SELECT ST_MakeLine(array_agg(geom ORDER BY shape_pt_sequence)) as Line FROM %I.shapes WHERE shape_id IN (\'' ||array_to_string(rec.shapes,E'\',\'') || E'\') GROUP BY shape_id) as T',schema)
									INTO dbug;
		EXECUTE format('UPDATE %I.routes SET geom=$1 where route_id=$2',schema)
						USING dbug.GEO,route_id;
		END;
		$$ LANGUAGE plpgsql;
--THESE CREATE AND UPDATES ARE ONLY GOOD FOR basic pipelining to get imperitive data
--For functionality, must be updated for full featured data
CREATE OR REPLACE FUNCTION create_or_update_route(route_id TEXT, short_name TEXT,type INT, schema TEXT)
RETURNS void as $$
 	DECLARE
		chk BOOLEAN;
 	BEGIN
	EXECUTE format('SELECT EXISTS (SELECT * from %I.routes WHERE route_id=$1)',schema)
					INTO chk
					USING route_id;
	RAISE NOTICE 'query value : %', chk;
	IF NOT chk THEN
		EXECUTE format('INSERT INTO %I.routes(route_id,route_type,route_short_name) VALUES ($1,$2,$3)',schema)
					USING route_id,type, short_name;
	ELSE
		IF short_name is NULL THEN
			EXECUTE format('UPDATE %I.routes SET route_id=$1, route_type=$2 WHERE route_id=$1',schema)
							USING route_id,type;
		ELSIF char_length(short_name) = 0 THEN
			EXECUTE format('UPDATE %I.routes SET route_id=$1, route_type=$2 WHERE route_id=$1',schema)
							USING route_id,type;
		ELSE
			EXECUTE format('UPDATE %I.routes SET route_id=$1, route_short_name=$3, route_type=$2 WHERE route_id=$1',schema)
							USING route_id,type,short_name;
		END IF;
	END IF;
	END;
	$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_or_update_trip(trip_id TEXT,headsign TEXT,route_id TEXT,service_id TEXT,shape_id TEXT,schema TEXT)
RETURNS void as $$
	DECLARE
		chk BOOLEAN;
	BEGIN
		EXECUTE format('SELECT EXISTS(SELECT trip_id FROM %I.trips WHERE trip_id=$1)',schema)
						INTO chk USING trip_id;
		IF NOT chk THEN
			EXECUTE format('INSERT INTO %I.trips(trip_id,trip_headsign,route_id,service_id,shape_id) VALUES ($1,$2,$3,$4,$5)',schema)
						USING trip_id,headsign,route_id,service_id,shape_id;
		ELSE
			EXECUTE format('UPDATE %I.trips SET trip_id=$1,route_id=$2,service_id=$3,shape_id=$4, trip_headsign=$5 WHERE trip_id=$1',schema)
						USING trip_id,route_id,service_id,shape_id,headsign;
		END IF;
		END;
		$$LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION create_or_update_service(service_id TEXT,schema TEXT)
RETURNS void AS $$
	DECLARE
		chk BOOLEAN;
		defStart date := now() ;
		defEnd date   := now() ;
	BEGIN
		EXECUTE format('SELECT EXISTS (SELECT service_id FROM %I.calendar WHERE service_id=$1)',schema)
						INTO chk USING service_id;
		IF NOT chk THEN
			EXECUTE format('INSERT INTO %I.calendar(service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date) VALUES ($1,true,true,true,true,true,true,true,$2,$3)',schema)
						USING service_id, defStart, defEnd;
		END IF;
		END;
		$$LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_or_update_freq(tripid TEXT, starttime TEXT, endtime TEXT, headwaysecs INT, schema TEXT)
RETURNS void as $$
	DECLARE
		isThere BOOLEAN;
	BEGIN
		EXECUTE format('SELECT EXISTS (SELECT * FROM %I.frequencies WHERE trip_id = $1)',schema)
						INTO isThere USING tripid;
		IF isThere THEN
			EXECUTE format('UPDATE %I.frequencies SET start_time=$1,end_time=$2,headway_secs=$3 WHERE trip_id=$4',schema)
							USING starttime,endtime,headwaysecs,tripid;
		ELSE
			EXECUTE format('INSERT INTO %I.frequencies(trip_id,start_time,end_time,headway_secs) VALUES ($1,$2,$3,$4)',schema)
							USING tripid,starttime,endtime,headwaysecs;
		END IF;
	END;
	$$ LANGUAGE plpgsql;


--CREATE OR REPLACE FUNCTION create_or_update_trip(trip_id TEXT,)
--SELECT * FROM add_stops(text '00000',ARRAY[12],ARRAY['2328042-AUG13-Albany-Weekday-01']);
