#!/usr/bin/env bash
#--------------------------------------------
# Default Bash Script Header
set -eu
trap stacktrace EXIT
function stacktrace {
	if [ $? != 0 ]; then
		echo -e "\nThe command '$BASH_COMMAND' triggerd a stacktrace:"
		for i in $(seq 1 $((${#FUNCNAME[@]} - 2))); do j=$(($i+1)); echo -e "\t${BASH_SOURCE[$i]}: ${FUNCNAME[$i]}() called in ${BASH_SOURCE[$j]}:${BASH_LINENO[$i]}"; done
	fi
}

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
#--------------------------------------------
. "$SCRIPT_DIR/material/lib.sh"
cd "$SCRIPT_DIR"


##  Check for Dependencies

# VERSION 1
#if ! which aws >/dev/null 2>&1 ; then
#	echo -e "Please install awscli with:\n\n\tpip install --user awscli\nor:\n\tpip install awscli\n\nand configure it with:\n\n\taws configure\n"
#	trap '' EXIT
#	exit 1
#fi

# VERSION 2
#missingDeps=""
#command -v curl >/dev/null 2>&1 || missingDeps="$(echo -e "$missingDeps\ncurl")"
#command -v bc >/dev/null 2>&1 || missingDeps="$(echo -e "$missingDeps\nbc")"
#
#if [ "$missingDeps" != "" ]; then
#	echo "This script reqires the following missing programs:"
#	echo -e "$missingDeps\n"
#	echo "Aborting due to missing dependencies..."
#	trap '' EXIT
#	exit 1
#fi

outputDir="./04_blog"
indexDir="$outputDir/indices"
primaryIndexFile="$outputDir/posts.json"
rssFile="$outputDir/rss.xml"
settingsFile="settings.txt"
defaultSettingsFile="settings-default.txt"

if [ ! -e "$settingsFile" ]; then
	echo "$settingsFile does not exist. Please configure your PlutoBlog before using it."
	exit
fi

function getSetting {
	local settingName="$1"
	local line="$(grep -i "$settingName" "$settingsFile")"
	if [ "$line" == "" ]; then
		# settings file does not contain the option, falling back to default settings file
		line="$(grep -i "$settingName" "$defaultSettingsFile")"
	fi

	# gsub to trim whitespaces
	#grep -i "$settingName" settings.txt | awk -F ':' '{gsub(/^[ \t]+/, "", $2); print $2}'
	echo "$line" | cut -d: -f2- | sed 's/^[ \t]\+//'
}

function replacePlaceholders {
	local targetFile="$1"
	sed -e 's/\[RSS Feed Title\]/'"$(getSetting "Title")"'/' \
		-e 's/\[Pluto Blog Title\]/'"$(getSetting "Title")"'/' \
		-e 's/\[Author\]/'"$(getSetting "Author")"'/' \
		-e 's/\[Description\]/'"$escapedDescription"'/' \
		-e 's/\[Color1\]/'"$(getSetting "Color1")"'/' \
		-e 's/\[Color2\]/'"$(getSetting "Color2")"'/' \
		-e 's/\[Disqus-Site\]/'"$(getSetting "Disqus-Site")"'/' \
		"$targetFile" > "$targetFile.bak" && mv "$targetFile.bak" "$targetFile"
}
settingsTitle="$(getSetting "Title")"
settingsAuthor="$(getSetting "Author")"
settingsDescription="$(getSetting "Description")"
settingsUrl="$(getSetting "Url")"
settingsPrimaryLanguage="$(getSetting "Primary-Language")"
escapedDescription="$(getSetting "Description" | sed -e 's/\[/\\\[/g' -e 's/\]/\\\]/g' -e 's;/;\\\/;g' -e 's/\$/\\\$/g')"

pagesExtension="$(getSetting "GitHubPages-Extension")"

# starting GitHub Extension before modifying "04_blog/"
if [ "$pagesExtension" == "true" ]; then
	echo "Using GitHub Pages Extension..."
	if [ ! -d "04_blog/.git" ]; then
		echo "04_blog/.git does not exist. Your PlutoBlog does not seem to be configured correctly for the GitHub Pages Extension, exiting."
		exit
	fi

	cd 04_blog
	echo "Pulling latest changes from GitHub Pages repo"
	git pull
	cd -
fi

# update index.html
cp material/index.html.template 04_blog/index.html
replacePlaceholders "04_blog/index.html"

cp material/css/app.css.template 04_blog/css/app.css
replacePlaceholders "04_blog/css/app.css"

cp material/js/config.js.template 04_blog/js/config.js
replacePlaceholders "04_blog/js/config.js"


# update logo.svg
if [ -e "logo.svg" ]; then
	cp "logo.svg" "04_blog/img/"
else
	cp "04_blog/img/logo-default.svg" "04_blog/img/logo.svg"
fi

# clear indexDir
if [ -f "$primaryIndexFile" ]; then
	rm "$primaryIndexFile"
fi
if [ -d "$indexDir" ]; then
	rm "$indexDir" -r
fi
mkdir -p "$indexDir"

# update posts rss.xml
echo -n '<?xml version="1.0" ?>
<rss version="2.0">
<channel>
	<title>'"$settingsTitle"'</title>
	<link>'"$settingsUrl"'</link>
	<description>'"$settingsDescription"'</description>
	<image>
		<url>img/logo.svg</url>
		<link>'"$settingsUrl"'</link>
	</image>' > $rssFile

# copy the posts directory into the blog directory
mkdir -p "04_blog/posts"
rm -r "04_blog/posts"
cp -a 02_posts 04_blog/posts

function getLanguageArray {
	local postFullPath="$1"
	local primaryPostFullPath="$(toPrimaryPost "$postFullPath")"
	local postLanguageBase="$(echo "$primaryPostFullPath" | sed 's/\.md$//')"
	local languages='[]'
	if [ -f "$primaryPostFullPath" ]; then
		languages='["'"$settingsPrimaryLanguage"'"]'
	fi
	# if other languages exist (for + break + if)
	for p in "$postLanguageBase".[a-z][a-z]*.md; do
		if [ -e "$p" ]; then
			if [ -f "$primaryPostFullPath" ]; then
				languages='["'"$settingsPrimaryLanguage"'", '"$(ls "$postLanguageBase".[a-z][a-z]*.md | sed 's/^.*\.\([a-z]\{2\}\(\-[A-Z]\{2\}\)\?\)\.md$/"\1" /' | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n//g' -e 's/" "/", "/g')"']'
			else
				# skip the settingsPrimaryLanguage if the primary post file does not exist
				languages='['"$(ls "$postLanguageBase".[a-z][a-z]*.md | sed 's/^.*\.\([a-z]\{2\}\(\-[A-Z]\{2\}\)\?\)\.md$/"\1" /' | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n//g' -e 's/" "/", "/g')"']'
			fi
		fi
		break;
	done
	echo "$languages"
}

function getIndexEntry {
	local postDir=$1
	local postFile=$2
	local postFullPath="02_posts/$postDir$postFile"
	local primaryPostFile="$(toPrimaryPost "$postFile")"
	local primaryPostFullPath="02_posts/$postDir$primaryPostFile"

	local metaFile="$primaryPostFullPath.meta"
	local date="$(getDateFromMeta "$metaFile" "$primaryPostFullPath")"
	local uuid="$(getUUIDFromMeta "$metaFile")"

	local title="$(cat "$postFullPath" | grep -m 1 -e "^#" | sed 's/^# //' || true)"

	# remove everything after the first / and the .md suffix
	local prettyId="$(getPrettyId "$postDir" "$postFile")"
	local link="$settingsUrl/#!posts/$(rawurlencode "$prettyId")"
	local file="$postDir$postFile"
	local description="$(cat "$postFullPath" | grep -m 1 -e '^[^# ]\+' || true)..."

	# languages
	local languages="$(getLanguageArray "$primaryPostFullPath")"

	# index
	echo -n '		{
			"title":"'"$title"'",
			"link":"'"$link"'",
			"guid":"'"$uuid"'",
			"prettyId":"'"$prettyId"'",
			"file":"'"$file"'",
			"date":"'"$date"'",
			"languages":'"$languages"',
			"description":"'"$description"'"
		}'
}

function getOrphanIndexEntry {
	local postDir=$1
	local postFile=$2
	local postFullPath="02_posts/$postDir$postFile"
	local primaryPostFile="$(toPrimaryPost "$postFile")"
	local primaryPostFullPath="02_posts/$postDir$primaryPostFile"

	local metaFile="$primaryPostFullPath.meta"
	local firstTranslation="$(getFirstTranslationFromMeta "$metaFile" "$postFullPath")"
	local date="$(getDateFromMeta "$metaFile" "$postFullPath")"
	local uuid="$(getUUIDFromMeta "$metaFile")"
	local prettyId="$(getPrettyId "$postDir" "$postFile")"

	# languages
	local languages="$(getLanguageArray "$postFullPath")"

	echo -n '		{
			"guid":"'"$uuid"'",
			"prettyId":"'"$prettyId"'",
			"date":"'"$date"'",
			"firstTranslation":"'"$firstTranslation"'",
			"languages":'"$languages"'
		}'
}

function getRssIndexEntry {
	local postDir=$1
	local postFile=$2
	local postFullPath="02_posts/$postDir$postFile"
	local primaryPostFile="$(toPrimaryPost "$postFile")"
	local primaryPostFullPath="02_posts/$postDir$primaryPostFile"

	local metaFile="$primaryPostFullPath.meta"
	local uuid="$(getUUIDFromMeta "$metaFile")"

	local title="$(cat "$postFullPath" | grep -m 1 -e "^#" | sed 's/^# //' || true)"

	# remove everything after the first / and the .md suffix
	local prettyId="$(echo "$postDir$primaryPostFile" | sed -e 's/\/.*$//g' -e 's/\.md$//g' -e 's/ /-/g')"
	local link="$settingsUrl/#!posts/$(rawurlencode "$prettyId")"
	local description="$(cat "$postFullPath" | grep -m 1 -e '^[^# ]\+' || true)..."
	echo -n '
	<item>
		<title>'"$title"'</title>
		<link>'"$link"'</link>
		<description>'"$description"'</description>
		<guid isPermaLink="false">'"$uuid"'</guid>
	</item>'
}

function createIndexForPost {
	local postDir="$1"
	local postFile="$2"
	local entryType=$3
	local primaryPostFile="$(toPrimaryPost "$postFile")"
	local primaryPostFullPath="02_posts/$postDir$primaryPostFile"

	# generate meta data
	local metaFile="$primaryPostFullPath.meta"
	if [ -f "$primaryPostFullPath" ]; then
		local date="$(getDateFromMeta "$metaFile" "$primaryPostFullPath")"
	else
		local date="$(getDateFromMeta "$metaFile" "$postFullPath")"
	fi
	local uuid="$(getUUIDFromMeta "$metaFile")"

	if [ -f "$primaryIndexFile" ] && grep -q "$uuid" "$primaryIndexFile"; then
		# this post was added to the index already
		return
	fi

	# create primary index entry
	local indexFile="$primaryIndexFile"
	prepareIndex "$indexFile"
	if [ "$entryType" == "orphan" ]; then
		getOrphanIndexEntry "$postDir" "$postFile" >> "$indexFile"
	else
		getIndexEntry "$postDir" "$primaryPostFile" >> "$indexFile"
	fi

	# loop translations of this post
	# enabling extended globbing: http://www.linuxjournal.com/content/bash-extended-globbing
	# shopt -s extglob
	# for p in 02_posts/FolderPost/Test?(.[a-z][a-z]|.[a-z][a-z]-[A-Z][A-Z]).md; do
	local basePath="$(echo "$primaryPostFullPath" | sed 's/\.md$//')"
	for p in "$basePath".[a-z][a-z].md "$basePath".[a-z][a-z]-[A-Z][A-Z].md; do
		if [ -e "$p" ]; then # $p can be one of the above wildcard expressions
			local lang="$(langFromFilename "$p")"
			local indexFile="$indexDir/posts.$lang.json"
			prepareIndex "$indexFile"
			getIndexEntry "$postDir" "$(basename "$p")" >> "$indexFile"
		fi
	done

	# rss
	getRssIndexEntry "$postDir" "$postFile" >> $rssFile
}

function loopPosts {
	SAVEIFS="$IFS"
	IFS="$(echo -en "\n\b")"
	for f in $(ls -t "02_posts/"); do
		# skipping *.meta files
		if [[ ! -d "02_posts/$f" && ! "$f" =~ ^.*\.md$ ]]; then
			continue
		fi

		local postDir=""
		local postFile="$f";
		if [ -d "02_posts/$postFile" ]; then
			local postDir="$postFile/"
			local postFile="$(cd "02_posts/$postDir/"; ls *.md | head -n 1)"
		fi
		local primaryPostFile="$(toPrimaryPost "$postFile")"
		local postFullPath="02_posts/$postDir$postFile"
		local primaryPostFullPath="02_posts/$postDir$primaryPostFile"

		if [ -f "$primaryPostFullPath" ]; then
			createIndexForPost "$postDir" "$primaryPostFile" "normal"
		else
			createIndexForPost "$postDir" "$postFile" "orphan"
		fi
	done
	IFS="$SAVEIFS"
}

loopPosts

# close all secondary index files
for f in "$indexDir"/*; do
	echo -e '\n\t]\n}' >> "$f"
done

# Add a list of secondary indices to the primary index
echo -e '\n\t],
	"primaryLanguage": "'"$settingsPrimaryLanguage"'",
	"secondaryIndices": [
		'"$(ls "$indexDir" | sed -e 's/^.*\.\([a-z]\{2\}\(\-[A-Z]\{2\}\)\?\)\.json$/"\1" /' | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n//g' -e 's/" "/", "/g' -e 's/ $//g')"'
	]
}' >> "$primaryIndexFile"


# close rss file
echo -n '
</channel>
</rss>
' >> $rssFile

if [ "$pagesExtension" == "true" ]; then
	echo "Publishing with GitHub Pages Extension..."
	cd "04_blog"
	git add .
	git status
	git commit -am "Update by GitHub Pages Extension"
	git push
	cd -
	echo "Done"
fi
