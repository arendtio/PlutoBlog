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

cd ..

# update packages
yarn upgrade

# message format
if [ -d 04_blog/js/intl-messageformat ]; then
	rm -rf 04_blog/js/intl-messageformat
fi
mkdir 04_blog/js/intl-messageformat
cp -a node_modules/intl-messageformat/dist/locale-data 04_blog/js/intl-messageformat/

# relative format
if [ -d 04_blog/js/intl-relativeformat ]; then
	rm -rf 04_blog/js/intl-relativeformat
fi
mkdir 04_blog/js/intl-relativeformat
cp -a node_modules/intl-relativeformat/dist/locale-data 04_blog/js/intl-relativeformat/
