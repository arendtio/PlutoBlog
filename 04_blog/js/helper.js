function triggerEvent(name, args) {
	if ("createEvent" in document) {
		var evt = document.createEvent("HTMLEvents");
		evt.initEvent(name, false, true);
		evt.args = args
		this.dispatchEvent(evt);
	}
	else
		this.fireEvent(name, {"args": args});
}

// http://youmightnotneedjquery.com/
function removeClass(el, className) {
	if (el.classList)
		el.classList.remove(className);
	else
		el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
}

function addClass(el, className) {
	if (el.classList)
		el.classList.add(className);
	else
		el.className += ' ' + className;
}
