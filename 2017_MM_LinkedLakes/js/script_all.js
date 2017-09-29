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


    var defs = d3.select('#svg').append("defs")
    var pattern = defs
        .append("pattern")
        //.attr({ id:"hash4_4", width:"3", height:"3", patternUnits:"userSpaceOnUse", patternTransform:"rotate(60)"})
	        .attr('id', 'hash4_4')
	        .attr('width','4')
	        .attr('height','4')
	        .attr('patternUnits',"userSpaceOnUse")
	        .attr('patternTransform',"rotate(60)")
	     .append("rect")
	        .attr('width','2')
	        .attr('height','4')
	        .attr('transform',"translate(0,0)")
	        .attr('fill',"grey" );
	
    var info = d3.select('#mouseOverGem')           
        .append('svg')
            .attr('id', 'svgAll')
            .attr('width', 570 + margin.left + margin.right)
            .attr('height', 20 + margin.top + margin.bottom)
        .append('g')
            .attr('id', 'all')
            .attr("transform", "translate(" + (margin.left-60) + "," + (margin.top-20) + ")");	

		///////////////////////////
		//
		// Parameter
		//	


 		// var colorBez = d3.scaleOrdinal()
 		// 	.domain(['Affoltern', 'Andelfingen', 'Bülach', 'Dielsdorf', 'Dietikon', 'Hinwil', 'Horgen', 'Meilen', 'Pfäffikon', 'Uster', 'Winterthur', 'Zürich'])
 		// 	.range(statColorLibrary.zhPaired[12]);
	    
  		parseYear = d3.timeParse("%Y");
	    formatYear = d3.timeFormat("%Y");

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

		
		///////////////////////////
		//
		// Data
		//


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

		var endPoint,
			query;

		function querySel(queryNr) {
			if (queryNr==1) {
				query = `PREFIX schema: <http://schema.org/>
		      PREFIX gn: <http://www.geonames.org/ontology#>
		      select ?Municipality ?Name ?Population ?Canton
		      where
		      {
		      ?Municipality a gn:A.ADM3 .
		      ?Municipality gn:parentADM1 ?Canton .
		      ?Municipality schema:name ?Name .
		      ?Municipality gn:population ?Population .
		      ?Municipality <http://purl.org/dc/terms/issued> ?Date .
		      ?Canton <https://ld.geo.admin.ch/def/bfsNumber> ?bfsNumber .
		      FILTER (?Date = "2016-01-01"^^xsd:date)
		      FILTER (?bfsNumber = "2"^^xsd:integer) .
		      }
		      ORDER BY DESC(?Population)
		      LIMIT 15`;
		     endPoint = "https://ld.geo.admin.ch/query";
		  } else if (queryNr==2) {
		    query = `#Timeline of space probes
			    #defaultView:Timeline
			    SELECT ?item ?itemLabel ?launchdate (SAMPLE(?image) AS ?image)
			    WHERE
			    {
			      ?item wdt:P31 wd:Q26529 .
			        ?item wdt:P619 ?launchdate .
			      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
			        OPTIONAL { ?item wdt:P18 ?image }
			    }
			    GROUP BY ?item ?itemLabel ?launchdate`;
			  endPoint = "https://query.wikidata.org/bigdata/namespace/wdq/sparql";
			} else if (queryNr==3) {
		    query = `
		    	#Korrespondierende Ressource in Wikidata und GeoNames (Gemeinde)
		    	PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
					PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
					PREFIX wdt: <http://www.wikidata.org/prop/direct/>
					PREFIX wikibase: <http://wikiba.se/ontology#>
					PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
					PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
					PREFIX wd: <http://www.wikidata.org/entity/>
					PREFIX fn: <http://www.w3.org/2005/xpath-functions#>

					SELECT ?Municipality ?Name ?WikidataURI ?GeoNamesURI WHERE {
					    ?Municipality a <http://schema.org/AdministrativeArea> . #specify only the non-versioned entries.
					    ?Municipality <http://schema.org/name> ?Name .	
					    ?Municipality a <http://www.geonames.org/ontology#A.ADM3> . #municipality only
					    ?Municipality <https://ld.geo.admin.ch/def/bfsNumber> ?bfsNumber . #connect to the ?bfsNumber found in wikidata.
					  	{
					    SELECT DISTINCT (xsd:integer(?bfs) AS ?bfsNumber) ?WikidataURI ?GeoNamesURI WHERE {
					 		SERVICE <https://query.wikidata.org/bigdata/namespace/wdq/sparql>
							{
					        	?WikidataURI wdt:P771 ?bfs . #look for bfs number in WD
					            ?WikidataURI wdt:P31 wd:Q70208 . #municipality of Switzerland
					            ?WikidataURI wdt:P1566 ?GeoNamesId .        
					    	}
					      BIND(IRI(CONCAT(STR("http://sws.geonames.org/"), ?GeoNamesId, "/")) AS ?GeoNamesURI)
					  	}
					  }
					}
					ORDER BY ?Name`;
				endPoint="https://ld.geo.admin.ch/query";
			} else if (queryNr==4) {
				query = `#Liste aller Seen in der Schweiz
					#defaultView:Map
			SELECT ?itemDescription ?image ?coord ?kanton ?item WHERE {
			  ?item (wdt:P31/wdt:P279*) wd:Q23397.
			  ?item wdt:P625 ?coord.
			  OPTIONAL { ?item wdt:P18 ?image. }
			  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
			  ?item wdt:P131 wd:Q11943.
					}`;
				endPoint = "https://query.wikidata.org/bigdata/namespace/wdq/sparql";
			}
		}

		querySel(4);

		d3.sparql(endPoint, query, function(error, data) {
		  if (error) throw error;
		  console.log(data); // [{'developerName': 'Mike Bostock'}]


      addLmaps();
      console.log('maps added');
			//karteZ();
			
      drawFeatures(data); 

      map.addControl(new customControl1());


		})

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
    function resetZoom() {
        ebene = 'gem';
        map.setView([latOrg, lngOrg], 10);
        d3.selectAll('.image').remove();
        //d3.selectAll('.gemeinde').style('fill-opacity', 0.3);
    }
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }
    
		function addLmaps() {
		    latOrg = 47.43;
		    lngOrg = 8.64;
		    zoomOrg = 10;
		    map = L.map('map').setView([latOrg, lngOrg], zoomOrg);
		    
		    //Stamen_Toner
		    // L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
		    //     attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
		    //     subdomains: 'abcd',
		    //     minZoom: 0,
		    //     maxZoom: 20,
		    //     ext: 'png'
		    // }).addTo(map);
		    
		    //Esri_WorldTopoMap
		    // L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
		    //     attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
		    // }).addTo(map);
		    
		    // //Esri_WorldImagery
		    // L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		    //     attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
		    // }).addTo(map); 


		    // L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		    //     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		    //                                              }).addTo(map);
		
		    //OpenStreetMap_BlackAndWhite
		    L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
		     maxZoom: 18,
		        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		    }).addTo(map);
		    map._initPathRoot();	
		    
		}		
    function drawFeatures(sparql) {
      var svg = d3.select('#map').select('svg');
      var svgMap = svg.append('g').attr('id', 'svgMap');
      mapPfade =  svg.append("g")
          .attr('id', 'mapPfade')
          .attr('transform', 'translate(0,0)');

      var transform = d3.geoTransform({point: projectPoint});
      var path = d3.geoPath().projection(transform)
      d3.json('data/gem_kanton.json', function(error, mapData) {
      	// projection = d3.geoOrthographic()
      	//   	.rotate([-8, -48,0])
      	// 	.fitExtent([[10, 0], [570, 600]], map);
      	// path = d3.geoPath().projection(projection);
      	
      	var featureElement = svgMap.selectAll('path.gemeinde')
      		.data(mapData.features)
      		.enter()
      		.append("path")
      		.attr("d", path)
      		.attr('class', 'gemeinde')
      		.style('cursor', 'pointer')
      		.style('stroke-width', 0.5)
      		.style('stroke', function(d) {
      			if(d.properties.ART_TEXT == 'See') {
      			    return 'steelblue';
      			} else {
      			    return 'grey';
      			}
      		})
      		.style('fill', function(d) {
      			if(d.properties.ART_TEXT == 'See') {
      				return 'url(#hash4_4)'
      			} else {
      			    return 'white';
      			}
      		})
      		.style('fill-opacity', function(d) {
      			if(d.properties.ART_TEXT == 'See') {
      				return 0.4;
      			} else {
      			    return 0.1;
      			}
      		})
      		.on('mouseover', function(d) {
      			var bBox = this.getBBox();
      			var centre = {};
      			centre.x = bBox.x + bBox.width/2;
      			centre.y = bBox.y + bBox.height/2;
      		})
      		.on('mouseout', function() {
      			d3.select('#mouseOverText').remove();
      		})
      		.on('click', console.log('click'));
      		

      		sparql.forEach(function(d) {
      			var koordinaten = d.coord.replace("Point(","").replace(")", '');
						d.LatLng = new L.LatLng(koordinaten.substr(koordinaten.indexOf(' '), 10),koordinaten.substr(0, koordinaten.indexOf(' ')));

					})
					console.log(sparql);
      		var circles = svgMap.selectAll('circle')
      			.data(sparql)
      			.enter()
      			.append('circle')
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


					// var bilder = svgMap.selectAll('image')
     //  			.data(sparql)
     //  			.enter()
     //  			.append('image')
     //  			.attr('class', 'image')
					// 	.attr('x', function(d) { return map.latLngToLayerPoint(d.LatLng).x; })
					// 	.attr('y', function(d) { return map.latLngToLayerPoint(d.LatLng).y; })
					// 	.attr('width', 100)
					// 	.attr('height', 100)
					// 	.attr('xlink:href', function(d) { return d.image; });  


      		map.on('viewreset', update);
      		//update();
      		map.on("zoomend", function(){
      		    zoomLev = map.getZoom();
      		});


				// circles.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
      		function update() {	
      		  console.log(zoomLev);
    		    featureElement.attr('d', path);
    		   	circles
						.attr('cx', function(d) { return map.latLngToLayerPoint(d.LatLng).x; })
						.attr('cy', function(d) { return map.latLngToLayerPoint(d.LatLng).y; });  
						
						// bilder
						// .attr('x', function(d) { return map.latLngToLayerPoint(d.LatLng).x; })
						// .attr('y', function(d) { return map.latLngToLayerPoint(d.LatLng).y; })
      		}
      		
        		
      })

    }
		function karteZ() {

			var karteZGr = svg.append('g').attr('id', 'karteZGr');
			d3.json('data/gem_kanton.json', function(error, map) {
				projection = d3.geoOrthographic()
				  	.rotate([-8, -48,0])
					.fitExtent([[10, 0], [570, 600]], map);
				path = d3.geoPath().projection(projection);
				
				karteZGr.selectAll('path.gemeinde')
					.data(map.features)
					.enter()
					.append("path")
					.attr("d", path)
					.attr('class', 'gemeinde')
					.style('cursor', 'pointer')
					.style('stroke-width', 0.5)
					.style('stroke', function(d) {
						if(d.properties.ART_TEXT == 'See') {
						    return 'steelblue';
						} else {
						    return 'grey';
						}
					})
					.style('fill', function(d) {
						if(d.properties.ART_TEXT == 'See') {
							return 'url(#hash4_4)'
						} else {
						    return 'white';
						}
					})
					.style('fill-opacity', function(d) {
						if(d.properties.ART_TEXT == 'See') {
							return 0.4;
						} else {
						    return 0.1;
						}
					})
					.on('mouseover', function(d) {
						var bBox = this.getBBox();
						var centre = {};
						centre.x = bBox.x + bBox.width/2;
						centre.y = bBox.y + bBox.height/2;
						karteZGr.append('text')
							.attr('id', 'mouseOverText')
							.attr('x', centre.x)
							.style('font-size', 14+'px')
							.attr('pointer-events', 'none')
							.attr('y', centre.y)
							.style('text-anchor', 'middle')
							.text(d.properties.GEMEINDENA);

					})
					.on('mouseout', function() {
						d3.select('#mouseOverText').remove();
					})
					.on('click', console.log('click'));
					
			})
		}
	};
}());
