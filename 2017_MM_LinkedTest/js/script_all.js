(function () {

	window.onload = function () {
		console.log('Fenster ist geladen.');
		var margin = {top: 20, right: 20, bottom: 100, left: 20},
			gRatio = (1+Math.sqrt(5))/2,
			w = 570 - margin.left - margin.right,
			h = 300 - margin.top - margin.bottom,
			Limit = 10,
			barWidth = w/Limit-10;


		//add svg-container for vis+legende
		var svg = d3.select('#visDiv')
			.append('svg')
				.attr('width', w + margin.left + margin.right)
				.attr('height', h + margin.top + margin.bottom)
			.append('g')
				.attr('id', 'svg')
				.attr("transform", "translate(" + (margin.left) + "," + margin.top + ")");


		/* Uncomment to see debug information in console */
		// d3sparql.debug = true
			var endpoint = "https://ld.geo.admin.ch/query";
			var sparql = d3.select("#sparql").property("value")+' '+Limit;
			d3.sparql(endpoint, sparql, render)


		function render(data) {
		/* set options and call the d3spraql.xxxxx function in this library ... */
			var config = {
			  "selector": "#result"
			}
			console.log(data);
			var popMax = d3.max(data, function(d) { return +d.Population.valueOf(); });
			console.log(popMax);
			var popScale = d3.scaleLinear()
				.domain([0,popMax])
				.range([h,0]);

			var bars = d3.select('#svg').selectAll('rect')
				.data(data);

			bars.enter()
				.append('rect')
				.attr('x', function(d,i) { return i*(barWidth+5); })
				.attr('y', function(d) { return popScale(+d.Population.valueOf()); })
				.attr('height', function(d) { return h-popScale(+d.Population.valueOf()); })
				.attr('width', barWidth)
				.style('fill', 'steelblue')
				.style('stroke', 'white');

			var names = d3.select('#svg').selectAll('text')
				.data(data);

			names.enter()
				.append('g')
				.attr('transform', function(d,i) { return 'translate('+(i*(barWidth+5)+barWidth)+','+(h+5)+')rotate(-90)';})	
				.append('text')
					.attr('x', 0)
					.attr('y', 0)
					.style('text-anchor', 'end')
					.text(function(d) { return d.Name; });

		}



	};
}());