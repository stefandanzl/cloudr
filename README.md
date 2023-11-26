

<h1 align="center">
  <br>
  <a href="https://cloudr.org/" alt="logo" ><img src="https://raw.githubusercontent.com/cloudr/frontend/master/public/static/img/logo192.png" width="150"/></a>
  <br>
  Cloudr
  <br>
</h1>
<h4 align="center">Self-hosted file management system with muilt-cloud support.</h4>

<p align="center">
  <a href="https://github.com/cloudr/Cloudr/actions/workflows/test.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/cloudr/Cloudr/test.yml?branch=master&style=flat-square"
         alt="GitHub Test Workflow">
  </a>
  <a href="https://codecov.io/gh/cloudr/Cloudr"><img src="https://img.shields.io/codecov/c/github/cloudr/Cloudr?style=flat-square"></a>
  <a href="https://goreportcard.com/report/github.com/cloudr/Cloudr">
      <img src="https://goreportcard.com/badge/github.com/cloudr/Cloudr?style=flat-square">
  </a>
  <a href="https://github.com/cloudr/Cloudr/releases">
    <img src="https://img.shields.io/github/v/release/cloudr/Cloudr?include_prereleases&style=flat-square" />
  </a>
  <a href="https://hub.docker.com/r/cloudr/cloudr">
     <img src="https://img.shields.io/docker/image-size/cloudr/cloudr?style=flat-square"/>
  </a>
</p>
<p align="center">
  <a href="https://cloudr.org">Homepage</a> •
  <a href="https://demo.cloudr.org">Demo</a> •
  <a href="https://forum.cloudr.org/">Discussion</a> •
  <a href="https://docs.cloudr.org/v/en/">Documents</a> •
  <a href="https://github.com/cloudr/Cloudr/releases">Download</a> •
  <a href="https://t.me/cloudr_official">Telegram Group</a> •
  <a href="#scroll-License">License</a>
</p>



![Screenshot](https://raw.githubusercontent.com/cloudr/docs/master/images/homepage.png)

## :sparkles: Features

* :cloud: Support storing files into Local storage, Remote storage, Qiniu, Aliyun OSS, Tencent COS, Upyun, OneDrive, S3 compatible API.
* :outbox_tray: Upload/Download in directly transmission with speed limiting support.
* 💾 Integrate with Aria2 to download files offline, use multiple download nodes to share the load.
* 📚 Compress/Extract files, download files in batch.
* 💻 WebDAV support covering all storage providers.
* :zap:Drag&Drop to upload files or folders, with streaming upload processing.
* :card_file_box: Drag & Drop to manage your files.
* :family_woman_girl_boy:   Multi-users with multi-groups.
* :link: Create share links for files and folders with expiration date.
* :eye_speech_bubble: Preview videos, images, audios, ePub files online; edit texts, Office documents online.
* :art: Customize theme colors, dark mode, PWA application, SPA, i18n.
* :rocket: All-In-One packing, with all features out-of-the-box.
* 🌈 ... ...

## :hammer_and_wrench: Deploy

Download the main binary for your target machine OS, CPU architecture and run it directly.

```shell
# Extract Cloudr binary
tar -zxvf cloudr_VERSION_OS_ARCH.tar.gz

# Grant execute permission
chmod +x ./cloudr

# Start Cloudr
./cloudr
```

The above is a minimum deploy example, you can refer to [Getting started](https://docs.cloudr.org/v/en/getting-started/install) for a completed deployment.

## :gear: Build

You need to have `Go >= 1.18`, `node.js`, `yarn`, `zip`, [goreleaser](https://goreleaser.com/intro/) and other necessary dependencies before you can build it yourself.

#### Install goreleaser

```shell
go install github.com/goreleaser/goreleaser@latest
```

#### Clone the code

```shell
git clone --recurse-submodules https://github.com/cloudr/Cloudr.git
```

#### Compile

```shell
goreleaser build --clean --single-target --snapshot
```

## :alembic: Stacks

* [Go](https://golang.org/) + [Gin](https://github.com/gin-gonic/gin)
* [React](https://github.com/facebook/react) + [Redux](https://github.com/reduxjs/redux) + [Material-UI](https://github.com/mui-org/material-ui)

## :scroll: License

GPL V3
