// PLUTOBLOG: VERSION
import debug from "./debug.js"
import riot from "riot"
import RiotControl from "./riotcontrol.js" // patched
import simpleintl from "simple-intl"

//stores
import AppStore from "../stores/app.store.js"
import RouterStore from "../stores/router.store.js"
import DisqusStore from "../stores/disqus.store.js"

// riot tags
import "../tags/*.tag.html"

var appStore = new AppStore();
RiotControl.addStore(appStore);

var routerStore = new RouterStore();
RiotControl.addStore(routerStore);

var disqusStore = new DisqusStore();
RiotControl.addStore(disqusStore);

// simple-intl i18n as global variable:
var availableLanguages = ["en", "de"];
window.i18n = simpleintl(availableLanguages, function() {
	var tags = riot.mount("*")
	debug.log("init", 1, "all tags mounted", tags);

	RiotControl.trigger("all_tags_mounted");
});
