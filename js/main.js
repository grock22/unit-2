//griffin rock 2/12/20//
//declare map var in global scope
var map;
var minValue;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('mapid', {
        center: [61, -140],
        zoom: 3
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData();
};
function calcMinValue(data){
     
     //create empty array to store all data values
     var allValues = [];
     
     //loop through each city
     for(var Station_Name of data.features){
          //loop through each day
          for(var day = 1; day <= 31; day+=1){
                //get snowfall for current day
               var value = Station_Name.properties["Dec_"+ String(day)];
			   //add value to array
               allValues.push(value);
           }
     }
     
     //get minimum value of our array
     var minValue = Math.min(...allValues)

     return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
     
     //constant factor adjusts symbol sizes evenly
     var minRadius = 3;
     
     //Flannery Appearance Compensation formula
     var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

     return radius;
};

function pointToLayer(feature, latlng, attributes){
    //Step 4: Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    //check
    console.log(attribute);

//function to retrieve the data and place it on the map
//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, attributes){
    var attribute = "Dec_31";
		
	//create marker options
    var geojsonMarkerOptions = {
        radius: 5,
        fillColor: "#ab1200",
        color: "#abf",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
        
			//Step 5: For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);
			//Give each feature's circle marker a radius based on its attribute value
			geojsonMarkerOptions.radius = calcPropRadius(attValue);

			//create circle marker layer
			var layer = L.circleMarker(latlng, geojsonMarkerOptions);

			//build popup content string
			var popupContent = "<p><b>Station Name:</b> " + feature.properties.Station_Name + "</p><p><b>";
			
			var day = attribute.split("_")[1]
			
			popupContent += "<p><b>Total Snowfall on December " + day + ":</b> " + feature.properties[attribute] + " inches</p>";
			
			
			//bind the popup to the circle marker
			layer.bindPopup(popupContent, {
				offset: new L.Point(0,-geojsonMarkerOptions.radius)
			});
			
			//return the circle marker to the L.geoJson pointToLayer option
			return layer;
						
            //Step 6: Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);
			
			return L.circleMarker(latlng, geojsonMarkerOptions);
			
			return pointToLayer(featire, latlng, attributes);
        }
    }).addTo(map);
};

//new sequence controls
function createSequenceControls(){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');
	
	//set slider attributes
    $('.range-slider').attr({
        max: 30,
        min: 0,
        value: 0,
        step: 1
	});
	
	$('#panel').append('<button class="step" id="reverse">Reverse</button>');
    $('#panel').append('<button class="step" id="forward">Forward</button>');
	$('#reverse').html('<img src="img/reverse.png">');
	$('#forward').html('<img src="img/fast_f.png">');
};


//build atributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Dec") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    //console.log(attributes);

    return attributes;
};
//Step 2: Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/alaska_dec_snowfalls.geojson", {
		dataType: "json",
		success: function(response){
			//creates attributes array
			var attributes = processData(response);
			
			//calculate minimum data value
			minValue = calcMinValue(response);			
			//call function to create proportional symbols
			createPropSymbols(response, attributes);
			createSequenceControls(attributes);
		}
	});
};
$(document).ready(createMap);