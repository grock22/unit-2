//griffin rock 2/12/20//
//declare map var in global scope
var map;
var dataStats = {};
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
//Step 2: Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/alaska_dec_snowfalls.geojson", {
		dataType: "json",
		success: function(response){
			//creates attributes array
			var attributes = processData(response);

			//calculate min,max, mean data value
			calcStats(response);
			//call function to create proportional symbols
			createPropSymbols(response, attributes);
			createSequenceControls(attributes);
			createLegend();
		}
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

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, attributes){
	//create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
			return pointToLayer(feature, latlng, attributes);

        }

    }).addTo(map);
};

function pointToLayer(feature, latlng, attributes){
    //Step 4: Assign the current attribute based on the first index of the attributes array

    var attribute = attributes[0]

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

	var popupContent = createPopupContent(feature.properties, attribute);

	//bind the popup to the circle marker
	layer.bindPopup(popupContent, {
		offset: new L.Point(0,-geojsonMarkerOptions.radius)
	});

	//return the circle marker to the L.geoJson pointToLayer option
	return layer;

	//return L.circleMarker(latlng, geojsonMarkerOptions);
}

//creates popups which can be accessed by pointToLayer and updatePropSymbols
function createPopupContent(properties, attribute){
    //add city to popup content string
    var popupContent = "<p><b>Station Name: </b> " + properties.Station_Name + "</p>";

    //add formatted attribute to panel content string
    var day = attribute.split("_")[1];
    popupContent += "<p><b>Total Snowfall on December " + day + ":</b> " + properties[attribute] + " inches</p>";

    return popupContent;
};


function calcStats(data){

     //create empty array to store all data values
     var allValues = [];

     //loop through each station name
     for(var Station_Name of data.features){
          //loop through each day
          for(var day = 1; day <= 31; day+=1){
                //get snowfall for current day
               var value = Station_Name.properties["Dec_"+ String(day)];
			   //add value to array
               allValues.push(value);
           }
     }

     //get minimum, maximum stats of our array
     dataStats.min = Math.min(...allValues);
     dataStats.max = Math.max(...allValues);

     //calculate mean
     var sum = allValues.reduce(function(a, b){return a+b;});
     dataStats.mean = sum/ allValues.length;

     //return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {

     //constant factor adjusts symbol sizes evenly
     var minRadius = 3;

     //Flannery Appearance Compensation formula
     var radius = 1.0083 * Math.pow(attValue/dataStats.min,0.5715) * minRadius

     return radius;
};


//new sequence controls
function createSequenceControls(attributes){

	var SequenceControl = L.Control.extend({
		options: {
			position: 'bottomleft',
		},

		onAdd: function() {
			//create the control container div with a class name
			var container = L.DomUtil.create('div', 'sequence-control-container');
			// create range slider
			$(container).append('<input class="range-slider" type="range">');
			//add forward and reverse buttons
			$(container).append('<button class="step" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="step" id="forward" title="Forward">Forward</button>');

			//disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

			return container;
		}
	});

	map.addControl(new SequenceControl());

	$('#reverse').html('<img src="img/reverse.png">');
	$('#forward').html('<img src="img/fast_f.png">');

	//set slider attributes
    $('.range-slider').attr({
        max: 30,
        min: 0,
        value: 0,
        step: 1
	});

	//add listeners after adding control
	//click listener for buttons
    $('.step').click(function(){
        //get the old index value
        var index = $('.range-slider').val();


        //increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 30 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //if past the first attribute, wrap around to last attribute
            index = index < 0 ? 30 : index;
		};
		//update slider
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
}

function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
            $(container).append('<div id="tempor_legend" "<p><b>Total Snowfall on December "' + 1 + '":</b></p>' );
			//container.innerHTML += "<p><b>Total Snowfall on December " + day + ":</b></p>"  // don't forget the break tag
			//"<p><b>Total Snowfall on December " + day + ":</b> " + properties[attribute] + " inches</p>";
			//$(container).append('<button class="step" id="reverse" title="Reverse">Reverse</button>');


			//Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="160px" height="100px">';
			//array of circle names to base loop on
			var circles = ["max", "mean", "min"];

			//Step 2: loop to add each circle and text to svg string
			for (var i=0; i<circles.length; i++){

				//Step 3: assign the r and cy attributes
                var radius = calcPropRadius(dataStats[circles[i]]);
                var cy = 100 - radius;
				 //circle string
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#ab1200" fill-opacity="0.8" stroke="#abf" cx="62"/>';

                //evenly space out labels
                var textY = i * 20 + 20;

                //text string
                svg += '<text id="' + circles[i] + '-text" x="65" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " inches" + '</text>';
			};

			//close svg string
			svg += "</svg>";

			//add attribute legend svg to container
			$(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());

	//updateLegend(map, attributes[0]);
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

			var popupContent = createPopupContent(props, attribute);

            //update popup content
            popup = layer.getPopup();
            popup.setContent(popupContent).update();
        };
    });
};

$(document).ready(createMap);
