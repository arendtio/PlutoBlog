import velocity from "velocity-animate"
import { addClass, removeClass } from "./helper.js"

export default function(){
	var ctrl = this;
	ctrl.beforePageAnimation = function() {};
	ctrl.afterPageAnimation = function() {};
	ctrl.go = function(route, animation) {
		ctrl.beforePageAnimation();

		//animate

		var leaving=["-100%", "0%"]; // to -100% from 0%
		var incoming=["0%", "100%"]; // to 0% from 100%
		if(animation === "back"){
			leaving=["100%", "0%"];
			incoming=["0%", "-100%"];
		}

		// remove class
		var elCur = document.getElementsByClassName("page current");
		var elNext = document.getElementsByClassName("page next");
		var heightCur = 0;
		var heightNext = 0;


		// we need both pages to be display: block; to obtain
		// their height.
		// at the same time we should not set the pages to
		// position: absolute; because that might cause a scroll to top

		// keep the height of the page during animation
		var pages = document.getElementsByClassName("pages");
		var minHeight=0;
		if(elCur.length > 0){
			// current is always display: block;
			heightCur = elCur[0].offsetHeight;
			pages[0].setAttribute("style", "min-height: "+heightCur+"px;");
			addClass(elCur[0], "animating"); // this can trigger a scroll to top, if the min-height is not set
			minHeight=heightCur;
		}
		if(elNext.length > 0){
			// set display: Block;
			addClass(elNext[0], "animating");
			heightNext = elNext[0].offsetHeight;
			if(minHeight < heightNext) {
				pages[0].setAttribute("style", "min-height: "+heightNext+"px;");
				minHeight=heightNext;
			}
		}

		var dur = 500;

		// animate the aside out if the viewport
		var viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		if(viewportHeight > minHeight){
			Velocity(pages[0], {
				"min-height": [(document.body.scrollTop + viewportHeight) + "px", minHeight+"px"]
				}, { duration: dur });
		}

		// animate the current page
		if(elCur.length > 0){
			Velocity(elCur[0], {
				"translateX": leaving,
				"translateY": ["0px", "0px"]
			}, {
					duration: dur,
					complete: function() {
					}
				}
			);
		}

		// animate the next page
		if(elNext.length > 0){
			//elNext[0].setAttribute("style", "display: block;");
			//var style = "transform: translateY("+document.body.scrollTop+"px);"
			//pages[0].setAttribute("style", style);
			Velocity(elNext[0], {
				"translateX": incoming,
				"translateY": [document.body.scrollTop+"px", document.body.scrollTop+"px"]
			}, {
					duration: dur,
					complete: function() {
						if(elCur.length > 0) {
							//complete current
							removeClass(elCur[0], "animating");
							removeClass(elCur[0], "current");
						}

						// complete next
						elNext[0].setAttribute("style", "");
						addClass(elNext[0], "current");
						removeClass(elNext[0], "animating");
						// remove as last as it changes elNext[0]
						removeClass(elNext[0], "next");

						window.scrollTo(0, 0);

						// animate aside back to the viewport (for shorter next pages)
						Velocity(pages[0], {"min-height": elNext.offsetHeight + "px"
						}, {
							duration: dur,
							complete: function() {
							pages[0].setAttribute("style", "");
							//XXX: Do not start another animation before this has completed
						}});


						ctrl.afterPageAnimation();
					}
				}
			);
		}
	}
}
