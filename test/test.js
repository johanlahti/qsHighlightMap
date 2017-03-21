import test from "tape";

import L from "leaflet";
import $ from "jquery";

import app from "../src/js/app";
import definition from "../src/js/definition";
import layout from "./mockLayout";


let $element = $('<div id="qs-element-mapdiv" />');



app._drawMap($element);

test('a Leaflet map has been created', (t) => {
	t.ok(app.map instanceof Object, "map is an object");
	t.ok(app.map._container.parentElement === $element[0], "map container is wrapped in $element");
	t.end();
});

test('layout validation', (t) => {
	let invalidLayout = $.extend(true, {}, layout);
	delete invalidLayout.qHyperCube.qDataPages;

	t.ok(app._dataIsValid(layout), "valid data should be assessed as valid");


	t.notOk(app._dataIsValid(invalidLayout), "no qDataPages should trigger invalid data");

	invalidLayout = null;
	t.end();
});



