(function () {

	window.onload = function () {
		console.log('Fenster ist geladen.');
		var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
		// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
		var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
		var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
		// At least Safari 3+: "[object HTMLElementConstructor]"
		var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
		var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

		if (!Array.prototype.filter) {
		  Array.prototype.filter = function(fun /*, thisp*/) {
			var len = this.length >>> 0;
			if (typeof fun != "function")
			throw new TypeError();

			var res = [];
			var thisp = arguments[1];
			for (var i = 0; i < len; i++) {
			  if (i in this) {
				var val = this[i]; // in case fun mutates this
				if (fun.call(thisp, val, i, this))
				res.push(val);
			  }
			}
			return res;
		  };
		}

		///////////////////////
		// DEFS
		//
		var margin = {top: 20, right: 0, bottom: 20, left: 0},
			gRatio = (1+Math.sqrt(5))/2,
			ch1903 = {'x1':669625, 'x2':716125, 'y1':224725, 'y2': 283325},
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
      zoomLev;

		function dataFilter(data,obj,val) {
		  return data.filter(function(itm) {
		      return itm[obj] == val;
		  });
		}
		function objAcc(datum, datumObj) {
			return datum.values[0][datumObj];
		}
		function sortByName(a,b) {
			if (a.properties.NAME < b.properties.NAME)
				return -1;
			if (a.properties.NAME > b.properties.NAME)
				return 1;
				return 0;
		}



		var query = `#Liste aller Seen in der Schweiz
					#defaultView:Map
			SELECT ?itemDescription ?image ?coord ?kanton ?item WHERE {
			  ?item (wdt:P31/wdt:P279*) wd:Q23397.
			  ?item wdt:P625 ?coord.
			  OPTIONAL { ?item wdt:P18 ?image. }
			  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
			  ?item wdt:P131 wd:Q11943.
					}`;
		var endPoint = "https://query.wikidata.org/bigdata/namespace/wdq/sparql";

		//Main render function
		d3.sparql(endPoint, query, function(error, data) {
		  if (error) throw error;
		  console.log(data); // [{'developerName': 'Mike Bostock'}]


      addLmaps();
      console.log('maps added');
			//karteZ();
			
      drawFeatures(data); 

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
		    latOrg = 47.43;
		    lngOrg = 8.64;
		    zoomOrg = 10;
		    map = L.map('map').setView([latOrg, lngOrg], zoomOrg);

		    //OpenStreetMap_BlackAndWhite
		    L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
		     maxZoom: 18,
		        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		    }).addTo(map);
		    map._initPathRoot();	
		    
		}	

		//draw the data
    function drawFeatures(sparql) {
      var svg = d3.select('#map').select('svg');
      var svgMap = svg.append('g').attr('id', 'svgMap');

      var transform = d3.geoTransform({point: projectPoint});
      var path = d3.geoPath().projection(transform)

      //Some custom map data in topoJSON Format 
      //from https://statistik.zh.ch/internet/justiz_inneres/statistik/de/daten/Raeumliche_Daten/Basiskarten.html
      //can be anything
      d3.json('data/gem_kanton.json', function(error, mapData) {
      	//Gemeindeumrisse
      	var featureElement = svgMap.selectAll('path.gemeinde')
      		.data(mapData.features)
      		.enter()
      		.append("path")
      		.attr("d", path)
      		.attr('class', 'gemeinde')
      		.style('stroke-width', 0.5)
      		.style('stroke', function(d) {
      			if(d.properties.ART_TEXT == 'See') {
      			    return 'steelblue';
      			} else {
      			    return 'lemonChiffon';
      			}
      		})
      		.style('fill', function(d) {
      			if(d.properties.ART_TEXT == 'See') {
      				return 'steelblue'
      			} else {
      			    return 'lemonChiffon';
      			}
      		})
      		.style('fill-opacity', function(d) {
      			if(d.properties.ART_TEXT == 'See') {
      				return 0.6;
      			} else {
      			  return 0.1;
      			}
      		})
      		.on('mouseover', function(d) {
      			//Do whatever you want with your Map-Data
      		})
      		.on('mouseout', function() {
      			//undo what ever you wanted to do with your Map-Data on Mouse-Out
      		})
      		.on('click', function() {
      			//or maybe some click-action?
      		});
      		
    		//Recode of the Coordinates, so that leaflet understands them
    		sparql.forEach(function(d) {
    			var koordinaten = d.coord.replace("Point(","").replace(")", '');
					d.LatLng = new L.LatLng(koordinaten.substr(koordinaten.indexOf(' '), 10),koordinaten.substr(0, koordinaten.indexOf(' ')));

				})

    		//render the sparql-query result
				//console.log(sparql);
    		var circles = svgMap.selectAll('circle')
    			.data(sparql)
    			.enter()
    			.append('circle')
    			.style('cursor', 'pointer')
					.style("stroke", "black")  
					.style("opacity", .6) 
					.style("fill", "steelblue")		
					.attr("r", 10)
					.attr('cx', function(d) { return map.latLngToLayerPoint(d.LatLng).x; })
					.attr('cy', function(d) { return map.latLngToLayerPoint(d.LatLng).y; })
					.on('mouseover', function(d) {
						var bilder = svgMap
							.append('image')
	      			.attr('class', 'image')
							.attr('x', map.latLngToLayerPoint(d.LatLng).x )
							.attr('y', map.latLngToLayerPoint(d.LatLng).y )
							.attr('width', 100)
							.attr('height', 100)
							.attr('xlink:href', d.image );  
					})
					.on('mouseout', function() {
						d3.selectAll('.image').remove();
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
  		   	circles
						.attr('cx', function(d) { return map.latLngToLayerPoint(d.LatLng).x; })
						.attr('cy', function(d) { return map.latLngToLayerPoint(d.LatLng).y; });
					
    		}
      })
		}
	};
}());
