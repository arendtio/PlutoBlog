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
	store.primaryResponse = undefined;
	store.secondaryResponses = undefined;

	store.on("app_init", function() {
		debug.log("store", 1, "running app_init");
		store.loadIndices();
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

	store.loadIndices = function() {
		debug.log("store", 2, "loading primary index");
		getJSON("posts.json", function(primaryResponse) {
			// sort and save primaryIndex
			primaryResponse.posts.sort(store.sortFunc)
			store.primaryResponse = primaryResponse;

			var idToLang = store.getRequiredSecondaryIndices();
			var langMap = {}
			for(var id in idToLang) {
				if (idToLang.hasOwnProperty(id)) {
					var lang = idToLang[id];
					langMap[lang]=true;
				}
			}
			var langs = [];
			for (var oneLang in langMap) {
				if (langMap.hasOwnProperty(oneLang)) {
					langs.push(oneLang);
				}
			}
			debug.log("store", 3, "langs", langs);
			store.loadSecondaryIndices(langs, function() {
				debug.log("store", 2, "all secondary indices have been fetched");
				store.generatePostList(idToLang);
			})
		});
	}

	store.getRequiredSecondaryIndices = function() {
		var browserLangs = simpleintl.browserLanguages();
		var idToLang = {}
		for(var i=0; i<store.primaryResponse.posts.length; i++) {
			var p = store.primaryResponse.posts[i]
			var fallback = store.primaryResponse.primaryLanguage;
			if(p.firstTranslation !== undefined) {
				fallback = p.firstTranslation
			}
			var langMatch = store.findLangMatch(browserLangs, p.languages, fallback)

			if(langMatch !== store.primaryResponse.primaryLanguage) {
				idToLang[p.guid]=langMatch;
			}
		}
		return idToLang
	}

	store.findLangMatch = function(browserLangs, postLangs, fallback) {
		// Loop all entries and find the best matching language for every entry
		var match = fallback;
		for(var i=0; i<browserLangs.length; i++) {
			var index = postLangs.findIndex(function(e) {
				return e === browserLangs[i]
			})
			if(index >= 0) {
				match=browserLangs[i];
				break;
			}
		}
		return match;
	}

	store.loadSecondaryIndices = function(list, callback) {
		var target = list.length;
		var responder = function() {
			target--;
			if(target <= 0) {
				callback();
			}
		}

		var handlerFactory = function(langKey) {
			return function(data) {
				data.posts.sort(store.sortFunc);
				store.secondaryResponses[langKey] = data;
				debug.log("store", 2, "saved secondary index", store.secondaryResponses[langKey]);
				responder();
			}
		}

		store.secondaryResponses = {};
		for(var i=0; i<list.length; i++) {
			debug.log("store", 2, "loading secondary index");
			var lang = list[i]
			getJSON("indices/posts."+lang+".json", handlerFactory(lang));
		}
	}

	store.sortFunc = function(a, b) {
		return a.date < b.date // newest first
	}

	store.deepCopy = function(a) {
		return JSON.parse(JSON.stringify(a))
	}
	store.generatePostList = function(idToLang) {
		debug.log("store", 2, "generating postList");

		store.postList = store.deepCopy(store.primaryResponse.posts)

		// Merge secondary indices
		for(var i=0; i<store.postList.length; i++) {
			var p = store.postList[i];
			var lang = idToLang[p.guid]

			if(lang !== undefined && lang !== store.primaryResponse.primaryLanguage) {
				debug.log("store", 3, "replacing post", p.guid, "with the secondary index equivalent");
				var p2 = store.secondaryResponses[lang].posts.find(function(e) {
					return e.guid === p.guid
				});
				store.postList[i] = p2;
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

