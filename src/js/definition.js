

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
				label: "My Accordion Section",
				items: {
					highlightSettings: {
						// ref: "props.myTextBox",
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
								defaultValue: false,
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
							}
						}
					}
				}
			},
			addons: {
				uses: "addons"
			}
			// ,
			// appearancePanel: {
			// 	uses: "settings",
			// 	items: {
			// 		MyStringProp: {
			// 			ref: "myDynamicOutput",
			// 			type: "string",
			// 			label: "Hello World Text",
			// 			defaultValue: "Hello world"
			// 		}
			// 	}
			// }
		}
};

export default definition;
