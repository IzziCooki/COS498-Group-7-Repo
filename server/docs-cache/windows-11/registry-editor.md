---
title: Registry Editor (advanced) on Windows 11
source_url: https://support.microsoft.com/en-us/topic/how-to-add-modify-or-delete-registry-subkeys-and-values-by-using-a-reg-file-9c7f37cf-a5e9-e1cd-c4fa-2a26218a1a23
os: windows-11
last_verified: 2026-05-07
---

# Registry Editor (advanced) on Windows 11

The Windows Registry is a database of low-level configuration. Editing
it incorrectly can break Windows. Only edit the registry when you have
a specific instruction from a verified source — never paste in changes
from a forum without a backup.

## Opening the Registry Editor

1. Press **Windows key + R** to open the Run dialog.
2. Type `regedit` and press **Enter**.
3. Confirm the User Account Control prompt.

## Always back up first

Before changing anything:

1. In Registry Editor, click the key (folder) you are about to edit.
2. Choose **File → Export**.
3. Save the .reg file with a clear name and date.

To restore: double-click the .reg file you exported.

## Top-level hives

* **HKEY_CURRENT_USER (HKCU)** — settings for the signed-in user.
* **HKEY_LOCAL_MACHINE (HKLM)** — settings for the whole computer.
* **HKEY_CLASSES_ROOT (HKCR)** — file type associations.

## When you should NOT edit the registry

* The same setting exists somewhere in **Settings**.
* You found the instruction on an unofficial forum.
* The instruction tells you to delete a top-level key.
* You do not have a recent backup.

If in doubt, leave the registry alone and ask for a Microsoft Support
article instead.
