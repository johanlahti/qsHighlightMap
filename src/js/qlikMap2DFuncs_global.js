var funcs = {

		// setData: function( newData ) {
		// 	$.extend(true, this.data, newData);
		// 	// this.data.sequence = newData.sequence;
		// 	// this.data.indexedSteps = data.indexedSteps;
		// },

		// getData: function() {
		// 	return $.extend(true, {}, this.data); // deep copy
		// },

		style: {
			// fillColor: "#FF0000",
			// color: "#159",
			fillOpacity: 0.2,
			opacity: 0
		},

		render: function( $element ) { //, layout ) {

			// Q: Is there a slider comopnent already in Qlik Sense which can be re-used? How? Otherwise, use input range or bootstrap-seyria slider
			// Q: Is it possible to update the selection (like: year = 2006) when the slider moves, so that other charts also update?
			// var mInfo = layout.qHyperCube.qMeasureInfo[0];
			// var minMeasureVal = mInfo.qMin,
			// 	maxMeasureVal = mInfo.qMax;



			if (!layout.qHyperCube.qDataPages.length) {
				console.log("No qDataPages");
				return;
			}

			// this.stop();
			if ( !this._$map ) {
				this._drawMap( $element );
				this.map.fitWorld();
			}
			// this.map.setView([51.505, -0.09], 10);
			var hc = $.extend(true, {}, layout.qHyperCube);
			var allSteps = hc.qDataPages[0].qMatrix;

			// var allStepsFiltered = [],
			// 	temp = [],
			// 	step, coords;
			// for (var i = 0; i < allSteps.length; i++) {
			// 	step = allSteps[i];
			// 	coords = step[1].qText;
			// 	if ( temp.indexOf(coords) > -1 ) {
			// 		continue;
			// 	}
			// 	temp.push( coords );
			// 	allStepsFiltered.push( step );
			// }
			var allStepsFiltered = allSteps;
			
			// var minMeasureVal = hc.qMeasureInfo.qMin;
			// var maxMeasureVal = hc.qMeasureInfo.qMax;

			var stepsObj = this._indexSteps( allStepsFiltered );
			var sequence = stepsObj.sequence,
				indexedSteps = stepsObj.indexedSteps;
			this.sequence = sequence;
			
			var timeLayers = this.prepareLayers( indexedSteps );
			this.timeLayers = timeLayers;

			this.goToStep( 0 );

			// var layer;
			// for (var k in timeLayers) { 
			// 	// Get first layer
			// 	layer = timeLayers[k];
			// 	break;
			// }

			
			// var count = 0;
			// var maxCount = 6;
			
			// function play() {
			// 	this.goToNext.call(this);
			// 	count += 1;
			// 	if (count > maxCount) {
			// 		return;
			// 	}
			// 	setTimeout( (function() {
			// 		play.call(this);
			// 	}).bind(this), 10000);
				
			// }

			// this.goToStep( 0 );
			// play.call(this, 0);




			// var self = this;
			// this.goToStep( 0 );
			// setTimeout(function() {
			// 	self.goToNext.call(self);
			// 	setTimeout(function() {
			// 		self.goToNext.call(self);
			// 	}, 4000);
			// }, 4000);

			// this.stepIndex = 0;

			// this.play();

		},

		goToNext: function() {
			this.stepIndex += 1;
			this.goToStep( this.stepIndex );
		},

		goToPrev: function() {
			this.stepIndex -= 1;
			this.goToStep( this.stepIndex );
			
		},

		goToStep: function( stepIndex ) {
			var allowRestart = true;
			if ( stepIndex > this.sequence.length - 1 ) {
				stepIndex = allowRestart ? 0 : this.sequence.length - 1;
			}
			else if ( stepIndex < 0 ) {
				stepIndex = allowRestart ? this.sequence.length - 1 : 0;
			}
			this.stepIndex = stepIndex;

			// Update label with current time step
			var timeString = this.sequence[ this.stepIndex ];
			$(".qv-time-header label").removeClass("qv-time-header-slidein");
			$(".qv-time-header label").text( timeString );
			setTimeout(function() {
				$(".qv-time-header label").text( timeString );
				$(".qv-time-header label").addClass("qv-time-header-slidein");
			}, 1000);
			this._renderStep( this.timeLayers, timeString );
		},

		highlightFeature: function( feature ) {
			// if (!this.$canvas) {
			// 	this.$canvas = $('<canvas class="qv-highlight-canvas" />');
			// }
			// $(".qv-object-qlikmap2d-mapdiv").append( this.$canvas );
			// this._drawCanvasHole( feature._point.x, feature._point.x + feature._radius * 2, feature._point.y, feature._point.y + feature._radius * 2 );

			var latLng = feature.getLatLng();
			this.fadeLayer( this.timeLayer, false);
			this.map.flyTo( latLng, 10, {duration: 2} );
			setTimeout( (function() {
				this.fadeLayer( this.timeLayer, true);
			}).bind(this), 2000);
			// feature.openPopup();
		},

		_drawCanvasHole(left, right, top, bottom) {

			var c = this.$canvas[0];
			var ctx = c.getContext("2d");
			// ctx.clearRect (0, 0, c.width, c.height);

			var winWidth = $(".qv-object-qlikmap2d-mapdiv").width(),
				winHeight = $(".qv-object-qlikmap2d-mapdiv").height();
			c.width = winWidth;
			c.height = winHeight;

			// ctx.fillRect(0,0,winWidth,winHeight);
			ctx.beginPath(); // needed for IE and Edge
			ctx.moveTo(0, 0);
			ctx.lineTo(winWidth, 0);
			ctx.lineTo(winWidth, winHeight);
			ctx.lineTo(0, winHeight);
			ctx.lineTo(0, 0);
			ctx.closePath();

			// Draw bbox
			ctx.moveTo(left, top);
			ctx.lineTo(left, bottom);
			ctx.lineTo(right, bottom);
			ctx.lineTo(right, top);
			ctx.lineTo(left, top);
			ctx.closePath();

			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.shadowColor = 'rgba(0,0,0,1)';
			ctx.shadowBlur = 20;
			
			ctx.fill();
			
		},


		filterIntersectingMarkers: function( markers, bufferMeters ) {
			var marker, latLng,
				out = [], m;
			for (var i = 0; i < markers.length; i++) {
				marker = markers[i];
				latLng = marker.getLatLng();
				isValid = true;
				for (var j = 0; j < out.length; j++) {
					m = out[j];
					if (latLng.distanceTo( m.getLatLng() ) < bufferMeters) {
						isValid = false;
						break;
					}
				}
				if ( isValid ) {
					out.push( marker );
				}
			}
			return out;
		},

		_drawMap: function( $element ) {
			if ( !this._$map ) {
				this._drawTimeLabel( $element );
				this._$map = $('<div class="qv-object-qlikmap2d-mapdiv" />');
				$element.append( this._$map );
				this.map = L.map( this._$map[0], {
					// preferCanvas: true
					// zoomDelta: 0.1
				} );
				var osm = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
					maxZoom: 18,
					attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>'
				});
				this.map.addLayer( osm );
				// L.tileLayer( 'http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				// 	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
				// }).addTo( this.map );
				this.map.fitWorld();

				// this.map.fitWorld();
			}
			if ( !this.timeLayer ) {
				this.timeLayer = L.featureGroup();
				this.map.addLayer( this.timeLayer );
			}
		},

		_drawTimeLabel: function( $element ) {
			var $div = $('<div class="qv-time-header"><label>Time step</label></div>');
			$element.prepend( $div );

			// Draw navbar
			var $nav = $('<div class="qv-time-nav">'+
					'<div class="nav-btn"><</div>'+
					'<div class="nav-btn">></div>'+
				'</div>');
			$element.prepend( $nav );
			$nav.find(".nav-btn:eq(0)").on("click", this.goToPrev.bind(this));
			$nav.find(".nav-btn:eq(1)").on("click", this.goToNext.bind(this));

		},

		/**
		 * Make a Leaflet featureGroup filled with markers for each time step.
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		prepareLayers: function( indexedSteps ) {
			var self = this;
			var bufferMeters = 10000;
			var layer, timeLayers = {}, steps, step;
			for ( var timeString in indexedSteps ) {
				steps = indexedSteps[timeString];
				layer = L.featureGroup();
				layer.setStyle( this.style );
				timeLayers[timeString] = layer;

				var minMeasureVal = steps[0][2].qNum, // arbitrary starting value
					maxMeasureVal = steps[0][2].qNum; // arbitrary starting value
				steps.forEach(function(step) {
					minMeasureVal = step[2].qNum > minMeasureVal ? step[2].qNum : minMeasureVal;
					maxMeasureVal = step[2].qNum < maxMeasureVal ? step[2].qNum : maxMeasureVal;
				});
				var markers = this._createFeatures( steps, minMeasureVal, maxMeasureVal );
				// console.log( "Before", markers.length );
				// markers = self.filterIntersectingMarkers( markers, bufferMeters );
				// console.log( "After", markers.length );
				// layer.addLayer( markers );
				markers.forEach( function( m ) {
					layer.addLayer( m );
					// m.setStyle( self.style );
				} );
			}
			return timeLayers;

		},

		_createFeatures: function( steps, minMeasureVal, maxMeasureVal ) {
			// steps = layout.qHyperCube.qDataPages[0].qMatrix;
			// steps must be an array with values, sorted by the first dimension (probably time):

			// -- Steps: --
			// Dim 1: 	Time
			// Dim 2: 	Coordinates/Location
			// Measure:	The value

			var coords = [],
				markers = [],
				step, time, latLng, marker, val, radius, colorValue, color;
			for ( var i = 0; i < steps.length; i++ ) {
				step = steps[i];
				time = step[0].qText;
				
				var latLngString = step[1].qText;
				if ( coords.indexOf( latLngString ) > -1 ) {
					continue;
				}
				coords.push( latLngString );

				try {
					latLng = JSON.parse( step[1].qText ); // Convert projection????
				}
				catch(e) {
					continue;
				}
				latLng = [latLng[1], latLng[0]];

				val = step[2].qNum; // The value which will set the size/colour of the point

				// convert to a Leaflet feature
				// var myIcon = L.divIcon({className: 'qv-qlikmap2d-markericon'});
				// marker = L.marker(latLng, {icon: myIcon});
				radius = parseInt( this._normalizeValue( minMeasureVal, maxMeasureVal, val, 5, 30) );
				colorValue = parseInt( this._normalizeValue( minMeasureVal, maxMeasureVal, val, 0, 255) );
				color = "rgb("+[colorValue, 0, 0].join(", ") + ")";
				// color = "#0000FF";
				marker = L.circleMarker( latLng, {radius: radius, color: color, fillColor: color} );
				console.log(color);
				marker.properties = marker.properties || {};
				$.extend( marker.properties, {value: val} );
				markers.push( marker );
				marker.bindPopup("<h3>Best city of this month</h3><div>Sales: $"+parseInt(val)+"</div><div>Latitude: "+marker.getLatLng().lat+"</div><div>Longitude: "+marker.getLatLng().lng+"</div>");
			}
			
			return markers;

		},

		

		_renderStep: function( timeLayers, timeString ) {
			// console.log("Rendering step "+timeString, this.stepIndex);
			$(".qv-object-com-qliktech-qlikmap2d .qv-time-title").text( timeString );
			var layer = timeLayers[timeString];
			

			var maxVal = 0;
			this.highlightMarker = null;
			var self = this;
			layer.eachLayer(function(marker) {
				if ( !self.highlightMarker || marker.properties.value > maxVal ) {
					self.highlightMarker = marker;
				}
				count += 1;
			});
			console.log(count);

			
			this._renderTimeLayer( layer );
			var count = 0;


			// if (this.$canvas) {
			// 	this.$canvas.removeClass("canvas-visible");
			// }
			// setTimeout( (function() {
			// 	this.highlightFeature( highlightMarker );
			// 	// this.$canvas.addClass("canvas-visible");
			// }).bind(this), 4000);

			
			

			



		},

		fadeLayer: function(layer, fadeIn) {
			fadeIn = fadeIn || false;

			var layerDiv = layer.getPane();
			var $layerDiv = $(layerDiv);

			if (fadeIn) {
				$layerDiv.addClass("layer-transition-opacity");
				setTimeout(function() {
					$layerDiv.removeClass("layer-dimmed");
				}, 1);
			}
			else {
				$layerDiv.removeClass("layer-transition-opacity");
				$layerDiv.addClass("layer-dimmed");	
			}


		},
		
		_renderTimeLayer: function( layer ) {
			// if (this._extraMarker) {
			// 	this.map.removeLayer(this._extraMarker);
			// }
			this.timeLayer.clearLayers();
			layer.setStyle( this.style );
			this.timeLayer.addLayer( layer );

			var bounds = this.timeLayer.getBounds();

			this.fadeLayer( this.timeLayer, false );
			
			this.map.flyToBounds( bounds, {
				duration: 1.5
			} );
			setTimeout((function() {
				this.fadeLayer( this.timeLayer, true);
				
				setTimeout( (function() {
					var pulsingIcon = L.icon.pulse({iconSize: [20,20], color:'#159'});
					this._extraMarker = L.marker(this.highlightMarker.getLatLng(), {icon: pulsingIcon}).addTo( this.timeLayer );

					this.highlightMarker.openPopup();
					
					setTimeout( (function() {
						this.highlightFeature( this.highlightMarker );
					}).bind(this), 2000);

				}).bind(this), 2000);

			}).bind(this), 1500);
			// this.map.setView([45.4290577, -122.56862640380861], 11);
			
			// this.map.fitBounds( this.timeLayer.getBounds() );


			// this.map.fitBounds( this.timeLayer.getBounds() );
		},

		_indexSteps: function( steps ) {
			var step, timeString,
				sequence = [],
				indexedSteps = {};
			for (var i = 0; i < steps.length; i++) {
				step = steps[i];
				timeString = step[0].qText;
				if (!indexedSteps[timeString]) {
					indexedSteps[timeString] = [];
					sequence.push( timeString );
				}
				indexedSteps[timeString].push( step );
			}
			return {
				indexedSteps: indexedSteps,
				sequence: sequence
			};
		},

		_normalizeValue: function(min, max, val, desiredMin, desiredMax) {
			desiredMin = desiredMin || 0;
			desiredMax = desiredMax || 1;
			
			return (desiredMax - desiredMin) * (val - min) / (max - min) + desiredMin;
		},

		// timeOutify: function( func, params ) {
		// 	var context = this;
		// 	var wrapperFunc = function( delay ) {
		// 		this.timeout = setTimeout( function() {
		// 			func.apply( context, params );
		// 		}, delay );
		// 	}
		// 	return wrapperFunc;
		// },

		// stop: function() {
		// 	clearTimeout( this._playTimeout );
		// 	this._isStopped = true;
		// },

		// play: function( sequence ) {
		// 	this._isStopped = false;
		// 	return this._play( sequence );
		// },

		// _play: function( sequence ) {
		// 	if (this._isStopped) {
		// 		return false;
		// 	}
		// 	var delay = 1000;

		// 	if (this.stepIndex > sequence.length - 1) {
		// 		// Restart sequence
		// 		this.stepIndex = 0;
		// 		// this._playTimeout = setTimeout( (function() {
		// 		this._play();
		// 		// }).bind(this), delay);
		// 		return true;
		// 	}
			
		// 	this._renderStep( sequence[this.stepIndex] );
		// 	this.stepIndex += 1;
		// 	this._playTimeout = setTimeout( (function() {
		// 		this._play();
		// 	}).bind(this), delay);
		// 	return true;
		// },


	};



































