function AppStore() {
	riot.observable(this);

	var store = this;

	store.urlParameters = [];
	store.selected = {};

	store.Trigger = function() {
		debug.log("trigger", 1, "to tags:", arguments);
		store.trigger.apply(this, arguments);
	}

	store.postIndex = [];

	store.on("app_init", function() {
		debug.log("store", 1, "running app_init");

		getJSON("posts.json", function(postIndex) {
			store.postIndex = postIndex;
			store.Trigger("postindex_changed", postIndex);
		});
	});

	store.on("all_tags_mounted", function() {
		store.Trigger("init_mount_complete");
	});

	store.on("answer_target_pagename", function(pageName, pagePattern, url) {
		var nextPostUrl = "";
		store.update_url_parameters(url);
		store.update_selected_objects(pagePattern);

		// find current post and next Post
		// posts.json is sorted by date
		var postIndex = store.postIndex.findIndex(function(el) {
			return el.file === store.selected.file
		});

		var nextPostIndex = undefined;
		if(postIndex >= 1){
			nextPostIndex = postIndex - 1
			store.Trigger("next_post_changed", store.postIndex[nextPostIndex].file);
		} else {
			store.Trigger("next_post_changed", undefined);
		}
	});

	store.update_url_parameters = function(route) {
		store.urlParameters = [];
		var list = route.split("/");
		// run a decodeURIComponent on every segment
		for(var i=0; i<list.length; i++) {
			store.urlParameters.push(decodeURIComponent(list[i]));
		}
	}

	store.update_selected_objects = function(targetPattern) {
		// update selected objects
		store.selected = {};

		var pattern = targetPattern.split("/");
		for(var i=0; i<pattern.length; i++) {
			var element = pattern[i];
			// element is e.g. [product]
			if(element.slice(0, 1) === "[" && element.slice(-1) === "]") {
				var name = element.slice(1,-1) // "[product]" becomes "product"
				store.selected[name] = store.urlParameters[i];
			}

		}
	}
}

