(function () {

	window.onload = function () {
		console.log('Fenster ist geladen.');
		var margin = {top: 20, right: 20, bottom: 100, left: 20},
			gRatio = (1+Math.sqrt(5))/2,
			w = 570 - margin.left - margin.right,
			h = 300 - margin.top - margin.bottom;
			


		//add svg-container for vis+legende
		var svg = d3.select('#visDiv')
			.append('svg')
				.attr('width', w + margin.left + margin.right)
				.attr('height', h + margin.top + margin.bottom)
			.append('g')
				.attr('id', 'svg')
				.attr("transform", "translate(" + (margin.left) + "," + margin.top + ")");

		function queryRender() {
			var endpoint = "https://test.lindas-data.ch/sparql";
			var query = d3.select("#sparql").property("value");


			d3.sparql(endpoint, query, function (error, data) {
				console.log(data);
			})

		}

		queryRender();




	};
}());