import test from "tape";
import dynamicMap from "../src/dynamicMap";


test('Test some funcs', (t) => {
	t.equal(dynamicMap instanceof Object, true, "dynamicMap is an object");
	t.end();
});