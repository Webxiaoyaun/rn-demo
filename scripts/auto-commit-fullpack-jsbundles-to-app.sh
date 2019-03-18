#!/bin/bash
#########################################################################
# Author: shenchen1@jd.com

PLATFORM=$1
JDGIT_HOME=$2
TARGET_BRANCH=$3
JENKINS_JOB_NAME=$4
JENKINS_BUILD_ID=$5
NEED_COMMIT=$6
JDREACT_MODULE=$7
IOS_GIT=$8
ROOT_DIR=$(cd ..;pwd)
ANDROID_GIT='jd-android-phone-r3'
BUILD_OUTPUTFILE="jdreact.properties"
build_version=$TARGET_BRANCH
build_platform=$PLATFORM
bundle_githash=`git log -1 --oneline | cut -d ' ' -f1`
bundle_version=$(cat 'sdk.version')
bundle_iscommitequal='true'
bundle_name=$JDREACT_MODULE
build_result=''
PUSH_COMMENTS="[jdreact-bundle] update '$bundle_name' to '$JENKINS_BUILD_ID' by CI Robot. \n\nJENKINS_LAST_COMMIT = $bundle_githash\nJENKINS_JOB_NAME = $JENKINS_JOB_NAME \nJENKINS_BUILD_ID = $JENKINS_BUILD_ID \n\n========================================================\n\nif any issue, please contact shenchen1@jd.com."

echo ">>>>>> Starting to push jsbundles to app GIT ...."
echo "PLATFORM = $PLATFORM"
echo "JDGIT_HOME = $JDGIT_HOME"
echo "ROOT_DIR = $ROOT_DIR"
echo "ANDROID_GIT = $ANDROID_GIT"
echo "IOS_GIT = $IOS_GIT"
echo "TARGET_BRANCH = $TARGET_BRANCH"
echo "JENKINS_JOB_NAME = $JENKINS_JOB_NAME"
echo "JENKINS_BUILD_ID = $JENKINS_BUILD_ID"
echo "BUILD_OUTPUTFILE = $BUILD_OUTPUTFILE"
echo "NEED_COMMIT = $NEED_COMMIT"
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
  build_result=`./make-fullpack-jsbundles.sh -p android -m $JDREACT_MODULE`
  echo "$build_result"
  if [[ $build_result =~ "failed" ]]; then
    echo ">>>>>> jsbundle build failed!!! ...."
    doErrorExit
  fi
  cd -
elif [ $PLATFORM == 'ios' ]; then
  echo ">>>>>> Starting to build iOS jsbundles ...."
  cd scripts
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

# init & fetch android git
if [ $PLATFORM == 'android' ]; then
  if [ -d $JDGIT_HOME/$ANDROID_GIT ]; then
    cd $JDGIT_HOME/$ANDROID_GIT
    echo ">>>>>> fetch latest Android GIT"
    git checkout -- .
    git fetch origin || git fetch origin || git fetch origin || doErrorExit
    git checkout origin/$TARGET_BRANCH
    cd -
  else
    echo ">>>>>> not find android git, exit!"
    doErrorExit
  fi
elif [ $PLATFORM == 'ios' ]; then
  if [ -d $JDGIT_HOME/$IOS_GIT ]; then
    cd $JDGIT_HOME/$IOS_GIT
    echo ">>>>>> fetch latest iOS GIT"
    git checkout -- .
    git fetch origin || git fetch origin || git fetch origin || doErrorExit
    git checkout origin/$TARGET_BRANCH
    cd -
  else
    echo ">>>>>> not find iOS git, exit!"
    doErrorExit
  fi
else
  echo "platform is wrong! just exit!"
  doErrorExit
fi

# copy jsbundle to android git
output_buildfile
if [ $PLATFORM == 'android' ]; then
  echo ">>>>>> copy jsbundle to android git"
  cp outputBundle/*.so $JDGIT_HOME/$ANDROID_GIT/AndroidJD-Phone/assets/jdreact/
  cp jdreact.properties $JDGIT_HOME/$ANDROID_GIT/AndroidJD-Phone/bundlesProperties/jdreact/$JDREACT_MODULE.properties
elif [ $PLATFORM == 'ios' ]; then
  echo ">>>>>> copy jsbundle to iOS git"
  cp outputBundle/*.so $JDGIT_HOME/$IOS_GIT/JD4iPhone/View/NanJing/ReactNative/Res/react.bundle/
else
  echo "platform is wrong! just exit!"
  doErrorExit
fi


# push changes to android git
if [ $PLATFORM == 'android' ]; then
  echo ">>>>>> push changes to android git"
  cd $JDGIT_HOME/$ANDROID_GIT
  git add AndroidJD-Phone/assets/jdreact/*
  git add AndroidJD-Phone/bundlesProperties/jdreact/*
  git commit -m "`echo -e $PUSH_COMMENTS`"
  echo ">>>>>> 2.1) remote prune origin..."
  git remote prune origin
  git remote update
  git rebase origin/$TARGET_BRANCH
  if [ $NEED_COMMIT == 'true' ]; then
    git push origin HEAD:$TARGET_BRANCH
    if [[ "$?" != "0" ]]; then
      echo ">>>>>> GIT PUSH Failed!!! ...."
      doErrorExit
    fi
    echo ">>>>>> PUSH ok!!"
  fi
  cd -
elif [ $PLATFORM == 'ios' ]; then
  echo ">>>>>> push changes to iOS git"
  cd $JDGIT_HOME/$IOS_GIT
  echo ">>>>>> 1) git add files..."
  git add JD4iPhone/View/NanJing/ReactNative/Res/react.bundle/*
  echo ">>>>>> 2) git commit..."
  git commit -m "`echo -e $PUSH_COMMENTS`"
  echo ">>>>>> 2.1) remote prune origin..."
  git remote prune origin
  echo ">>>>>> 3) git remote update..."
  git remote update
  echo ">>>>>> 4) git rebase..."
  git rebase origin/$TARGET_BRANCH
  if [ $NEED_COMMIT == 'true' ]; then
    echo ">>>>>> 5) start to push"
    git push origin HEAD:$TARGET_BRANCH
    if [[ "$?" != "0" ]]; then
      echo ">>>>>> GIT PUSH Failed!!! ...."
      doErrorExit
    fi
    echo ">>>>>> PUSH ok!!"
  fi
  cd -
else
  echo "platform is wrong! just exit!"
  doErrorExit
fi

doExit
