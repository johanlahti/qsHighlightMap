
import $ from "jquery";
// import define from "define";

import app from "./app";
import loadCss from "./loadCss";
import definition from "./definition";


const global = window;
const define = global.define || define;


const cssFiles = [
	"css/leaflet.css",
	"css/L.Icon.Pulse.css",
	"css/qsHighlightMap.css"
];



// define('resource-not-defined', function() {
// 	return null;
// });


define(["module"],
	function (module) {
		"use strict";

		const ROOT_URI = (module && module.uri && module.uri.split("/").slice(0, -1).join("/")) || "/extensions/qsHighlightMap";

		cssFiles.forEach( cssFile => loadCss(ROOT_URI + "/" + cssFile, e => console.log(`Successfully loaded CSS file: ${cssFile}`), e => console.log(`Could not load CSS file: ${cssFile}`)) );

		return {
			definition: definition,
			initialProperties: {
				qHyperCubeDef: {
					qDimensions: [],
					qMeasures: [],
					qInitialDataFetch: [
						{
							qWidth: 10,
							qHeight: 1000
						}
					]
				}
			},
			paint: function ($element, layout) {
				$element.addClass("qv-object-qshighlightmap");
				$element.attr( "id", "qv-object-qshighlightmap-"+layout.qInfo.qId );
				$(document).ready(() => app.render($element, layout));
			}
		};
	}
);