export default function(name, args) {
	if ("createEvent" in document) {
		var evt = document.createEvent("HTMLEvents");
		evt.initEvent(name, false, true);
		evt.args = args
		this.dispatchEvent(evt);
	}
	else
		this.fireEvent(name, {"args": args});
}
