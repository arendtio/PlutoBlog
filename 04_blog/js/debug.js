function Debug(modules) {
	// modules e.g. {"journal": 2, "store": 1}
	// module 'all' is used for all modules
	var self = this;

	self.moduleSettings = (modules !== undefined ? modules : {});
	self.allName = "all";
	self.moduleNames = Object.keys(self.moduleSettings);
	var allPos = self.moduleNames.findIndex(function(e) {
		return e === self.allName;
	});
	self.activeAll = (allPos >= 0 && self.moduleSettings[self.moduleNames[allPos]] > 0);

	self.log = function(/*module, level, messages...*/) {
		self._write.apply(this, [console.log].concat(Array.prototype.slice.call(arguments)));
	}
	self.trace = function(/*module, level, messages...*/) {
		self._write.apply(this, [console.trace].concat(Array.prototype.slice.call(arguments)));
	}

	self._write = function(logFunc, module, level /*, messages...*/) {
		var modulePosition = self.moduleNames.findIndex(function(e) {
			return e === module;
		});
		if((modulePosition >= 0 && level <= self.moduleSettings[module]) || (self.activeAll && level <= self.moduleSettings[self.allName])) {
			var messages = Array.prototype.slice.call(arguments, 3);
			// logFunc.apply(this, ["["+module+"]"].concat(messages))
			console.groupCollapsed.apply(console, ["["+module+"]"].concat(messages));
			console.trace.apply(console, []);
			console.groupEnd();
		}
	}

	self._checkActivation = function() {
		for(var i=0; i<self.moduleNames.length; i++) {
			if(self.moduleSettings[self.moduleNames[i]] > 0) {
				return true
			}
		}
		return false
	}

	if(self._checkActivation()) {
		console.log("Debug settings:", self.moduleSettings, "All?", self.activeAll);
	}
}
