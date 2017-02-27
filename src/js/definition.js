

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
					myTextBox: {
						ref: "props.myTextBox",
						label: "My ",
						type: "string"
					},
					header1: {
						type: "items",
						label: "Header 1",
						items: {
							header1_item1: {
								ref: "props.section1.item1",
								label: "Section 1 / Item 1",
								type: "string",
								expression: "optional"
							},
							header1_item2: {
								ref: "props.section2.item1",
								label: "Section 2 / Item 1",
								type: "string",
								expression: "optional"
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
