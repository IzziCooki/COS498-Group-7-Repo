---
title: Terminal basics on Mac
source_url: https://support.apple.com/guide/terminal/welcome/mac
os: macos
last_verified: 2026-05-07
---

# Terminal basics on Mac

Terminal is the macOS command-line app. Most users never need it,
but some setup instructions ask you to paste a single command.

## Opening Terminal

* Press **Command + Space**, type **Terminal**, press **Return**, or
* Open **Finder → Applications → Utilities → Terminal**.

A window appears with a prompt that ends in `$` (or `%` on newer
macOS). This is where you type commands.

## Running a command safely

Before pasting any command an article tells you to run, ask:

1. Is the article from a trusted source (Apple Support, the official
   documentation site of the software)?
2. Do I understand roughly what the command does?
3. Does the command start with `sudo`? (If yes, it has admin power —
   be extra careful.)
4. Does the command use `rm -rf` or pipe `curl` into a shell? (Both
   are red flags — never run them blindly.)

## Common safe commands

* `pwd` — print the current folder path.
* `ls` — list files in the current folder.
* `cd Documents` — change to the Documents folder.
* `cd ..` — go up one folder.
* `clear` — clear the screen.
* `man <command>` — show the manual page for a command.

## Closing Terminal

* Type `exit` and press **Return**, then close the window, or
* Press **Command + Q**.

## When a command does nothing

A long-running command may show no output until it is finished.
Press **Control + C** to cancel it. If Terminal seems frozen, the
program inside might be waiting for input.
