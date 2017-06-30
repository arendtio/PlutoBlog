function RouterStore() {
	riot.observable(this);

	var store = this;
	store.currentRoute = undefined
	store.requestedRoute = undefined
	store.targetPageName = undefined
	store.targetNamePattern = undefined
	store.pageList = []
	store.routeDoneCallbacks = []

	store.waitingForPages=false;
	store.defaultRoute=""

	store.Trigger = function() {
		debug.log("trigger", 1, "to tags:", arguments);
		store.trigger.apply(this, arguments);
	}

	store.resetOptions = function() {
		store.options = {animation: "auto", history: "forward"};
	}

	// Router lifecycle:
	// init_router -> request_route -> callbacks
	//
	// Page change flow:
	// request_route ->		To start the process
	// 		prepare_page_change -> answer_target_pagename; 	to define current and next page
	// 		update_pages -> pages_updated ->	to render next page and empty all others
	// 			pages_update_finished;	to have a unified point to make sure all pages are updated
	//	 		page_animation_start;	start animation
	// 			page_animation_done;	continue after animation

	store.on("start_router", function(defaultRoute) {
		debug.log("route", 1, "starting router");
		store.defaultRoute = defaultRoute;
		store.resetOptions();

		// start router after all tags are mounted
		route(function(obj, id, action, argument) {
			debug.log("route", 1, "changed", obj, id, action, argument)
			if(location.hash === "") {
				route(store.defaultRoute);
				return
			}
			store.handleRoute(location.hash.replace(/^#\!?/, ''), store.options); // regex works for #! and #
		});
		route.base('#!'); // disqus requires #!
		route.start(true)
	});

	store.on("request_route", function(targetRoute, options, callback) {
		if(options !== undefined) {
			store.options = options;
		}

		if(callback !== undefined) {
			store.routeDoneCallbacks.push(callback);
		}

		if(store.options.history === "forward") {
			route(targetRoute);
		} else if(history.length > 1) {
			history.back();
		} else {
			route(store.defaultRoute);
		}
	});

	store.handleRoute = function(route) {
		debug.log("route", 1, "request route", route, store.options);
		store.requestedRoute = route;

		// ask for the pageName and let the pages find out if they should prepare for rendering
		store.Trigger("prepare_page_change", store.currentRoute, route);
		// in the meantime one tag will answer_target_pagename with its name -> store.targetPageName

		// if no tag answered to the announcedment, cancel the route
		if(store.targetPageName === undefined) {
			debug.log("route", 0, "no Tag answered the route announcement, aborting", store.targetPageName);
			// should never happen
			return
		}

		store.waitingForPages=true;
		// update all pages so, that only the current and the target page are rendered afterwards
		store.Trigger("update_pages", store.targetNamePattern, store.requestedRoute, store.targetPageName);

	}

	store.on("register_page", function(pageName) {
		store.pageList.push(pageName);
	});

	// save so far...

	store.on("register_animation_controller", function(controller) {
		debug.log("route", 1, "register animation router");
		controller.beforePageAnimation = function() {
			store.Trigger("page_animation_start");
		}
		controller.afterPageAnimation = function() {
			store.Trigger("page_animation_done");
			// trigger callbacks
			store.routeDoneCallbacks.forEach(function(el) {
				el();
			});
			store.routeDoneCallbacks = []
		}
		store.animationController = controller;
	});

	store.on("answer_target_pagename", function(pageName, namePattern) {
		debug.log("route", 1, "answer_target_pagename", pageName);
		store.targetPageName = pageName;
		store.targetNamePattern = namePattern;
	});

	store.on("pages_updated", function() {
		if( ! store.waitingForPages){
			return
		}

		store.waitingForPages=false;

		// inform store to let other tags do what the need to (e.g. trigger searchbar init)
		store.Trigger("pages_update_finished");

		if(store.options.animation === "auto" && store.currentRoute != undefined && store.requestedRoute != undefined) {
			var countCurrentSlashes = (store.currentRoute.split("/").length - 1)
			var countTargetSlashes = (store.requestedRoute.split("/").length - 1)
			if( countCurrentSlashes > countTargetSlashes){
				store.options.animation="back";
			}
		}
		if(store.options.animation === "auto") {
			store.options.animation="forward";
		}

		// trigger the animation from current page to target page
		store.animationController.go(store.targetPageName, store.options.animation);

		store.currentRoute = store.requestedRoute;
		store.resetOptions();
	});
}
