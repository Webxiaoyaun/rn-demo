#!/bin/bash
#########################################################################
# Author: shenchen1@jd.com

show_help ( ) {
  echo "Help:"
  echo "-h : Show Help"
  echo "-p : Target Platform, 'android' or 'ios'"
  echo "-m : Target module name"
  echo "-z : zip build files"
  echo "-c : optim Image"
  exit 0
}

SDK_VERSION=$(cat 'scripts/sdk.version')
ROOT_DIR=$(cd .;pwd)
OUTPUT_DIR=$ROOT_DIR/outputBundle
MODULE_NAME=""
ZIP="false"
OPTIM_IMAGE="false"

while getopts "hzcp:m:" arg
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
             z)
                ZIP="true"
                ;;
             c)
                OPTIM_IMAGE="true"
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
echo "OUTPUT_SOURCEMAP = $OUTPUT_SOURCEMAP"
echo "OUTPUT_DIR = $OUTPUT_DIR"
echo "MODULE_NAME = $MODULE_NAME"
echo "ROOT_DIR = $ROOT_DIR"
echo "====================================="

echo "NodeJs Version"
node --version

echo "Cleaning output dir..."
rm -rf  "$OUTPUT_DIR"
mkdir $OUTPUT_DIR

if [[ -d "node_modules/@jdreact/jdreact-core-web" ]]; then
  echo "clean jdreact-core-web"
  yarn remove @jdreact/jdreact-core-web
fi


cp ./node_modules/@jdreact/jdreact-core-packager/local-cli/bundle/buildBundle.js ./node_modules/react-native/local-cli/bundle/buildBundle.js
cp ./node_modules/@jdreact/jdreact-core-packager/packager/src/Bundler/index.js ./node_modules/react-native/packager/src/Bundler/index.js
echo  "Starting to make jsbundle..."
node "$ROOT_DIR/node_modules/@jdreact/jdreact-core-packager/lib/buildBusinessBundle.js" bundle \
--dev false \
--entry-file $INPUT_JSBUNDLE \
--platform $TARGET_PLATFORM \
--bundle-output  $OUTPUT_JSBUNDLE \
--sourcemap-output $OUTPUT_SOURCEMAP \
--assets-dest $OUTPUT_DIR \
--common-bundle ./node_modules/@jdreact/jdreact-jsbundle-commonpack/commonBundleConfig.$TARGET_PLATFORM.json
echo "finished."

if [[ "$OPTIM_IMAGE" == "true" ]]; then
  echo "压缩图片"
  find "$OUTPUT_DIR/" -type f -name *.png -exec pngquant --force --skip-if-larger --ext .png -v {} \;
fi


sed 's/$$MODULE_NAME/'$MODULE_NAME'/g;s/$$PLATFORM/'$TARGET_PLATFORM'/g;s/$$SDK_VERSION/'$SDK_VERSION'/g' jsbundles/$MODULE_NAME.version > $OUTPUT_DIR/$MODULE_NAME.version
echo "business version=`cat $OUTPUT_DIR/"$MODULE_NAME".version`"

if [[ -f "$OUTPUT_JSBUNDLE" ]]; then
    if [ "$TARGET_PLATFORM" == "android" ]; then
     rm -f `find $OUTPUT_DIR/$MODULE_NAME/drawable* -name *.html`
    fi
    if [ "$TARGET_PLATFORM" == "ios" ]; then
      rm -rf "$OUTPUT_DIR/assets/node_modules/@jdreact/jdreact-core-lib"
      rm -rf "$OUTPUT_DIR/assets/node_modules/@jdreact/jdreact-navigation"
    fi
    if [[ $ZIP == "true" ]]; then
      cd $OUTPUT_DIR
      zip -m -r $MODULE_NAME.so *
    fi
    echo -e "make successfully, please find jsbundle file under $OUTPUT_DIR !"
else
  echo -e "make failed!!!"
    exit 1
fi
exit 0
