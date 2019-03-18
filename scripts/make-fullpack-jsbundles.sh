#!/bin/bash
#########################################################################
# Author: shenchen1@jd.com

show_help ( ) {
	echo "Help:"
	echo "-h : Show Help"
	echo "-p : Target Platform, 'android' or 'ios'"
	echo "-m : Target module name"
	exit 0
}

SDK_VERSION=$(cat 'sdk.version')
ROOT_DIR=$(cd ..;pwd)
OUTPUT_DIR=$ROOT_DIR/outputBundle
MODULE_NAME=""

while getopts "hp:m:" arg
do
        case $arg in
             h)
                show_help
                ;;
             p)
								if [[ $OPTARG == "android" ]]; then
									TARGET_PLATFORM=$OPTARG
								elif [[ $OPTARG == "ios" ]]; then
									TARGET_PLATFORM=$OPTARG
								else
									echo "platform must be 'android' or 'ios'"
									exit 1
								fi
                ;;
						 m)
						 		MODULE_NAME=$OPTARG
								;;
             ?)
                echo "unkonw argument, use -h for help"
								exit 1
								;;
        esac
done

INPUT_JSBUNDLE="jsbundles/$MODULE_NAME.js"

if [[ -z "$MODULE_NAME" ]]; then
	echo "you must set module name by '-m', or seek help by '-h'."
	exit 0;
fi

OUTPUT_JSBUNDLE=$OUTPUT_DIR/$MODULE_NAME.jsbundle
OUTPUT_SOURCEMAP=$OUTPUT_DIR/$MODULE_NAME.map

if [[ -z "$TARGET_PLATFORM" ]]; then
	echo "you must set platform by '-p', or seek help by '-h'."
	exit 0;
fi

echo "====================================="
echo "=== JDReact JSBundle build System ==="
echo "====================================="
echo "SDK_VERSION=$SDK_VERSION"
echo "TARGET_PLATFORM = $TARGET_PLATFORM"
echo "INPUT_JSBUNDLE = $INPUT_JSBUNDLE"
echo "OUTPUT_JSBUNDLE = $OUTPUT_JSBUNDLE"
echo "OUTPUT_DIR = $OUTPUT_DIR"
echo "MODULE_NAME = $MODULE_NAME"
echo "OUTPUT_SOURCEMAP = $OUTPUT_SOURCEMAP"
echo "ROOT_DIR = $ROOT_DIR"
echo "====================================="

echo "Cleaning output dir..."
rm -rf "$OUTPUT_DIR"
mkdir $OUTPUT_DIR

sed 's/$$MODULE_NAME/'$MODULE_NAME'/g;s/$$PLATFORM/'$TARGET_PLATFORM'/g;s/$$SDK_VERSION/'$SDK_VERSION'/g' ../jsbundles/$MODULE_NAME.version > $OUTPUT_DIR/$MODULE_NAME.version
echo "version=`cat $OUTPUT_DIR/"$MODULE_NAME".version`"

echo  "Starting to make jsbundle..."
node "$ROOT_DIR/node_modules/react-native/local-cli/cli.js" bundle \
--entry-file $INPUT_JSBUNDLE \
--platform $TARGET_PLATFORM \
--dev false \
--sourcemap-output $OUTPUT_SOURCEMAP \
--bundle-output  $OUTPUT_JSBUNDLE \
--assets-dest $OUTPUT_DIR
echo "finished."

if [[ -f "$OUTPUT_JSBUNDLE" ]]; then
    echo -e "make successfully, please find jsbundle file under $OUTPUT_DIR !"
		cd $OUTPUT_DIR
		mv $MODULE_NAME.map ..
		zip -r $MODULE_NAME.so *
		mv ../$MODULE_NAME.map .
		cd -
else
	echo -e "make failed!!!"
    exit 1
fi
exit 0
