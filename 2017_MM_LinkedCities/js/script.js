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
			var endpoint = "https://ld.geo.admin.ch/query";
			var limit = document.getElementById('limit').value;
			var canton = document.getElementById('canton').value;
			var query = d3.select("#sparql").property("value")+' '+limit;
			query = query.replace('?bfsNumber="1"','?bfsNumber="'+canton+'"');
			if(+canton<=26) {
				d3.sparql(endpoint, query, function (error, data) {
					render(data,limit,canton);
				})
			} else {
				window.alert('Die Schweiz hat nur 26 Kantone');
			}
		}
		d3.selectAll('.inputNumber').on('keypress', function() {
			update(d3.event.keyCode);
		})
		function update(e) {
			if (e == 13) {
				queryRender();
			}
		};

		queryRender();

		function render(data,limit,canton) {
			var barWidth = w/limit-10;
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

			bars
				.attr('x', function(d,i) { return i*(barWidth+5); })
				.attr('y', function(d) { return popScale(+d.Population.valueOf()); })
				.attr('height', function(d) { return h-popScale(+d.Population.valueOf()); })
				.attr('width', barWidth);
			bars.exit().remove();

			var names = d3.select('#svg').selectAll('g.text')
				.data(data);

			names.enter()
				.append('g')
				.attr('class','text')
				.attr('transform', function(d,i) { return 'translate('+(i*(barWidth+5)+barWidth)+','+(h+5)+')rotate(-90)';})	
				.append('text')
					.attr('x', 0)
					.attr('y', 0)
					.style('text-anchor', 'end')
					.text(function(d) { return d.Name; });
			names
				.attr('transform', function(d,i) { return 'translate('+(i*(barWidth+5)+barWidth)+','+(h+5)+')rotate(-90)';})
				.select('text')
					.text(function(d) { return d.Name; });

			names.exit().remove();

		}



	};
}());