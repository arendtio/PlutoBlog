//import debug from './debug.js'
var debug = require('./debug.js')

var RiotControl = {
  _stores: [],
  addStore: function(store) {
    this._stores.push(store);
  },
  reset: function() {
    this._stores = [];
  }
};

['on','one','off','trigger'].forEach(function(api){
  RiotControl[api] = function() {
    var args = [].slice.call(arguments);
	if (api === 'trigger') debug.log("trigger", 1, "to stores:", args);
    this._stores.forEach(function(el){
      el[api].apply(el, args);
    });
  };
});

if (typeof(module) !== 'undefined') module.exports = RiotControl;
