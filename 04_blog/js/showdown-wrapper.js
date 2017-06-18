// usage: var html = md2html('# This is Markdown')
var md2html = function(){
	var sd = new showdown.Converter();
	return function(md, filepath) {
		var html = sd.makeHtml(md);

		if(html !== undefined){
			// add surounding div elements for images
			html = html.replace(/(<img[^>]*>)/ig, "<div>$1</div>");

			// add relative path to image paths
			if(filepath !== undefined){
				var basepath = filepath.replace(/[^\/]*$/, "")
				if(basepath !== ""){
					html = html.replace(/(<img src=")(?!http)([^"]*"[^>]*>)/ig, "$1posts/"+basepath+"$2");
					html = html.replace(/(<a href=")(?!http)([^"]*"[^>]*>)/ig, "$1posts/"+basepath+"$2");
				}
			}
		}

		return html;
	}
}();
