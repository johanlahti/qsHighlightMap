
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
		relativeStyling: false, // style based on min/max values for each data volume. If false, max for whole dataset is used
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

	getOptions: function(customOptions={}) {
		return $.extend(true, this.defaultOptions, customOptions); // TODO: Get property panel's options
	},

	_needsToRender: function(layout) {
		return true;
	},

	render: function($element, layout) {
		return this._needsToRender(layout) ? this._render.apply(this, arguments) : null;
	},


	_getMinMaxFromData: function(qMatrix) {
		var valIndex = this.getOptions().valueIndex;
		var val,
			minVal = Infinity,
			maxVal = -Infinity;
		qMatrix.forEach(function(step) {
			val = step[valIndex].qNum;
			if (isNaN(val)) 
				return;
			minVal = Math.min(val, minVal);
			maxVal = Math.max(val, maxVal);
		});
		return {
			minVal: minVal,
			maxVal: maxVal
		}
	},

	_render: function($element, layout) {
		
		this._renderCount = this._renderCount === undefined ? 0 : this._renderCount + 1;

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
		var hc = $.extend(true, {}, layout.qHyperCube); // clone
		var qMatrix = hc.qDataPages[0].qMatrix;

		var minVal = hc.qMeasureInfo[0].qMin,
			maxVal = hc.qMeasureInfo[0].qMax;
		// if (this.getOptions().relativeStyling) {
		// 	var stats = this._getMinMaxFromData(qMatrix);
		// 	minVal = stats.minVal;
		// 	maxVal = stats.maxVal;
		// }
		
		var layer = this._createLayerFromMatrix(qMatrix, minVal, maxVal);
		this.layer = layer;
		this._renderStep(layer);
		// this.goToStep(0);
		return true;

	},

	_createLayerFromMatrix: function(steps, minVal, maxVal) {
		var self = this;
		var step,
			feature,
			layer = L.featureGroup();
		// var createFeatureFromStep = this._createFeatureFromStep; //.bind(this);
		for (var i = 0; i < steps.length; i++) {
			step = steps[i];
			feature = this._createFeatureFromStep(step, minVal, maxVal);
			if (feature) {
				layer.addLayer(feature);
			}
		}
		layer.setStyle(this.getOptions().style);
		return layer;

	},

	_swapCoords: function(coordsArr) {
		return coordsArr.reverse(); // Polyfill exists for reverse in IE11 in Sense?
	},

	_createFeatureFromStep: function(step, minVal, maxVal) {
		var measureValue = step[this.getOptions().valueIndex].qNum,
			measureText = step[this.getOptions().valueIndex].qText,
			latLngArr;
		if (typeof(measureValue) !== "number") {
			return null;
		}
		try {
			latLngArr = JSON.parse(step[0].qText); // Convert projection????
		} catch(e) {
			// throw Error("Cannot parse lat lng");
			console.log("Cannot parse lat/lng from string");
			return null;
		}
		if (isNaN(latLngArr[0]) || isNaN(latLngArr[1])) {
			return null;
		}
		latLngArr = this.getOptions().coordsNorthingFirst ? this._swapCoords(latLngArr) : latLngArr;

		// Create a radius and color based on the measure value


		var radius = parseInt(this._normalizeValue(minVal, maxVal, measureValue, this.getOptions().minFeatureSize, this.getOptions().maxFeatureSize)),
			colorValue = parseInt(this._normalizeValue(minVal, maxVal, measureValue, 0, 255));

		// console.log(measureValue + "->" + radius);
		var color = "rgb(" + [colorValue, 0, 0].join(", ") + ")";
		var feature = L.circleMarker(latLngArr, {radius: radius, color: color, fillColor: color});
		feature.properties = feature.properties || {};
		feature.properties.value = measureValue;
		feature.properties.valueText = measureText;
		return feature;
	},

	highlightFeature: function(feature) {
		// if (!this.$canvas) {
		// 	this.$canvas = $('<canvas class="qv-highlight-canvas" />');
		// }
		// $(".qv-object-qshighlightmap-mapdiv").append(this.$canvas);
		// this._drawCanvasHole(feature._point.x, feature._point.x + feature._radius * 2, feature._point.y, feature._point.y + feature._radius * 2);

		var latLng = feature.getLatLng();
		this.fadeLayer(this.timeLayer, false);
		this.map.flyTo(latLng, 10, {duration: 2});
		setTimeout((function() {
			this.fadeLayer(this.timeLayer, true);
		}).bind(this), 4000);
		// feature.openPopup();
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
		
	// },


	// filterIntersectingMarkers: function(markers, bufferMeters) {
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
	// },

	_drawMap: function($element) {
		if (!this._$map) {
			// this._drawTimeLabel($element);
			this._$map = $('<div class="qv-object-qshighlightmap-mapdiv" />');
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

	_drawTimeLabel: function($element) {
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

	notify: function( text ) {
		alert(text);
	},

	_dataIsValid: function( layout ) {
		if (!layout) {
			return false;
		}
		if (!layout.qHyperCube.qDataPages.length) {
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

	filterMarkers: function(layer, filter) {
		var markers = [],
			self = {},
			winnerMarker;
		// 
		
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

	_renderStep: function(layer) {
		// $(".qv-object-com-qliktech-qshighlightmap .qv-time-title").text(timeString);
		var self = this,
			count = 0,
			maxVal = -Infinity;

		var maxFilter = function(value) {
			if (!this._bestValueSoFar) {
				this._bestValueSoFar = -Infinity;	
			}
			var prevBestVal = this._bestValueSoFar;
			this._bestValueSoFar = Math.max(this._bestValueSoFar, value)
			return prevBestVal < value;
		}
		var minFilter = function(value) {
			if (!this._bestValueSoFar) {
				this._bestValueSoFar = Infinity;	
			}
			var prevBestVal = this._bestValueSoFar;
			this._bestValueSoFar = Math.min(this._bestValueSoFar, value)
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
		
		this.highlightMarkers = highlightMarkers.length ? this.createPulsingMarkers(highlightMarkers) : null;


		// console.log("nbr of highlight markers: " + this.highlightMarkers.length, this.highlightMarkers);
		this._renderLayer(layer);

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
	
	_renderLayer: function(layer) {
		// if (this._extraMarker) {
		// 	this.map.removeLayer(this._extraMarker);
		// }
		this.timeLayer.clearLayers();
		this.timeLayer.addLayer(layer);
		var bounds = this.timeLayer.getBounds();
		
		var flyDurationMs = 1000;
		var pulsingMarkerDelayMs = 3000;
		
		if (!this._renderCount === 0) {
			this.map.setBounds(bounds);
		}
		else if (this.getOptions().flyToBoundsOnUpdate) {
			this.fadeLayer(this.timeLayer, false);
			setTimeout( () => {
				this.map.flyToBounds(bounds, {
					duration: flyDurationMs / 1000
				});
			}, 2500);
			setTimeout(function() {
				this.fadeLayer(this.timeLayer, true);
			}.bind(this), flyDurationMs);
		}

		// Let the map zoom to bounds of all data before adding highlight markers
		setTimeout( () => {
			this.highlightMarkers.forEach(m => {
				this.layer.addLayer(m);
				m.openPopup();
			});
		}, pulsingMarkerDelayMs);

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

	createPulsingMarkers: function(markers) {
		var pulsingMarkers = [];
		markers.forEach( (marker) => {
			var filterOptions = this.filterSettings[ marker.properties._filterType ];
			var pulsingIcon = new L.Icon.Pulse({iconSize: [20, 20], color: filterOptions.color, heartbeat: marker.properties._filterType === "minFilter" ? 2 : 1 }); // TODO: Different style for different types of highlights
			var highlightMarker = L.marker(marker.getLatLng(), {icon: pulsingIcon}).addTo(this.timeLayer);
			highlightMarker.properties = $.extend(true, {}, marker.properties);
			var popupText = filterOptions.popupText || "No text";
			highlightMarker.bindPopup(popupText.replace(/\$\{value\}/g, highlightMarker.properties.valueText), {
				autoClose: false
			});
			pulsingMarkers.push(highlightMarker);
			// highlightMarker.openPopup();
		});
		return pulsingMarkers;
	},

	_normalizeValue: function(min, max, val, desiredMin, desiredMax) {
		desiredMin = desiredMin || 0;
		desiredMax = desiredMax || 1;
		
		return (desiredMax - desiredMin) * (val - min) / (max - min) + desiredMin;
	}
};


export default app;
































