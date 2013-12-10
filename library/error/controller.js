/************************
	ERRORs
************************/
var ErrorHelper = {
	mode : 0, //enum: 0 local, 1 external-testing, 2 external-release

	log : function(text) {
		switch (Error.mode) {
			case 0 :
				console.log("ERROR : "+text)
			break;
		}
	}
};



