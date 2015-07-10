BEGIN;
DROP SCHEMA IF EXISTS gtfs_20141014_13_1_edited CASCADE;
Select clone_schema('gtfs_20141014_13_1', 'gtfs_20141014_13_1_edited');
COMMIT;
