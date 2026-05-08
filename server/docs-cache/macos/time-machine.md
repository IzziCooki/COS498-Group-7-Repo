---
title: Time Machine backup on Mac
source_url: https://support.apple.com/guide/mac-help/back-up-your-mac-mh11421/mac
os: macos
last_verified: 2026-05-07
---

# Time Machine backup on Mac

Time Machine is Apple's built-in backup. It copies the whole Mac to
an external drive every hour, keeping a history of every change so
you can restore any older version of any file.

## What you need

* An external USB or Thunderbolt hard drive at least 2× the size of
  the Mac's drive (more is better).
* Or a network share — a Time Capsule, AirPort, or many modern NAS
  devices.

## Setting up Time Machine

1. Plug in the external drive.
2. macOS may ask **Do you want to use this drive with Time Machine?**
   — click **Use as Backup Disk**.
3. If it does not ask, open **System Settings → General → Time
   Machine → Add Backup Disk** and pick the drive.
4. Choose whether to encrypt the backup (strongly recommended for
   external drives).

The first backup takes hours — leave the drive plugged in overnight.

## Restoring a file

1. With the Time Machine drive connected, click the Time Machine
   icon in the menu bar (or open it from Spotlight).
2. Click **Browse Time Machine Backups**.
3. Use the timeline on the right to scroll back to before the file
   was lost.
4. Find the file or folder, click **Restore**.

The file returns to its original location.

## Restoring the whole Mac to a new computer

1. Connect the backup drive to the new Mac.
2. During the new Mac's setup, choose **Migration Assistant → From a
   Mac, Time Machine backup, or Startup disk**.
3. Pick the backup and let it copy your apps, settings, and files.
