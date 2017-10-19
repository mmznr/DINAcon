(function () {

	window.onload = function () {
		console.log('Fenster ist geladen.');


		///////////////////////
		// DEFS
		//
		var margin = {top: 20, right: 0, bottom: 20, left: 0},
			pi = Math.PI,
			legendeLeft = 15,
			legendeTop = 0,
			//w = 532,
			w = 570 - margin.left - margin.right,
			h = 640 - margin.top - margin.bottom,
			map,
      latOrg,
      lngOrg,
      zoomOrg,
      lat,
      lng,
      zoom,
      zoomLev,
      colorScale;

    var ch_DE = {
        "decimal": ".",
        "thousands": "'",
        "grouping": [3],
        "currency": ["CHF", " "],
        "dateTime": "%a %b %e %X %Y",
        "date": "%d.%m.%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
        "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
        "months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
        "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    };
    var chFormat = d3.formatLocale(ch_DE);


		var query = `PREFIX schema: <http://schema.org/>
			PREFIX gn: <http://www.geonames.org/ontology#>
			PREFIX geo: <http://www.opengis.net/ont/geosparql#>
			PREFIX dct: <http://purl.org/dc/terms/>
			select ?Municipality ?Name ?Population ?WKT
			where
			{
			?Municipality a gn:A.ADM3 .
			?Municipality schema:name ?Name .
			?Municipality gn:population ?Population .
			?Municipality dct:issued ?Date .
			?Municipality gn:parentADM1 ?InCanton .
			?InCanton schema:name ?CantonName .
			?Municipality geo:hasGeometry ?Geometry .
			?Geometry geo:asWKT ?WKT .
			FILTER (?Date = "2017-01-01"^^xsd:date)
			FILTER (?CantonName = "Bern")  
			}`;
		var endPoint = "https://ld.geo.admin.ch/query";

		//Main render function
		d3.sparql(endPoint, query, function(error, data) {
		  if (error) throw error;
		  //console.log(data); // [{'developerName': 'Mike Bostock'}]
		  var newData = [];
		  
		  var popEx = d3.extent(data, function(d) { return d.Population.valueOf(); });
		  var popMin = d3.min(data, function(d) { return d.Population.valueOf(); });
		  var popMax = d3.max(data, function(d) { return d.Population.valueOf(); });
		  console.log(popEx);
		  colorScale = d3.scaleLinear()
        .domain([popMin,1000,10000,popMax])
        .range(['lightgrey','steelblue','lightcoral','tomato'])
        .interpolate(d3.interpolateLab);

		  for (i=0;i<data.length;i++) {
		  	var newObj = {};
			  newObj.properties = {};

			  // "features": [
			  //   {
			  //     "type": "Feature",
			  //     "geometry": {
			  //       "type": "Polygon",
			  //       "coordinates": [

			  newObj.properties.municipality= data[i].Municipality;
			  newObj.properties.name= data[i].Name;
			  newObj.properties.population= data[i].Population.valueOf();
			  newObj.type = 'Feature';

		  	var wkt = new Wkt.Wkt();
		  	wkt.read(data[i].WKT);
		  	newObj.geometry = wkt.toJson();
		  	newData.push(newObj);
		  	//console.log(JSON.stringify(newData));
		  }



      addLmaps();
      console.log('maps added');
			//karteZ();
			
      drawFeatures(newData); 

      map.addControl(new customControl1());
		})

		//add the custom reset zoom button
		var customControl1 =  L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function (map) { 

            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.innerHTML = 'Reset Zoom'
            container.style.backgroundColor = 'white';
            container.style.padding = '5px';

            container.onclick = function(){
                resetZoom();

            }

            return container;
        }
    });

    //reset zoom function
    function resetZoom() {
        ebene = 'gem';
        map.setView([latOrg, lngOrg], 10);
        d3.selectAll('.image').remove();
        //d3.selectAll('.gemeinde').style('fill-opacity', 0.3);
    }

    //define the transformation of the coodrinates so that leaflet understands them
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }

		//Add the OpenStreetMap Layer via leaflet    
		function addLmaps() {
		    latOrg = 46.9;
		    lngOrg = 7.7;
		    zoomOrg = 8;
		    map = L.map('map').setView([latOrg, lngOrg], zoomOrg);

		    //OpenStreetMap_BlackAndWhite
		    L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
		     maxZoom: 18,
		        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		    }).addTo(map);
		    map._initPathRoot();	
		    
		}	

		function projectPoint(x, y) {
		    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		    this.stream.point(point.x, point.y);
		}

		//draw the data
    function drawFeatures(mapData) {
      var svg = d3.select('#map').select('svg');
      var svgMap = svg.append('g').attr('id', 'svgMap');



      var transform = d3.geoTransform({point: projectPoint});
      var path = d3.geoPath().projection(transform);

      //Some custom map data in topoJSON Format 
      //from https://statistik.zh.ch/internet/justiz_inneres/statistik/de/daten/Raeumliche_Daten/Basiskarten.html
      //can be anything
      //d3.json(mapData, function(error, mapData) {
      	//Gemeindeumrisse
      	var featureElement = svgMap.selectAll('path.gemeinde')
      		.data(mapData)
      		.enter()
      		.append("path")
      		.attr("d", path)
      		.attr('class', 'gemeinde')
      		.style('stroke-width', 0.5)
      		.style('fill', function(d) {
      			return colorScale(d.properties.population);
      		})
      		.on('mouseover', function(d) {
      			//console.log(d.properties.name);
      			var bBox = d3.select(this).node().getBBox();
      			//console.log(bBox);
      			svgMap.append('text')
      				.attr('class', 'mouse')
      				.attr('x', bBox.x+bBox.width/2)
      				.attr('y', bBox.y+bBox.height/2)
      				.text(d.properties.name+': '+chFormat.format(',')(d.properties.population));
      		})
      		.on('mouseout', function() {
      			//undo what ever you wanted to do with your Map-Data on Mouse-Out
      			d3.selectAll('.mouse').remove();
      		})
      		.on('click', function() {
      			//or maybe some click-action?
      		});
      		


				//some map functionality
    		map.on('viewreset', update);
    		//update();
    		map.on("zoomend", function(){
    		    zoomLev = map.getZoom();
    		});

    		//update the svg-stuff when the leaflet-map gets zoomed or moved
    		function update() {	
  		    featureElement.attr('d', path);
  		    //Move Circles when Map moves
    		}
      //})
		}
	};
}());
