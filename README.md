<h1 align="center"> obsidian-translator </h1>

<p align="center">
  <img src="https://img.shields.io/badge/obsidian--translator-v0.1.0-yellow">
  <img src="https://img.shields.io/badge/node-v14.17.0%2B-green">
</p>

<p align="center"> This is a plugin for Obsidian to translate (selected) text. </p>

<p align="center">

<img src="https://user-images.githubusercontent.com/9375823/167259183-2702dceb-72d3-4ecd-9a07-df4cb06fd932.png" />

</p>

## Install

### Prerequisites

To install this plugin, you will need:

- [Git](https://git-scm.com/) installed on your local machine.
- A GitHub account.
- A local development environment for Node.js and the Node.js version should be above **14.17.0**.
- The [Obsidian](https://obsidian.md/) App.

### Step 1: Download the plugin

Download the [source code](https://github.com/luhaifeng666/obsidian-translator) into the plugins folder.

```
git clone git@github.com:luhaifeng666/obsidian-translator.git
```

### Step2: Build the plugin

1. Navigate into the plugins folder:

```
cd path/to/vault/.obsidian/plugins/obsidian-translator
```

2. Install dependencies:

```
pnpm run install
```

3. Build the plugin:

```
pnpm run build
```

### Step 3: Enable the plugin

To load the plugin in Obsidian, you first need to enable it.

1. Open **Preferences** in Obsidain.
2. In the side menu, click **Community plugins**.
3. Under **Installed plugins**, enable the **Translator** plugin by clicking the toggle button next to it.

You are now running the obsidian-translator plugin! Nice~🎉

## Settings

You can config the plugin by following steps.

> TIP: Before using this plugin, you need to browse to https://ai.youdao.com/#/ to register first!!

- Open **Preferences** in Obsidian.
- In the side menu, click **Translator**.
- Set your `appId`, `secretKey`, and the default language that you wanna translate to.

<p align="center">

<img src="https://user-images.githubusercontent.com/9375823/167259405-a049160b-bc87-4a7d-bc07-6044ae18082a.png" />

</p>

## Usage

### Use directly

- Click the book icon in the left side menu, or click the command icon in the left side menu and select the command named **Translator: translate** to open the translator modal.
- Enter the phrase and select the language that you wanna translate to.
- Click the search button.

### Translate the selected text

This plugin also supports translating the selected text.<br>
You can select the text that you wanna translate and open the translator to translate it.

### Set hotkeys

You can also set hotkey for the **Translator: translate** command.

- Open **Preferences** in Obsidian.
- Click the **Community plugins** in the side menu.
- Click the **Hotkeys icon** next to the information of the **Translator** plugin.
