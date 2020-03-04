//griffin rock 3/4/20//
//declare vars globally so all functions have access
var map;
var minValue;
//Map function that all variables and elements are held.
function createMap(){
    //create the map
    var data = adaptedAjax();
    map = L.map('mapid', {
        center: [45, -100],
        zoom: 3
    });

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &amp;copy; &lt;a href="https://www.openstreetmap.org/"&gt;OpenStreetMap&lt;/a&gt; contributors, &lt;a href="https://creativecommons.org/licenses/by-sa/2.0/"&gt;CC-BY-SA&lt;/a&gt;, Imagery Â© &lt;a href="https://www.mapbox.com/"&gt;Mapbox&lt;/a&gt;',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoicGV0ZXJzb24yIiwiYSI6ImNrNmpza3ZwNDAweXEzZXF0bGxmb2g5eTQifQ.10E8d50dRzp7rkDlUiEj_g'
    }).addTo(map);

    getData();
    createSequenceControls();

    // calcMinValue(data)
    // calcPropRadius(attValue)
    // onEachFeature(feature, layer)
    // pointToLayer(feature, latlng, attributes)
    // createPropSymbols(response,attributes)
    // getData(map)
    // createSequenceControls(attributes)
    // processData(data)
    // updatePropSymbols(attribute)


};
//Calculate the min value of the proportional symbol
function calcMinValue(data){
    var allValues = [];

    for(var state of data.features){

          for (var year = 2012; year &lt 2018; year+=1){

              var value = state.properties["State"+ String(year)];

              allValues.push(value);
          }
      }
  //get minium values of our array
      var minValue = Math.min(...allValues)
      return minValue;
}

//calculate the radius of earch proportional symbol
function calcPropRadius(attValue) {
  //constant factor adjust symbol sizes evenly
  var minRadius = 5;
  //Flannery Appearance Compensation formula
  var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
  return radius;
};


//Popup function where city population data will be returned.
function onEachFeature(feature, layer) {

    var popupContent = "";
    if (feature.properties) {
        for (var property in feature.properties){

            popupContent += "&lt;p&gt;" + property + ": " + feature.properties[property] + "&lt;/p&gt;";
        }
        layer.bindPopup(popupContent);
    };
  };

//Creates circle markers based on location.
function getData(response){
    var geojsonMarkerOptions = {
      radius: 8,
      fillColor: "#ff7800",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
L.geoJson(response, {
      pointToLayer: function (feature, latlng){
        return L.circleMarker(latlng, geojsonMarkerOptions);
      },
      onEachFeature: onEachFeature

    }).addTo(map);
  };

//Ajax function to retrieve the correct data
// from the data folder, data type json. Without this function,
// the data from Megacities (map.geojson) wouldn't appear/ be called.
function adaptedAjax(){
  var data;
  $.ajax("data/mediandata.geojson", {
    dataType: 'json',
    success: function(response){
      data = response;
      getData(data);
    }
  });
  return data
}

//This function creates buttons of forward and backward
function createSequenceControls(attributes){
      console.log('Here sequence')
      //create range input element (slider)
      $('#panel').append('&lt;input class="range-slider" type="range"&gt;');
      $('.range-slider').attr({
        max: 8,
        min: 0,
        value: 0,
        step: 1
      });
      $('#panel').append('&lt;button class="step" id="reverse"&gt;Reverse&lt;/button&gt;');
      $('#panel').append('&lt;button class="step" id="forward"&gt;Forward&lt;/button&gt;');

      //$('#reverse').html('&lt;img src="img/noun_back_37216.png"&gt;');
    //  $('#forward').html('&lt;img src="img/noun_forward_2812173.png"&gt;');

      //Example 3.14 line 2...Step 5: click listener for buttons
      $('.step').click(function(){
    //get the old index value
        var index = $('.range-slider').val();

    //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
          index++;
        //Step 7: if past the last attribute, wrap around to first attribute
          index = index &gt; 7 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
          index--;
        //Step 7: if past the first attribute, wrap around to last attribute
          index = index &lt; 0 ? 7 : index;
          console.log('Here sequence 2')
        };

    //Step 8: update slider
        $('.range-slider').val(index);


        //updatePropSymbols(attributes[index]);

        updatePropSymbols([index]);

      });

      $('.range-slider').on('input', function(){
        var index =$(this).val();
        updatePropSymbols(attributes[index]);
      });
  };


  function processData(data){
      //empty array to hold attributes
      var attributes = [];

      //properties of the first feature in the dataset
      var properties = data.features[0].properties;

      //push each attribute name into attributes array
      for (var attribute in properties){
          //only take attributes with population values
          if (attribute.indexOf("Pop") &gt; -1){
              attributes.push(attribute);
          };
      };
      return attributes;
  };

//Here we create function to update proportional symbols as we click through the sequence.
  function updatePropSymbols(attribute){
      map.eachLayer(function(layer){
          if (layer.feature &amp;&amp; layer.feature.properties[attribute]){
              //update the layer style and popup
              var props = layer.feature.properties;

              //update each feature's radius based on new attribute values
              var radius = calcPropRadius(props[attribute]);
              layer.setRadius(radius);

              //add city to popup content string
              var popupContent = "&lt;p&gt;&lt;b&gt;City:&lt;/b&gt; " + props.City + "&lt;/p&gt;";

              //add formatted attribute to panel content string
              var year = attribute.split("_")[1];
              popupContent += "&lt;p&gt;&lt;b&gt;Median income in " + year + ":&lt;/b&gt; " + props[attribute] + " dollars&lt;/p&gt;";

              //update popup content
              popup = layer.getPopup();
              popup.setContent(popupContent).update();
          };
      });
  };



