# Pluto Blog

Pluto is almost a Planet.
PlutoBlog is almost a Blog Software.

With PlutoBlog you can write Blog posts with markdown
and present them to your readers in a pleasant format.

# Installation

```
git clone https://github.com/arendtio/PlutoBlog.git
cd PlutoBlog
cp settings-default.txt settings.txt
```
And finally edit `settings.txt` to suit your needs.

# Basic Usage

1. create a markdown file (\*.md) within 01_drafts/ and write your post
2. when you are done, move that file to 02_posts/
3. run 03_generate.sh
4. copy the content of 04_blog/ to your webspace

# Licenses

Pluto Blog itself uses the MIT license. The different parts
it depends on, like fonts or libraries, can have different licenses:

- riot.js [MIT](https://github.com/riot/riot/blob/master/LICENSE.txt)
- riotcontrol.js [MIT](https://github.com/jimsparkman/RiotControl/blob/master/LICENSE.txt)
- highlight.js [BSD](https://github.com/isagalaev/highlight.js/blob/master/LICENSE)
- showdown.js [Custom](https://github.com/showdownjs/showdown/blob/master/license.txt)
- velocity.js [MIT](https://github.com/julianshapiro/velocity/blob/master/LICENSE.md)
- Fonts
	- Amiri [OFL](https://github.com/alif-type/amiri/blob/master/OFL.txt)
	- Lato [OFL](http://scripts.sil.org/OFL)
