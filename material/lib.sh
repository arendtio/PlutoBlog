#!/usr/bin/env bash

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

function randomUUID {
	if [ -e /proc/sys/kernel/random/uuid ]; then
		cat /proc/sys/kernel/random/uuid
	else
		# https://serverfault.com/questions/103359/how-to-create-a-uuid-in-bash
		od -x /dev/urandom | head -1 | awk '{OFS="-"; print $2$3,$4,$5,$6,$7$8$9}'
	fi
}

function getMeta {
	local metaFile="$1"
	local optionName="$2"
	if [ ! -f "$metaFile" ]; then
		touch "$metaFile"
	fi
	grep -e "^$optionName:" "$metaFile" | cut -d: -f2- | sed 's/^[ \t]\+//'
}

function getDateFromMeta {
	local metaFile="$1"
	local postFullPath="$2"
	local date="$(getMeta "$metaFile" "date")"
	if [ "$date" == "" ]; then
		local timestamp="$(stat -c "%Y" "$postFullPath")"
		date="$(date --utc +%FT%TZ -d @$timestamp)"
		echo "date: $date" >> "$metaFile"
	fi
	echo "$date"
}

function getUUIDFromMeta {
	local uuid="$(getMeta "$metaFile" "uuid")"
	if [ "$uuid" == "" ]; then
		uuid="$(randomUUID)"
		echo "uuid: $uuid" >> "$metaFile"
	fi
	echo "$uuid"
}

function getFirstTranslationFromMeta {
	local metaFile="$1"
	local postFullPath="$2"
	local primaryPostFullPath="$(toPrimaryPost "$postFullPath")"
	local basePath="$(echo "$primaryPostFullPath" | sed 's/\.md$//')"

	# check primary file existence
	if [ -e "$primaryPostFullPath" ]; then
		return "$settingsPrimaryLanguage"
	fi

	# look in meta file
	local firstTranslation="$(getMeta "$metaFile" "First-Translation")"
	if [ "$firstTranslation" == "" ]; then
		# get oldest translation file
		local oldestTranslationFile="$(ls -t "$basePath".[a-z][a-z]*.md | tail -n1)"
		local firstTranslation="$(langFromFilename "$oldestTranslationFile")"
	fi
	echo "$firstTranslation"
}

function getPrettyId {
	local postDir="$1"
	local postFile="$2"
	local primaryPostFile="$(toPrimaryPost "$postFile")"
	echo "$postDir$primaryPostFile" | sed -e 's/\/.*$//g' -e 's/\.md$//g' -e 's/ /-/g'
}

function toPrimaryPost {
	echo "$1" | sed 's/\.[a-z][a-z]\(\-[A-Z]\{2\}\)\?\.md$/.md/'
}

function langFromFilename {
	echo "$1" | sed 's/^.*\.\([a-z][a-z]\(\-[A-Z]\{2\}\)\?\)\.md$/\1/'
}

function startIndexFile {
	if [ -f "$1" ]; then
		echo "IndexFile '$1' exists. Cannot start it."
		exit 1
	fi
	echo '{
	"posts": [' > "$1"
}

function prepareIndex {
	local indexFile="$1"
	if [ ! -f "$indexFile" ]; then
		# first time for this index files
		startIndexFile "$indexFile"
	else
		echo "," >> "$indexFile"
	fi
}

