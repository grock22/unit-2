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
	
    var attribute = attributes[0]
    //console.log(attribute);
	
	//create marker options
    var geojsonMarkerOptions = {
        radius: 5,
        fillColor: "#ab1200",
        color: "#abf",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
	
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
			
	//return L.circleMarker(latlng, geojsonMarkerOptions);
}

//function to retrieve the data and place it on the map
//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, attributes){	
	//create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
			return pointToLayer(feature, latlng, attributes);
			
        }
		
    }).addTo(map);
};

//new sequence controls
function createSequenceControls(attributes){
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
	
	//Step 5: click listener for buttons
    $('.step').click(function(){
        //get the old index value
        var index = $('.range-slider').val();
		
		
        //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 30 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 30 : index;
		};	
		//Step 8: update slider
		$('.range-slider').val(index);
		//step 9
		updatePropSymbols(attributes[index]);
        
    });

    //Step 5: input listener for slider
    $('.range-slider').on('input', function(){
        //Step 6: get the new index value
        var index = $(this).val();
		
		//step 9
		
		updatePropSymbols(attributes[index]);
		
    });	
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
	map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = "<p><b>Station Name:</b> " + props.Station_Name + "</p>";

            //add formatted attribute to panel content string
            var day = attribute.split("_")[1];
            popupContent += "<p><b>Total Snowfall on December " + day + ": </b> " + props[attribute] + " inches</p>";

            //update popup content
            popup = layer.getPopup();
            popup.setContent(popupContent).update();
        };
    });
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