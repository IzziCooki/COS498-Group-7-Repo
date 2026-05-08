---
title: Uninstall apps on Mac
source_url: https://support.apple.com/guide/mac-help/uninstall-apps-on-mac-mh35835/mac
os: macos
last_verified: 2026-05-07
---

# Uninstall apps on Mac

The cleanest way to uninstall depends on how the app was installed.

## Apps installed from the App Store

1. Open **Launchpad** (press **F4** or pinch with thumb and three
   fingers on the trackpad).
2. Click and hold any app icon until they wiggle.
3. Click the **X** in the top-left of the app you want removed.
4. Click **Delete** to confirm.

If the app does not have an X, it is a built-in macOS app and cannot
be removed.

## Apps from a downloaded .dmg or .pkg

These usually live in the **Applications** folder.

1. Open **Finder → Applications**.
2. Drag the app to the **Trash** in the Dock.
3. Empty the Trash to fully remove it.

## Apps with their own uninstaller

Many large apps (Microsoft Office, Adobe Creative Cloud, antivirus)
ship a separate uninstaller because they install background services.

1. Open the app's folder in **Applications**.
2. Look for a file named **Uninstall [App Name]** or similar.
3. Run that uninstaller — it removes the helpers along with the app.

## After uninstall: removing leftovers

Some apps leave preferences and saved files in:

* `~/Library/Application Support/[App Name]`
* `~/Library/Caches/[App Name]`
* `~/Library/Preferences/[App Name].plist`
* `~/Library/Containers/[App Name]`

Open the user Library by holding **Option** while clicking the
**Go** menu in Finder, then choose **Library**.
