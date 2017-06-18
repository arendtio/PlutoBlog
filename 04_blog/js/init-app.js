// Init debug
var debug = new Debug({"all": 0});

var appStore = new AppStore();
RiotControl.addStore(appStore);

var routerStore = new RouterStore();
RiotControl.addStore(routerStore);

var start_riot = function() {
	var tags = riot.mount("*")
	debug.log("init", 1, "all tags mounted", tags);

	RiotControl.trigger("all_tags_mounted");
};

if(riot.compile !== undefined) {
	riot.compile(start_riot);
} else {
	start_riot();
}
