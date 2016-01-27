
var tract_census_vars = {},
    total_census_vars = {
    "total_population":{"name":"Total Population","vars":['b01003_001e'],"value":0},
    "total_households":{"name":"Total Households","vars":['b25001_001e'],"value":0},
    "employment":{"name":"Employed","vars":['b12006_005e','b12006_010e','b12006_016e','b12006_021e','b12006_027e','b12006_032e','b12006_038e','b12006_043e','b12006_049e','b12006_054e'],"value":0},
    "unemployment":{"name":"Unemployed","vars":['b12006_006e','b12006_011e','b12006_017e','b12006_022e','b12006_028e','b12006_033e','b12006_039e','b12006_044e','b12006_050e','b12006_055e'],"value":0},
    "travel_to_work_total":{"name":"Total","vars":['b08301_001e'],"value":0},
    "car_to_work":{"name":"Car, truck, or van","vars":['b08301_002e'],"value":0},
    "public_transportation_to_work":{"name":"Public transportation","vars":['b08301_010e'],"value":0},
    "taxi_to_work":{"name":"Taxi","vars":['b08301_016e'],"value":0},
    "motorcycle_to_work":{"name":"Motorcyle","vars":['b08301_017e'],"value":0},
    "bicycle_to_work":{"name":"Bicyle","vars":['b08301_018e'],"value":0},
    "walk_to_work":{"name":"Walked","vars":['b08301_019e'],"value":0},
    "other_to_work":{"name":"Other Means","vars":['b08301_020e'],"value":0},
    "worked_at_home":{"name":"Worked at Home","vars":['b08301_021e'],"value":0},
    "bus_to_work":{"name":"Bus","vars":['b08301_011e'],"value":0},
    "streetcar_to_work":{"name":"Street Car or Trolley","vars":['b08301_012e'],"value":0},
    "subway_to_work":{"name":"Subway","vars":['b08301_013e'],"value":0},
    "train_to_work":{"name":"Train","vars":['b08301_014e'],"value":0},
    "ferry_to_work":{"name":"Ferry","vars":['b08301_015e'],"value":0},
    "total":{"value":0,"vars":['b08126_001e'], "name":"Total:"},
    "agriculture":{"value":0,"vars":['b08126_002e'], "name":"Agriculture, forestry, fishing and hunting, and mining"},
    "construction":{"value":0,"vars":['b08126_003e'], "name":"Construction"},
    "manufacturing":{"value":0,"vars":['b08126_004e'], "name":"Manufacturing"},
    "wholesale":{"value":0,"vars":['b08126_005e'], "name":"Wholesale trade"},
    "retail":{"value":0,"vars":['b08126_006e'], "name":"Retail trade"},
    "transportation":{"value":0,"vars":['b08126_007e'], "name":"Transportation and warehousing, and utilities"},
    "information":{"value":0,"vars":['b08126_008e'], "name":"Information"},
    "finance":{"value":0,"vars":['b08126_009e'], "name":"Finance and insurance, and real estate and rental and leasing"},
    "professional":{"value":0,"vars":['b08126_010e'], "name":"Professional, scientific, and management, and administrative and waste management services"},
    "educational":{"value":0,"vars":['b08126_011e'], "name":"Educational services, and health care and social assistance"},
    "arts":{"value":0,"vars":['b08126_012e'], "name":"Arts, entertainment, and recreation, and accommodation and food services"},
    "other":{"value":0,"vars":['b08126_013e'], "name":"Other services (except public administration)"},
    "public_administration":{"value":0,"vars":['b08126_014e'], "name":"Public administration"},
    "armed_forces":{"value":0,"vars":['b08126_015e'], "name":"Armed forces "},
    "under_10000":{"value":0,"vars":['b19001_002e'], "name":"Less than $10,000"},
    "10000_14999":{"value":0,"vars":['b19001_003e'], "name":"$10,000 to $14,999"},
    "15000_19999":{"value":0,"vars":['b19001_004e'], "name":"$15,000 to $19,999"},
    "20000_24999":{"value":0,"vars":['b19001_005e'], "name":"$20,000 to $24,999"},
    "25000_29999":{"value":0,"vars":['b19001_006e'], "name":"$25,000 to $29,999"},
    "30000_34999":{"value":0,"vars":['b19001_007e'], "name":"$30,000 to $34,999"},
    "35000_39999":{"value":0,"vars":['b19001_008e'], "name":"$35,000 to $39,999"},
    "40000_44999":{"value":0,"vars":['b19001_009e'], "name":"$40,000 to $44,999"},
    "45000_45999":{"value":0,"vars":['b19001_010e'], "name":"$45,000 to $49,999"},
    "50000_59999":{"value":0,"vars":['b19001_011e'], "name":"$50,000 to $59,999"},
    "60000_74999":{"value":0,"vars":['b19001_012e'], "name":"$60,000 to $74,999"},
    "75000_99999":{"value":0,"vars":['b19001_013e'], "name":"$75,000 to $99,999"},
    "100000_124999":{"value":0,"vars":['b19001_014e'], "name":"$100,000 to $124,999"},
    "125000_149999":{"value":0,"vars":['b19001_015e'], "name":"$125,000 to $149,999"},
    "150000_199999":{"value":0,"vars":['b19001_016e'], "name":"$150,000 to $199,999"},
    "200000+":{"value":0,"vars":['b19001_017e'], "name":"$200,000 or more"},
    "median_income":{"value":0,"vars":['b19013_001e'], "name":"Median Income"},
    "poverty_status":{"value":0,"vars":['b17001_002e'], "name":"Income in the past 12 months below poverty level:"},
    "public_school":{"value":0,"vars":['b14003_003e','b14003_031e'], "name":"Public School Enrollment"},
    "private_school":{"value":0,"vars":['b14003_012e','b14003_040e'], "name":"Private School Enrollment"},
    "no_high_school":{"value":0,"vars":['b23006_002e'], "name":"Less than high school graduate:"},
    "high_school":{"value":0,"vars":['b23006_009e'], "name":"High school graduate:"},
    "some_college":{"value":0,"vars":['b23006_016e'], "name":"Some college or associate's degree:"},
    "bachelors":{"value":0,"vars":['b23006_023e'], "name":"Bachelor's degree or higher:"},
    "graduate":{"value":0,"vars":['b06009_006e'], "name":"Graduate or professional degree"},
    "foreign_born":{"value":0,"vars":['b05006_001e'], "name":"Foreign Born Population"},
    "spanish_speaking":{"value":0,"vars":['b06007_005e'], "name":"Spanish Speaking"},
    "other_language":{"value":0,"vars":['b06007_008e'], "name":"Other Language Speaking"},
    "male_pop":{"value":0,"vars":['b01001_002e'], "name":"Male"},
    "female_pop":{"value":0,"vars":['b01001_026e'], "name":"Female"},
    "age_under_5":{"value":0,"vars":['b01001_003e','b01001_027e'], "name":"under_5"},
    "age5_9":{"value":0,"vars":['b01001_004e','b01001_028e'], "name":"5 to 9 years"},
    "age10_14":{"value":0,"vars":['b01001_005e','b01001_029e'], "name":"10 to 14 years"},
    "age15_17":{"value":0,"vars":['b01001_006e','b01001_030e'], "name":"15 to 17 years"},
    "age18_19":{"value":0,"vars":['b01001_007e','b01001_031e'], "name":"18 and 19 years"},
    "age20":{"value":0,"vars":['b01001_008e','b01001_032e'], "name":"20 years"},
    "age21":{"value":0,"vars":['b01001_009e','b01001_033e'], "name":"21 years"},
    "age22_24":{"value":0,"vars":['b01001_010e','b01001_034e'], "name":"22 to 24 years"},
    "age25_29":{"value":0,"vars":['b01001_011e','b01001_035e'], "name":"25 to 29 years"},
    "age30_34":{"value":0,"vars":['b01001_012e','b01001_036e'], "name":"30 to 34 years"},
    "age35_39":{"value":0,"vars":['b01001_013e','b01001_037e'], "name":"35 to 39 years"},
    "age40_44":{"value":0,"vars":['b01001_014e','b01001_038e'], "name":"40 to 44 years"},
    "age45_49":{"value":0,"vars":['b01001_015e','b01001_039e'], "name":"45 to 49 years"},
    "age50_54":{"value":0,"vars":['b01001_016e','b01001_040e'], "name":"50 to 54 years"},
    "age55_59":{"value":0,"vars":['b01001_017e','b01001_041e'], "name":"55 to 59 years"},
    "age60_62":{"value":0,"vars":['b01001_018e','b01001_042e'], "name":"60 and 61 years"},
    "age62_64":{"value":0,"vars":['b01001_019e','b01001_043e'], "name":"62 to 64 years"},
    "age65_66":{"value":0,"vars":['b01001_020e','b01001_044e'], "name":"65 and 66 years"},
    "age67_69":{"value":0,"vars":['b01001_021e','b01001_045e'], "name":"67 to 69 years"},
    "age70_74":{"value":0,"vars":['b01001_022e','b01001_046e'], "name":"70 to 74 years"},
    "age75_79":{"value":0,"vars":['b01001_023e','b01001_047e'], "name":"75 to 79 years"},
    "age80_84":{"value":0,"vars":['b01001_024e','b01001_048e'], "name":"80 to 84 years"},
    "age85+":{"value":0,"vars":['b01001_025e','b01001_049e'], "name":"85 years and over"},
    "race_white":{"value":0,"vars":['b02001_002e'], "name":"White alone"},
    "race_black":{"value":0,"vars":['b02001_003e'], "name":"Black or African American alone"},
    "race_amerindian":{"value":0,"vars":['b02001_004e'], "name":"American Indian and Alaska Native alone"},
    "race_asian":{"value":0,"vars":['b02001_005e'], "name":"Asian alone"},
    "race_hawaii":{"value":0,"vars":['b02001_006e'], "name":"Native Hawaiian and Other Pacific Islander alone"},
    "race_other":{"value":0,"vars":['b02001_007e'], "name":"Some other race alone"},
    "race_two":{"value":0,"vars":['b02001_008e'], "name":"Two or more races:"},
    "total_housing":{"value":0,"vars":['b25002_001e'], "name":"Total Housing Units"},
    "occupied_housing":{"value":0,"vars":['b25002_002e'], "name":"Occupied Housing Units"},
    "vacant_housing":{"value":0,"vars":['b25002_003e'], "name":"Vacant Housing Units"},
    "1_unit_det":{"value":0,"vars":['b25024_002e'], "name":"Single Family Detached"},
    "1_unit_att":{"value":0,"vars":['b25024_003e'], "name":"Single Family Attached"},
    "2_units":{"value":0,"vars":['b25024_004e'], "name":"Two Family"},
    "3_4units":{"value":0,"vars":['b25024_005e'], "name":"3 or 4 Unit"},
    "5_9units":{"value":0,"vars":['b25024_006e'], "name":"5 to 9 units"},
    "10_19units":{"value":0,"vars":['b25024_007e'], "name":"10 to 19 units"},
    "20_49units":{"value":0,"vars":['b25024_008e'], "name":"20 to 49 units"},
    "50+_units":{"value":0,"vars":['b25024_009e'], "name":"50 or more units"},
    "mobile_home":{"value":0,"vars":['b25024_010e'], "name":"Mobile home"},
    "other_home":{"value":0,"vars":['b25024_011e'], "name":"Boat, RV, van, etc."},
    "occupancy_owner":{"value":0,"vars":['b25003_002e'], "name":"Owner occupied"},
    "occupancy_renter":{"value":0,"vars":['b25003_003e'], "name":"Renter occupied"},
    "car_0":{"value":0,"vars":['b08014_002e'], "name":"No vehicle available"},
    "car_1":{"value":0,"vars":['b08014_003e'], "name":"1 vehicle available"},
    "car_2":{"value":0,"vars":['b08014_004e'], "name":"2 vehicles available"},
    "car_3":{"value":0,"vars":['b08014_005e'], "name":"3 vehicles available"},
    "car_4":{"value":0,"vars":['b08014_006e'], "name":"4 vehicles available"},
    "car_5+":{"value":0,"vars":['b08014_007e'], "name":"5 or more vehicles available"},
    "car_0_house":{"value":0,"vars":['b25044_003e','b25044_010e'], "name":"No vehicle available"},
    "car_1_house":{"value":0,"vars":['b25044_004e','b25044_011e'], "name":"1 vehicle available"},
    "car_2_house":{"value":0,"vars":['b25044_005e','b25044_012e'], "name":"2 vehicles available"},
    "car_3_house":{"value":0,"vars":['b25044_006e','b25044_013e'], "name":"3 vehicles available"},
    "car_4_house":{"value":0,"vars":['b25044_007e','b25044_014e'], "name":"4 vehicles available"},
    "car_5+_house":{"value":0,"vars":['b25044_008e','b25044_015e'], "name":"5 or more vehicles available"},
    '12_00am': {"value":0,"vars":['b08132_002e'],"name":'12:00 a.m. to 4:59 a.m.'},
    's5_00am': {"value":0,"vars":['b08132_003e'],"name":'5:00 a.m. to 5:29 a.m.'},
    '5_30am': {"value":0,"vars":['b08132_004e'],"name":'5:30 a.m. to 5:59 a.m.'},
    '6_00am': {"value":0,"vars":['b08132_005e'],"name":'6:00 a.m. to 6:29 a.m.'},
    '6_30am': {"value":0,"vars":['b08132_006e'],"name":'6:30 a.m. to 6:59 a.m.'},
    '7_00am': {"value":0,"vars":['b08132_007e'],"name":'7:00 a.m. to 7:29 a.m.'},
    '7_30am': {"value":0,"vars":['b08132_008e'],"name":'7:30 a.m. to 7:59 a.m.'},
    '8_00am': {"value":0,"vars":['b08132_009e'],"name":'8:00 a.m. to 8:29 a.m.'},
    '8_30am': {"value":0,"vars":['b08132_010e'],"name":'8:30 a.m. to 8:59 a.m.'},
    '9_00am': {"value":0,"vars":['b08132_011e'],"name":'9:00 a.m. to 9:59 a.m.'},
    '10_00am': {"value":0,"vars":['b08132_012e'],"name":'10:00 a.m. to 10:59 a.m.'},
    '11_00am': {"value":0,"vars":['b08132_013e'],"name":'11:00 a.m. to 11:59 a.m.'},
    '12_00pm': {"value":0,"vars":['b08132_014e'],"name":'12:00 p.m. to 3:59 p.m.'},
    '4_00pm': {"value":0,"vars":['b08132_015e'],"name":'4:00 p.m. to 11:59 p.m.'},
    'pttotal': {"value":0,"vars":['b08132_046e'],"name":'Public Transportation -Total'},
    '12_00ampt': {"value":0,"vars":['b08132_047e'],"name":'Public Transportation - 12:00 a.m. to 4:59 a.m.'},
    '5_00ampt': {"value":0,"vars":['b08132_048e'],"name":'Public Transportation - 5:00 a.m. to 5:29 a.m.'},
    '5_30ampt': {"value":0,"vars":['b08132_049e'],"name":'Public Transportation - 5:30 a.m. to 5:59 a.m.'},
    '6_00ampt': {"value":0,"vars":['b08132_050e'],"name":'Public Transportation - 6:00 a.m. to 6:29 a.m.'},
    '6_30ampt': {"value":0,"vars":['b08132_051e'],"name":'Public Transportation - 6:30 a.m. to 6:59 a.m.'},
    '7_00ampt': {"value":0,"vars":['b08132_052e'],"name":'Public Transportation - 7:00 a.m. to 7:29 a.m.'},
    '7_30ampt': {"value":0,"vars":['b08132_053e'],"name":'Public Transportation - 7:30 a.m. to 7:59 a.m.'},
    '8_00ampt': {"value":0,"vars":['b08132_054e'],"name":'Public Transportation - 8:00 a.m. to 8:29 a.m.'},
    '8_30ampt': {"value":0,"vars":['b08132_055e'],"name":'Public Transportation - 8:30 a.m. to 8:59 a.m.'},
    '9_00ampt': {"value":0,"vars":['b08132_056e'],"name":'Public Transportation - 9:00 a.m. to 9:59 a.m.'},
    '10_00ampt': {"value":0,"vars":['b08132_057e'],"name":'Public Transportation - 10:00 a.m. to 10:59 a.m.'},
    '11_00ampt': {"value":0,"vars":['b08132_058e'],"name":'Public Transportation - 11:00 a.m. to 11:59 a.m.'},
    '12_00pmpt': {"value":0,"vars":['b08132_059e'],"name":'Public Transportation - 12:00 p.m. to 3:59 p.m.'},
    '4_00pmpt': {"value":0,"vars":['b08132_060e'],"name":'Public Transportation - 4:00 p.m. to 11:59 p.m.'},
    //'aland': {"value":0,"vars":['aland'],'name':"Land Area (sq Meters)"},
    //'employment_density':{"value":0,"vars":[],'name':"Employment Density (sq Mi)"},
    //'population_density':{"value":0,"vars":[],'name':"Population Density (sq Mi)"},
    
  },
  categories = {
    "Population":["total_population"],
    "Labor Force":["employment","unemployment"],
    "Journey To Work":["car_to_work","public_transportation_to_work","taxi_to_work","motorcycle_to_work","bicycle_to_work","walk_to_work","other_to_work","worked_at_home"],
    "Journey To Work - Public Transportation":['bus_to_work','streetcar_to_work','subway_to_work','train_to_work','ferry_to_work'],
    "Industry":["agriculture","construction","manufacturing","wholesale","retail","transportation","information","finance","professional","educational","arts","other","public_administration","armed_forces"],
    "Income Categories":["under_10000","10000_14999","15000_19999","20000_24999","25000_29999","30000_34999","35000_39999","40000_44999","45000_45999","50000_59999","60000_74999","75000_99999","100000_124999","125000_149999","150000_199999","200000+"],
    "Median Income":['median_income'],
    "Poverty Status":["poverty_status"],
    "School Enrollment":["public_school","private_school"],
    "Educational Attainment":["no_high_school","high_school","some_college","bachelors","graduate"],
    "Foreign Born Population":["foreign_born"],
    "Language Spoken at Home":["spanish_speaking","other_language"],
    "Gender":["male_pop","female_pop"],
    "Age Categories":["age_under_5","age5_9","age10_14","age15_17","age18_19","age20","age21","age22_24","age25_29","age30_34","age35_39","age40_44","age45_49","age50_54","age55_59","age60_62","age62_64","age65_66","age67_69","age70_74","age75_79","age80_84","age85+"],
    "Race":["race_white","race_black","race_amerindian","race_asian","race_hawaii","race_other", "race_two"],
    "Housing Units":["1_unit_det","1_unit_att","2_units","3_4units","5_9units","10_19units","20_49units","50+_units","mobile_home","other_home"],
    "Housing Occupied ":["occupied_housing","vacant_housing"],
    "Housing Ownership": ["occupancy_renter","occupancy_owner"], 
    "Vehicles Available" :["car_0","car_1","car_2","car_3", "car_4", "car_5+"],
    "Household Vehicles Available" :["car_0_house","car_1_house","car_2_house","car_3_house", "car_4_house", "car_5+_house"],
    "Journey TW by Time":['12_00am','s5_00am','5_30am','6_00am','6_30am','7_00am','7_30am','8_00am','8_30am','9_00am','10_00am','11_00am','12_00pm','4_00pm'],
    "Journey TW by Time Public Trans.":['12_00ampt','5_00ampt','5_30ampt','6_00ampt','6_30ampt','7_00ampt','7_30ampt','8_00ampt','8_30ampt','9_00ampt','10_00ampt','11_00ampt','12_00pmpt','4_00pmpt']
  };

    var censusDataParser = {

        update_data:function(tracts){
            //clear out total data
            for (var census_var in total_census_vars){
                total_census_vars[census_var].value = 0;
            }
            tract_census_vars = {};

            //upload new data
            tracts.forEach(function(tract){

                
                tract_census_vars[tract.geoid] = {};
                for (var census_var in total_census_vars){

                    var value = 0;

                    for(var x = 0; x < total_census_vars[census_var].vars.length; x++ ){
                        value+=tract[total_census_vars[census_var].vars[x]]*1;
                    }

                    tract_census_vars[tract.geoid][census_var] = value;
                    total_census_vars[census_var].value += tract_census_vars[tract.geoid][census_var];
                    
                }
                //tract_census_vars[tract.geoid]['employment_density']  = (tract_census_vars[tract.geoid].employment/(tract_census_vars[tract.geoid].aland*0.000000386102159)),
                //tract_census_vars[tract.geoid]['population_density']  = (tract_census_vars[tract.geoid].total_population/(tract_census_vars[tract.geoid].aland*0.000000386102159))
            });
        },
        getTractData:function(){
            return tract_census_vars;
        },
        getTotalData:function(){
            return total_census_vars;
        },
        getCategories:function(){
            return categories;
        }

    }
module.exports = censusDataParser;
