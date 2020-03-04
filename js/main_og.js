//griffin rock 2/12/20//
//declare map var in global scope
var map;
var minValue;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('mapid', {
        center: [65, -140],
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

//function to retrieve the data and place it on the map
//function to convert markers to circle markers
function pointToLayer(feature, latlng){
    //Determine which attribute to visualize with proportional symbols
    var attribute = "Dec_31";

    //create marker options
    var options = {
        fillColor: "#ab1200",
        color: "#abf",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>Station Name:</b> " + feature.properties.Station_Name + "</p><p><b>" + attribute + ":</b> " + feature.properties[attribute] + "</p>";
	
    //bind the popup to the circle marker
    layer.bindPopup(popupContent);
	
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: pointToLayer
    }).addTo(map);
};

//Step 2: Import GeoJSON data
function getData(){
    //load the data
    $.getJSON("data/alaska_dec_snowfalls.geojson", function(response){
        //calculate minimum data value
        minValue = calcMinValue(response);			
			
		//call function to create proportional symbols
        createPropSymbols(response);
    });
};
$(document).ready(createMap);