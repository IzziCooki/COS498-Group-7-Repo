---
title: Environment variables on Windows 11
source_url: https://support.microsoft.com/en-us/topic/configuring-the-system-and-user-environment-variables-bb7f64fc-f5be-4f1d-8b75-1c19c7b0b31a
os: windows-11
last_verified: 2026-05-07
---

# Environment variables on Windows 11

Environment variables are pieces of named text the operating system
makes available to every program — for example `%TEMP%` (the user's
temporary folder) or `%PATH%` (where Windows looks for command-line
programs).

## Opening the Environment Variables editor

1. Press **Windows key + R**, type `sysdm.cpl`, press **Enter**.
2. Click the **Advanced** tab.
3. Click **Environment Variables…** at the bottom.

There are two lists:

* **User variables** — apply only to the signed-in user.
* **System variables** — apply to all users on this computer.

## Adding a folder to PATH

`PATH` is a semicolon-separated list of folders. Programs in any of
those folders can be run by name from the command line.

1. In the editor, select **Path** under **User variables**.
2. Click **Edit**.
3. Click **New** and type the folder path, for example
   `C:\Tools\bin`.
4. Click **OK** to close all three dialogs.
5. Open a new terminal window — old terminals still see the old PATH.

## Common built-in variables

* `%USERPROFILE%` — your home folder, like `C:\Users\Jane`.
* `%APPDATA%` — `C:\Users\Jane\AppData\Roaming`.
* `%LOCALAPPDATA%` — `C:\Users\Jane\AppData\Local`.
* `%TEMP%` — your temporary files folder.
* `%PROGRAMFILES%` — `C:\Program Files`.
