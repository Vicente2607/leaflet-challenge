// Bajamos el API geojson a queryUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// TRansformamos los datos uason el d3
d3.json(queryUrl, function(data) {
  createFeatures(data.features);
  console.log(data.features)
});

// definimos una función que haces los bindPopup con el Lugar , fecha y magnitud del temblor
function createFeatures(earthquakeData) {
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place +
      "</h3><hr><p>" + new Date(feature.properties.time)+"  magnitud:"+feature.properties.mag + "</p>");
  }
  // Definimos una funión para manejar el tamaño del cirvculo de acuerdo a la magnitud del temblor
  function radiusSize(magnitude) {
    return magnitude * 20000;
  }
  // Definimos una funcion para el color del circulo basado en la magnitud
  function circleColor(magnitude) {
    if (magnitude < 1) {
      return "#ccff33"
    }
    else if (magnitude < 2) {
      return "#ffff33"
    }
    else if (magnitude < 3) {
      return "#ffcc33"
    }
    else if (magnitude < 4) {
      return "#ff9933"
    }
    else if (magnitude < 5) {
      return "#ff6633"
    }
    else {
      return "#ff3333"
    }

  }
  // Creamos el GeoJHson layer que contiene los circulos de los temblores
  // Corremos la función onEachFeature que pone los datos de daca temblor
  var earthquakes = L.geoJSON(earthquakeData, {
    pointToLayer: function(earthquakeData, latlng) {
      return L.circle(latlng, {
        radius: radiusSize(earthquakeData.properties.mag),
        color: circleColor(earthquakeData.properties.mag),
        fillOpacity: .55
      });
    },
    onEachFeature: onEachFeature
  });
  // Mandamos el layer de temblores al mapa
  createMap(earthquakes);
}

function createMap(earthquakes) {
  // definimos los layers para el outdoormap, satellitemap y grayscalemap
  var outdoorsmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.outdoors",
    accessToken: API_KEY
  });
  var satellitemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
  });
  var grayscalemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
  });
  // Creamos el layer de la lineas de la fallas
  var faultLine = new L.LayerGroup();
  //  definnimos el basempas con los layers
  var baseMaps = {
    "Outdoor Map": outdoorsmap,
    "Greyscale Map": grayscalemap,
    "Satellite Map": satellitemap
  };
  // Creamos los overlay 
  var overlayMaps = {
    Earthquakes: earthquakes,
    FaultLines: faultLine
  };
  // Creamos el mapa y le damos como párametros de entrada el streemap, y los temblores
  var myMap = L.map("map", {
    center: [37.09, -95.71],
    zoom: 4,
    layers: [outdoorsmap, earthquakes]
  });
  // Creamos el layer control, le pasamos nuestro baseMaps y overlayMaps y los subimos al mapa
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
  // Json de las fallas
  var faultlinequery = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";
  // Creamos las lineas de fallas y creamos el faultline layer
  d3.json(faultlinequery, function(data) {
    L.geoJSON(data, {
      style: function() {
        return {color: "orange", fillOpacity: 0}
      }
    }).addTo(faultLine)

  })
  // creamos una funcion para la escala de colores de acuerdo a la magnitud
  function getColor(d) {
    return d > 5 ? '#ff3333' :
           d > 4  ? '#ff6633' :
           d > 3  ? '#ff9933' :
           d > 2  ? '#ffcc33' :
           d > 1  ? '#ffff33' :
                    '#ccff33';
  }
  // Adherimos la leyenda al mapa
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info legend'),
          mags = [0, 1, 2, 3, 4, 5],
          labels = [];
      for (var i = 0; i < mags.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColor(mags[i] + 1) + '"></i> ' +
              mags[i] + (mags[i + 1] ? '&ndash;' + mags[i + 1] + '<br>' : '+');
      }
      return div;
  };

  legend.addTo(myMap);
}