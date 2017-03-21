
import L from "leaflet";
import $ from "jquery";
import pulseIcon from "leaflet-pulse-icon";

'use strict';


let app = {

	defaultOptions: {
		coordsNorthingFirst: true, // Set to true if coords are in format [easting, northing]
		minFeatureSize: 5,
		maxFeatureSize: 30,
		highlightMax: true,
		highlightMin: true,
		highlightPopup: true,
		zoomToHighlights: true,
		style: {
			fillOpacity: 0.2,
			opacity: 0
		},
		geoIndex: 0,
		valueIndex: 1,
		// relativeStyling: false, // style based on min/max values for each data volume. If false, max for whole dataset is used
		flyToBoundsOnUpdate: true
	},

	filterSettings: {
		maxFilter: {
			popupText: '<h3>Highest: ${value}</h3>',
			color: '#e83012'
		},
		minFilter: {
			popupText: '<h3>Lowest: ${value}</h3>',
			color: '#159'
		}
	},

	_timeouts: [],

	/**
	 * Returns clone of default options merged with overriding options (if any set)
	 * @return {Object}
	 */
	getOptions() {
		let props = this._layout.props;
		let sizeRange = props.highlightSettings.sizeRange || null;
		return $.extend(true, {}, this.defaultOptions, {
			highlightMax: props.highlightSettings.max,
			highlightMin: props.highlightSettings.min,
			minFeatureSize: sizeRange ? sizeRange[0] : null,
			maxFeatureSize: sizeRange ? sizeRange[1] : null,
			flyToBoundsOnUpdate: props.highlightSettings.flyToBoundsOnUpdate,
			coordsNorthingFirst: props.advancedSettings.coordsNorthingFirst,
			geoIndex: props.advancedSettings.geoIndex,
			valueIndex: props.advancedSettings.valueIndex
		});
	},

	_needsToRender(layout) {
		return true;
	},

	render($element, layout) {
		return this._needsToRender(layout) ? this._render.apply(this, arguments) : null;
	},


	// _getMinMaxFromData(qMatrix) {
	// 	var valIndex = this.options().valueIndex;
	// 	var val,
	// 		minVal = Infinity,
	// 		maxVal = -Infinity;
	// 	qMatrix.forEach(function(step) {
	// 		val = step[valIndex].qNum;
	// 		if (isNaN(val)) 
	// 			return;
	// 		minVal = Math.min(val, minVal);
	// 		maxVal = Math.max(val, maxVal);
	// 	});
	// 	return {
	// 		minVal: minVal,
	// 		maxVal: maxVal
	// 	}
	// },

	_render($element, layout) {
		this._layout = layout;
		this._renderCount = this._renderCount === undefined ? 0 : this._renderCount + 1;

		this._timeouts.forEach( (timeout) => {
			clearTimeout(timeout);
		});
		this._timeouts = [];

		if (!this._dataIsValid(layout)) {
			if (this.timeLayer) {
				this.timeLayer.clearLayers();
			}
			return false;
		}
		if (!this._$map) {
			this._drawMap($element);
			this.map.fitWorld();
		}
		let hc = $.extend(true, {}, layout.qHyperCube),
			qMatrix = hc.qDataPages[0].qMatrix;

		const MIN_VAL = hc.qMeasureInfo[0].qMin;
		const MAX_VAL = hc.qMeasureInfo[0].qMax;
		// if (this.getOptions().relativeStyling) {
		// 	let stats = this._getMinMaxFromData(qMatrix);
		// 	MIN_VAL = stats.minVal;
		// 	MAX_VAL = stats.maxVal;
		// }
		
		let layer = this._createLayerFromMatrix(qMatrix, MIN_VAL, MAX_VAL);
		this.layer = layer;
		this._renderStep(layer);
		// this.goToStep(0);
		return true;

	},

	_createLayerFromMatrix(steps, MIN_VAL, MAX_VAL) {
		var self = this;
		var step,
			feature,
			layer = L.featureGroup();
		// var createFeatureFromStep = this._createFeatureFromStep; //.bind(this);
		for (var i = 0; i < steps.length; i++) {
			step = steps[i];
			feature = this._createFeatureFromStep(step, MIN_VAL, MAX_VAL);
			if (feature) {
				layer.addLayer(feature);
			}
		}
		layer.setStyle(this.getOptions().style);
		return layer;

	},

	_swapCoords(coordsArr) {
		return coordsArr.reverse(); // Polyfill exists for reverse in IE11 in Sense?
	},

	_createFeatureFromStep(step, MIN_VAL, MAX_VAL) {
		const options = this.getOptions();

		var measureValue = step[options.valueIndex].qNum,
			measureText = step[options.valueIndex].qText,
			latLngArr;
		if (typeof(measureValue) !== "number") {
			return null;
		}
		try {
			latLngArr = JSON.parse(step[options.geoIndex].qText); // Convert projection????
		} catch(e) {
			// throw Error("Cannot parse lat lng");
			console.log("Cannot parse lat/lng from string");
			return null;
		}
		if (isNaN(latLngArr[0]) || isNaN(latLngArr[1])) {
			return null;
		}
		latLngArr = options.coordsNorthingFirst ? this._swapCoords(latLngArr) : latLngArr;

		// Create a radius and color based on the measure value


		var radius = parseInt(this._normalizeValue(MIN_VAL, MAX_VAL, measureValue, options.minFeatureSize, options.maxFeatureSize)),
			colorValue = parseInt(this._normalizeValue(MIN_VAL, MAX_VAL, measureValue, 0, 255));

		// console.log(measureValue + "->" + radius);
		var color = "rgb(" + [colorValue, 0, 0].join(", ") + ")";
		var feature = L.circleMarker(latLngArr, {radius, color, fillColor: color});
		feature.properties = feature.properties || {};
		feature.properties.value = measureValue;
		feature.properties.valueText = measureText;
		return feature;
	},

	highlightFeature(feature) {
		// if (!this.$canvas) {
		// 	this.$canvas = $('<canvas class="qv-highlight-canvas" />');
		// }
		// $(".qv-object-qshighlightmap-mapdiv").append(this.$canvas);
		// this._drawCanvasHole(feature._point.x, feature._point.x + feature._radius * 2, feature._point.y, feature._point.y + feature._radius * 2);

		var latLng = feature.getLatLng();
		this.fadeLayer(this.timeLayer, false);
		this.map.flyTo(latLng, 10, {duration: 2});

		this._timeouts.push(
			setTimeout(() => {
				this.fadeLayer(this.timeLayer, true);
			}, 4000)
		);
	},

	// _drawCanvasHole(left, right, top, bottom) {

	// 	var c = this.$canvas[0];
	// 	var ctx = c.getContext("2d");
	// 	// ctx.clearRect (0, 0, c.width, c.height);

	// 	var winWidth = $(".qv-object-qshighlightmap-mapdiv").width(),
	// 		winHeight = $(".qv-object-qshighlightmap-mapdiv").height();
	// 	c.width = winWidth;
	// 	c.height = winHeight;

	// 	// ctx.fillRect(0,0,winWidth,winHeight);
	// 	ctx.beginPath(); // needed for IE and Edge
	// 	ctx.moveTo(0, 0);
	// 	ctx.lineTo(winWidth, 0);
	// 	ctx.lineTo(winWidth, winHeight);
	// 	ctx.lineTo(0, winHeight);
	// 	ctx.lineTo(0, 0);
	// 	ctx.closePath();

	// 	// Draw bbox
	// 	ctx.moveTo(left, top);
	// 	ctx.lineTo(left, bottom);
	// 	ctx.lineTo(right, bottom);
	// 	ctx.lineTo(right, top);
	// 	ctx.lineTo(left, top);
	// 	ctx.closePath();

	// 	ctx.fillStyle = "rgba(0,0,0,0.5)";
	// 	ctx.shadowColor = 'rgba(0,0,0,1)';
	// 	ctx.shadowBlur = 20;
		
	// 	ctx.fill();
		
	// }


	// filterIntersectingMarkers(markers, bufferMeters) {
	// 	var marker, latLng,
	// 		out = [], m;
	// 	for (var i = 0; i < markers.length; i++) {
	// 		marker = markers[i];
	// 		latLng = marker.getLatLng();
	// 		isValid = true;
	// 		for (var j = 0; j < out.length; j++) {
	// 			m = out[j];
	// 			if (latLng.distanceTo(m.getLatLng()) < bufferMeters) {
	// 				isValid = false;
	// 				break;
	// 			}
	// 		}
	// 		if (isValid) {
	// 			out.push(marker);
	// 		}
	// 	}
	// 	return out;
	// }

	_drawMap($element) {
		if (!this._$map) {
			// this._drawTimeLabel($element);
			this._$map = $('<div id="qv-object-qshighlightmap-mapdiv" class="qv-object-qshighlightmap-mapdiv" />');
			$element.append(this._$map);
			this.map = L.map(this._$map[0], {
				// preferCanvas: true
				// zoomDelta: 0.1
			});
			var osm = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
				maxZoom: 18,
				attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>'
			});
			this.map.addLayer(osm);
			// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			// 	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
			// }).addTo(this.map);
			this.map.fitWorld();

			// this.map.fitWorld();
		}
		if (!this.timeLayer) {
			this.timeLayer = L.featureGroup();
			this.map.addLayer(this.timeLayer);
		}
	},

	_drawTimeLabel($element) {
		var $div = $('<div class="qv-time-header"><label>Time step</label></div>');
		$element.prepend($div);

		// Draw navbar
		var $nav = $('<div class="qv-time-nav">'+
				'<div class="nav-btn">\<</div>'+
				'<div class="nav-btn">\></div>'+
			'</div>');
		$element.prepend($nav);
		$nav.find(".nav-btn:eq(0)").on("click", this.goToPrev.bind(this));
		$nav.find(".nav-btn:eq(1)").on("click", this.goToNext.bind(this));

	},

	notify( text ) {
		alert(text);
	},

	_dataIsValid( layout ) {
		if (!layout) {
			return false;
		}
		if (!layout.qHyperCube.qDataPages || !layout.qHyperCube.qDataPages.length) {
			console.log("No qDataPages");
			return false;
		}
		try {
			var isValidCoords = JSON.parse( layout.qHyperCube.qDataPages[0].qMatrix[0][0].qText );
		} catch(e) {
			console.warn("Invalid coords", layout.qHyperCube.qDataPages[0].qMatrix[0][0].qText);
			// return false;
		}
		return true;
		
	},

	filterMarkers(layer, filter) {
		var markers = [],
			self = {},
			winnerMarker;
		
		layer.eachLayer(function(feature) {
			if (filter.call(self, feature.properties.value) === true) {
				winnerMarker = feature;
			}
		});
		if (!winnerMarker) {
			return null;
		}
		winnerMarker.properties = winnerMarker.properties || {};
		winnerMarker.properties._filterType = filter.name;
		return winnerMarker;
	},

	_renderStep(layer) {
		// $(".qv-object-com-qliktech-qshighlightmap .qv-time-title").text(timeString);
		var self = this,
			count = 0,
			maxVal = -Infinity;

		var maxFilter = function(value) {
			if (!this._bestValueSoFar) {
				this._bestValueSoFar = -Infinity;	
			}
			var prevBestVal = this._bestValueSoFar;
			this._bestValueSoFar = Math.max(this._bestValueSoFar, value);
			return prevBestVal < value;
		}
		var minFilter = function(value) {
			if (!this._bestValueSoFar) {
				this._bestValueSoFar = Infinity;	
			}
			var prevBestVal = this._bestValueSoFar;
			this._bestValueSoFar = Math.min(this._bestValueSoFar, value);
			return prevBestVal > value;
		}
		var options = this.getOptions();
		var highlightMarkers = [];
		if (options.highlightMax) {
			var maxMarker = this.filterMarkers(layer, maxFilter);
			if ( maxMarker ) {
				highlightMarkers.push( maxMarker );
			}
		}
		if (options.highlightMin) {
			var minMarker = this.filterMarkers(layer, minFilter);
			if ( minMarker ) {
				highlightMarkers.push( minMarker );
			}
		}
		
		highlightMarkers = highlightMarkers.length ? this.createPulsingMarkers(highlightMarkers) : null;

		this._renderLayer(layer);
		this._renderPulsingMarkers(highlightMarkers);

	},

	fadeLayer(layer, fadeIn) {
		fadeIn = fadeIn || false;

		let layerDiv = layer.getPane();
		let $layerDiv = $(layerDiv);

		if (fadeIn) {
			// Fade in
			$layerDiv.addClass("layer-transition-opacity");
			this._timeouts.push(
				setTimeout( () => {
					$layerDiv.removeClass("layer-dimmed");
				}, 1)
			);
		}
		else {
			// Fade out
			$layerDiv.removeClass("layer-transition-opacity");
			$layerDiv.addClass("layer-dimmed");
		}


	},
	
	_renderLayer(layer) {
		let bounds = this.timeLayer.getBounds();
		
		const FLY_DURATION_MS = 500;
		const FLY_DELAY_MS = 1000;

		this.timeLayer.clearLayers();
		this.timeLayer.addLayer(layer);
		
		
		if (!this._renderCount === 0) {
			this.map.setBounds(bounds);
		}
		else if (this.getOptions().flyToBoundsOnUpdate) {
			this.fadeLayer(this.timeLayer, false);
			this._timeouts.push(
				setTimeout( () => {
					this.map.flyToBounds(bounds, {
						duration: FLY_DURATION_MS / 1000
					})
				}, FLY_DELAY_MS)
			);
			this._timeouts.push(
				setTimeout( () => {
					this.fadeLayer(this.timeLayer, true);
				}, FLY_DURATION_MS)
			);
		}

		

		// setTimeout((function() {
		// 	this.fadeLayer(this.timeLayer, true);
			
		// 	setTimeout((function() {
		// 		var pulsingIcon = new L.Icon.Pulse({iconSize: [20, 20], color: '#159'});
		// 		this._extraMarker = L.marker(this.highlightMarker.getLatLng(), {icon: pulsingIcon}).addTo(this.timeLayer);
		// 		this.highlightMarker.openPopup();
				
		// 		setTimeout((function() {
		// 			this.highlightFeature(this.highlightMarker);
		// 		}).bind(this), 2000);

		// 	}).bind(this), 2000);

		// }).bind(this), 1500);
	},

	_renderPulsingMarkers(highlightMarkers) {
		const PULSING_MARKER_DELAY_MS = 1500;
		// Let the map zoom to bounds of all data before adding highlight markers
		this._timeouts.push(
			setTimeout( () => {
				highlightMarkers.forEach(marker => {
					this.layer.addLayer(marker);
					marker.openPopup();
				});
			}, PULSING_MARKER_DELAY_MS)
		);
	},

	createPulsingMarkers(markers) {
		let pulsingMarkers = [];
		markers.forEach( (marker) => {
			let filterOptions = this.filterSettings[ marker.properties._filterType ];
			let pulsingIcon = new L.Icon.Pulse({iconSize: [20, 20], color: filterOptions.color, heartbeat: marker.properties._filterType === "minFilter" ? 2 : 1 }); // TODO: Different style for different types of highlights
			let highlightMarker = L.marker(marker.getLatLng(), {icon: pulsingIcon}).addTo(this.timeLayer);
			highlightMarker.properties = $.extend(true, {}, marker.properties);
			let popupText = filterOptions.popupText || "No text";
			highlightMarker.bindPopup(popupText.replace(/\$\{value\}/g, highlightMarker.properties.valueText), {
				autoClose: false,
				autoPan: false
			});
			pulsingMarkers.push(highlightMarker);
			// highlightMarker.openPopup();
		});
		return pulsingMarkers;
	},

	_normalizeValue(min, max, val, desiredMin, desiredMax) {
		desiredMin = desiredMin || 0;
		desiredMax = desiredMax || 1;
		
		return (desiredMax - desiredMin) * (val - min) / (max - min) + desiredMin;
	}
};


export default app;
































