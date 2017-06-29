// Init debug
var debug = new Debug({"all": 0, "highlighting": 0, "init": 0, "route": 0, "store": 0, "tag-updates": 0, "trigger": 0});

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
