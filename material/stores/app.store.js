import getJSON from "../js/getjson.js"
import debug from "../js/debug.js"
import riot from "riot"
import simpleintl from "simple-intl"

export default function() {
	riot.observable(this);

	var store = this;

	store.urlParameters = [];
	store.selected = {};

	store.Trigger = function() {
		debug.log("trigger", 1, "to tags:", arguments);
		store.trigger.apply(this, arguments);
	}

	store.postList = [];
	store.optimalLanguage = undefined;
	store.primaryResponse = undefined;
	store.secondaryResponse = undefined;

	store.on("app_init", function() {
		debug.log("store", 1, "running app_init");

		debug.log("store", 2, "loading primary index");
		getJSON("posts.json", function(primaryResponse) {
			// sort and save primaryIndex
			primaryResponse.posts.sort(store.sortFunc)
			store.primaryResponse = primaryResponse;

			// detect optimal language for secondaryIndex
			var allLangs = [primaryResponse.primaryLanguage].concat(primaryResponse.secondaryIndices);
			debug.log("store", 3, "allLangs", allLangs);
			store.optimalLanguage = simpleintl.detectLanguage(allLangs, primaryResponse.primaryLanguage);
			debug.log("store", 2, "detected optimalLanguage", store.optimalLanguage);
			if(store.optimalLanguage !== primaryResponse.primaryLanguage) {
				debug.log("store", 2, "loading secondary index");
				getJSON("indices/posts."+store.optimalLanguage+".json", function(secondaryResponse) {
					secondaryResponse.posts.sort(store.sortFunc);
					store.secondaryResponse = secondaryResponse;
					debug.log("store", 2, "saved secondary index", store.secondaryResponse);
					store.generatePostList();
				});
			} else {
				debug.log("store", 2, "skipping secondary index");
				store.generatePostList();
			}
		});
	});

	store.on("all_tags_mounted", function() {
		store.Trigger("init_mount_complete");
	});

	store.on("answer_target_pagename", function(pageName, pagePattern, url) {
		store.update_url_parameters(url);
		store.update_selected_objects(pagePattern);

		// find current post and next Post
		// posts.json is sorted by date
		// FIXME: orphan posts have no pretty id yet...
		// Currently they are not being displayed, but that will change
		var postPos = store.postList.findIndex(function(el) {
			return el.prettyId === store.selected.prettyId
		});

		var nextPostIndex = undefined;
		if(postPos >= 1) {
			nextPostIndex = postPos - 1
			store.Trigger("next_post_changed", store.postList[nextPostIndex].prettyId);
		} else {
			store.Trigger("next_post_changed", undefined);
		}
	});

	store.sortFunc = function(a, b) {
		return a.date < b.date // newest first
	}

	store.deepCopy = function(a) {
		return JSON.parse(JSON.stringify(a))
	}
	store.generatePostList = function() {
		debug.log("store", 2, "generating postList");

		store.postList = store.deepCopy(store.primaryResponse.posts)

		// Merge secondary index if available
		if(store.secondaryResponse !== undefined && store.optimalLanguage !== undefined) {
			debug.log("store", 2, "secondary index exists", store.secondaryResponse);
			for(var i=0; i<store.postList.length; i++) {
				var p = store.postList[i];
				var posOfOptimalLanguage = p.languages.findIndex(function(e) {
					return e === store.optimalLanguage
				});
				if(posOfOptimalLanguage >= 0) {
					// so a secondary index exists and the post we are testing
					// lists the language of the secondary index as supported
					// now we replace the post entry in the primary index with
					// the one from the secondary index
					var p2 = store.secondaryResponse.posts.find(function(e) {
						return e.guid === p.guid
					});
					debug.log("store", 3, "replacing post", p.guid, "with the secondary index equivalent");
					store.postList[i] = p2;
				}
			}
		}

		// removing orphan posts
		store.postList = store.postList.filter(function(e) {
			return e.prettyId !== undefined
		});
		store.Trigger("postindex_changed", store.postList);
	}

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

