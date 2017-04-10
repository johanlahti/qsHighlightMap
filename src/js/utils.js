


export function normalize(min, max, val, desiredMin = 0, desiredMax = 1) {
	return (desiredMax - desiredMin) * (val - min) / (max - min) + desiredMin;
}

export function swapCoords(coordsArr) {
	return coordsArr.reverse(); // Polyfill exists for reverse in IE11 in Sense?
}