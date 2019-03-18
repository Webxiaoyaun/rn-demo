#!/bin/bash
#########################################################################
# Author: shenchen1@jd.com

PLATFORM=$1
#JDGIT_HOME=$2
#TARGET_BRANCH=$3
#JENKINS_JOB_NAME=$4
#JENKINS_BUILD_ID=$5
#NEED_COMMIT=$6
JDREACT_MODULE=$2
ROOT_DIR=$(cd ..;pwd)
#ANDROID_GIT='jd-android-phone-r3'
#IOS_GIT='JD4iPhone6'
BUILD_OUTPUTFILE="jdreact.properties"
build_version=$TARGET_BRANCH
build_platform=$PLATFORM
bundle_githash=`git log -1 --oneline | cut -d ' ' -f1`
bundle_version=$(cat 'sdk.version')
bundle_iscommitequal='true'
bundle_name=$JDREACT_MODULE
build_result=''
#PUSH_COMMENTS="[jdreact-bundle] update '$bundle_name' to '$JENKINS_BUILD_ID' by CI Robot. \n\nJENKINS_LAST_COMMIT = $bundle_githash\nJENKINS_JOB_NAME = $JENKINS_JOB_NAME \nJENKINS_BUILD_ID = $JENKINS_BUILD_ID \n\n========================================================\n\nif any issue, please contact shenchen1@jd.com."

#echo ">>>>>> Starting to push jsbundles to app GIT ...."
echo "PLATFORM = $PLATFORM"
#echo "JDGIT_HOME = $JDGIT_HOME"
echo "ROOT_DIR = $ROOT_DIR"
#echo "ANDROID_GIT = $ANDROID_GIT"
#echo "IOS_GIT = $IOS_GIT"
#echo "TARGET_BRANCH = $TARGET_BRANCH"
#echo "JENKINS_JOB_NAME = $JENKINS_JOB_NAME"
#echo "JENKINS_BUILD_ID = $JENKINS_BUILD_ID"
echo "BUILD_OUTPUTFILE = $BUILD_OUTPUTFILE"
#echo "NEED_COMMIT = $NEED_COMMIT"
echo "JDREACT_MODULE = $JDREACT_MODULE"

output_buildfile ( ) {
  cd $ROOT_DIR
  echo ">>>>>> output build properties"
  rm -rf $BUILD_OUTPUTFILE
  echo "build_platform=$build_platform"
  echo "build_version=$build_version"
  echo "bundle_name=$bundle_name"
  echo "bundle_githash=$bundle_githash"
  echo "bundle_version=$bundle_version"
  echo "bundle_iscommitequal=$bundle_iscommitequal"
  echo "build_platform=$build_platform" >> $BUILD_OUTPUTFILE
  echo "build_version=$build_version" >> $BUILD_OUTPUTFILE
  echo "bundle_name=$bundle_name" >> $BUILD_OUTPUTFILE
  echo "bundle_githash=$bundle_githash" >> $BUILD_OUTPUTFILE
  echo "bundle_version=$bundle_version" >> $BUILD_OUTPUTFILE
  echo "bundle_iscommitequal=$bundle_iscommitequal" >> $BUILD_OUTPUTFILE
  cd -
}

doErrorExit () {
  cd $ROOT_DIR
  echo ">>>>>> remove BUILD_FILE"
  rm -rf $BUILD_OUTPUTFILE
  exit 1
}

doExit ( ) {
  output_buildfile
  exit 0
}

# got ROOT_DIR
cd $ROOT_DIR

# check if need to commit
if [ -f $BUILD_OUTPUTFILE ]; then
  old_bundle_githash=`grep bundle_githash $BUILD_OUTPUTFILE | cut -d = -f2`
else
  echo "this is first time build!"
fi

if [ "$old_bundle_githash" == "$bundle_githash" ]; then
  echo "no new commit for JDReact bundles, still need to commit!"
  bundle_iscommitequal='true'
else
  echo "it has new commit $bundle_githash !! need complie and commit!"
  bundle_iscommitequal='false'
fi

# build jdreact jsbundle
if [ $PLATFORM == 'android' ]; then
  echo ">>>>>> Starting to build Android jsbundles ...."
  cd scripts
  sed 's/$$MODULE_CODE/9999999.'$bundle_githash'/g' overlayer.version > ../jsbundles/$JDREACT_MODULE.version
  build_result=`./make-fullpack-jsbundles.sh -p android -m $JDREACT_MODULE`
  git checkout -- ../jsbundles/$JDREACT_MODULE.version
  echo "$build_result"
  if [[ $build_result =~ "failed" ]]; then
    echo ">>>>>> jsbundle build failed!!! ...."
    doErrorExit
  fi
  cd -
elif [ $PLATFORM == 'ios' ]; then
  echo ">>>>>> Starting to build iOS jsbundles ...."
  cd scripts
  sed 's/$$MODULE_CODE/9999999.'$bundle_githash'/g' overlayer.version > ../jsbundles/$JDREACT_MODULE.version
  build_result=`./make-fullpack-jsbundles.sh -p ios -m $JDREACT_MODULE`
  echo "$build_result"
  if [[ $build_result =~ "failed" ]]; then
    echo ">>>>>> jsbundle build failed!!! ...."
    doErrorExit
  fi
  cd -
else
  echo "platform is wrong! just exit!"
  doErrorExit
fi

# check if jsbundle package exists
output_buildfile
if [ -f outputBundle/$JDREACT_MODULE.so ]; then
  echo ">>>>>> build successfully!"
else
  echo ">>>>>> cannot find $JDREACT_MODULE.so file, so exit!"
  doErrorExit
fi

# upload so to clound and generate QRCode
echo ">>>>>> start to upload..."
cd node_modules/@jdreact/jdreact-core-scripts/bin/
./cloudUploader-new.sh "$JDREACT_MODULE" "$ROOT_DIR/outputBundle/$JDREACT_MODULE.so" "$ROOT_DIR/SCANME.png"
cd -

doExit
