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
#. "$SCRIPT_DIR/lib.sh"
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
indexFile="$outputDir/posts.json"
rssFile="$outputDir/rss.xml"

function getSetting {
	settingName="$1"
	settingsFile="settings.txt"
	if [ ! -e "$settingsFile" ]; then
		settingsFile="settings-default.txt"
	fi

	# gsub to trim whitespaces
	#grep -i "$settingName" settings.txt | awk -F ':' '{gsub(/^[ \t]+/, "", $2); print $2}'
	grep -i "$settingName" "$settingsFile" | cut -d: -f2- | sed 's/^[ \t]\+//'
}

function getMeta {
	metaFile="$1"
	optionName="$2"
	grep -e "^$optionName:" "$metaFile" | cut -d: -f2- | sed 's/^[ \t]\+//'
}

function rawurlencode {
	local string="${1}"
	local strlen=${#string}
	local encoded=""
	local pos c o

	for (( pos=0 ; pos<strlen ; pos++ )); do
		c=${string:$pos:1}
		case "$c" in
			[-_.~a-zA-Z0-9] ) o="${c}" ;;
			* )               printf -v o '%%%02x' "'$c"
		esac
		encoded+="${o}"
	done
	echo "${encoded}"
}

settingsTitle="$(getSetting "Title")"
settingsAuthor="$(getSetting "Author")"
settingsDescription="$(getSetting "Description")"
settingsUrl="$(getSetting "Url")"

# update index.html
escapedDescription="$(getSetting "Description" | sed -e 's/\[/\\\[/g' -e 's/\]/\\\]/g' -e 's;/;\\\/;g' -e 's/\$/\\\$/g')"
cat material/index.html.template \
	| sed -e 's/\[RSS Feed Title\]/'"$(getSetting "Title")"'/' \
	| sed -e 's/\[Pluto Blog Title\]/'"$(getSetting "Title")"'/' \
	| sed -e 's/\[Author\]/'"$(getSetting "Author")"'/' \
	| sed -e 's/\[Description\]/'"$escapedDescription"'/' > 04_blog/index.html

# update logo.svg
if [ -e "logo.svg" ]; then
	cp "logo.svg" "04_blog/img/"
else
	cp "04_blog/img/logo-default.svg" "04_blog/img/logo.svg"
fi

# update posts / posts.json / rss.xml
echo '[' > $indexFile
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

SAVEIFS="$IFS"
IFS="$(echo -en "\n\b")"
first="true";
for f in $(ls -t "02_posts/"); do
	# skipping *.meta files
	if [[ ! -d "02_posts/$f" && ! "$f" =~ ^.*\.md$ ]]; then
		continue
	fi

	if [ "$first" == "true" ]; then
		first="false";
	else
		echo "," >> $indexFile
	fi

	postDir=""
	postFile="$f";
	if [ -d "02_posts/$postFile" ]; then
		postDir="$postFile/"
		postFile="$(cd "02_posts/$postDir/"; ls *.md | head -n 1)"
	fi
	postFullPath="02_posts/$postDir$postFile"

	title="$(cat "$postFullPath" | grep -m 1 -e "^#" | sed 's/^# //' || true)"
	link="$settingsUrl/#/posts/$(rawurlencode "$postDir$postFile")"
	file="$postDir$postFile"
	description="$(cat "$postFullPath" | grep -m 1 -e '^[^# ]\+' || true)..."

	# generated meta data
	metaFile="$postFullPath.meta"
	if [ ! -f "$metaFile" ]; then
		touch "$metaFile"
	fi
	date="$(getMeta "$metaFile" "date")"
	if [ "$date" == "" ]; then
		timestamp="$(stat -c "%Y" "$postFullPath")"
		date="$(date --utc +%FT%TZ -d @$timestamp)"
		echo "date: $date" >> "$metaFile"
	fi

	# index
	echo -n '	{
		"title":"'"$title"'",
		"link":"'"$link"'",
		"file":"'"$file"'",
		"date":"'"$date"'",
		"description":"'"$description"'"
	}' >> $indexFile


	# rss
	echo -n '
	<item>
		<title>'"$title"'</title>
		<link>'"$link"'</link>
		<description>'"$description"'</description>
	</item>' >> $rssFile
done
IFS="$SAVEIFS"


echo '
]' >> $indexFile
echo -n '
</channel>
</rss>
' >> $rssFile
