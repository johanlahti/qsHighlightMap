

let definition = {
		type: "items",
		component: "accordion",
		// support: {
		// 	snapshot: function( layout ) {
		// 		return layout.qHyperCube.qDataPages[0].qMatrix.length;
		// 	},
		// 	export: function( layout ) {
		// 		return layout.qHyperCube.qDataPages[0].qMatrix.length;
		// 	},
		// 	exportData: function( layout ) {
		// 		return layout.qHyperCube.qDataPages[0].qMatrix.length;
		// 	}
		// },
		items: {
			dimensions: {
				uses: "dimensions",
				min: 1,
				max: 2
			},
			measures: {
				uses: "measures",
				min: 1,
				max: 1
			},
			// sorting: {
			// 	uses: "sorting"
			// },
			appearance: {
				uses: "settings",
				component: "expandable-items",
				label: "Map settings",
				items: {
					highlightSettings: {
						// ref: "props.highlightSettings",
						label: "Highlight settings",
						type: "items",
						items: {
							highlightMax: {
								ref: "props.highlightSettings.max",
								label: "Highlight max value",
								type: "boolean",
								defaultValue: true,
								expression: "optional"
							},
							highlightMin: {
								ref: "props.highlightSettings.min",
								label: "Highlight min value",
								type: "boolean",
								defaultValue: true,
								expression: "optional"
							},
							sizeRange: {
								type: "array",
								component: "slider",
								label: "Circle radius (pixels)",
								ref: "props.highlightSettings.sizeRange",
								min: 1,
								max: 100,
								step: 1,
								defaultValue: [5, 30]
							},
							flyToBoundsOnUpdate: {
								ref: "props.highlightSettings.flyToBoundsOnUpdate",
								label: "Fly to bounds on data update",
								type: "boolean",
								defaultValue: true,
								expression: "optional"
							}
						}
					},
					advancedSettings: {
						// ref: "props.advancedSettings",
						label: "Advanced map settings",
						type: "items",
						items: {
							coordsNorthingFirst: {
								ref: "props.advancedSettings.coordsNorthingFirst",
								label: "Coordinates northing first",
								type: "boolean",
								defaultValue: true,
								expression: "optional"
							},
							geoIndex: {
								ref: "props.advancedSettings.geoIndex",
								label: "Geographic column index",
								type: "integer",
								min: 0,
								max: 1,
								defaultValue: 0,
								expression: "required"
							},
							valueIndex: {
								ref: "props.advancedSettings.valueIndex",
								label: "Value column index",
								type: "integer",
								min: 0,
								max: 1,
								defaultValue: 1,
								expression: "required"
							}
						}
					}
				}
			},
			addons: {
				uses: "addons"
			}
		}
};

export default definition;
