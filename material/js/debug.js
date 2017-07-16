// process.env.DEBUG_SETTINGS e.g. {"all": 0, "journal": 2, "store": 1}
// "all" is used as a general activation switch for all modules
var debug = function() {};
debug.allName = "all";

debug.log = function(/*module, level, messages...*/) {
	debug._write.apply(this, [console.log].concat(Array.prototype.slice.call(arguments)));
}

debug.trace = function(/*module, level, messages...*/) {
	debug._write.apply(this, [console.trace].concat(Array.prototype.slice.call(arguments)));
}

debug.active = function(module, level) {
	if( ! (typeof process != "undefined" && process.env && process.env.DEBUG_SETTINGS)){
		return false // no config defined
	}

	// all
	var allExists = process.env.DEBUG_SETTINGS.hasOwnProperty(debug.allName);
	var allLevel = 0;
	if(allExists){
		allLevel = process.env.DEBUG_SETTINGS[debug.allName];
	}

	// module
	var moduleExists = process.env.DEBUG_SETTINGS.hasOwnProperty(module);
	var moduleLevel = 0;
	if(moduleExists){
		moduleLevel = process.env.DEBUG_SETTINGS[module];
	}

	// active check
	return ((moduleExists && level <= moduleLevel) || (allExists && level <= allLevel))
}

debug._write = function(logFunc, module, level /*, messages...*/) {
	if( ! debug.active(module, level)){
		return
	}
	var messages = Array.prototype.slice.call(arguments, 3);
	// logFunc.apply(this, ["["+module+"]"].concat(messages))
	console.groupCollapsed.apply(console, ["["+module+"]"].concat(messages));
	console.trace.apply(console, []);
	console.groupEnd();
}

export default debug
