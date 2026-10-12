# Motionade plugin

Create and refine motion films from Claude Code or Codex. The plugin connects your agent to
Motionade and teaches it motion design: composition, choreography, timing, and how to build a
film from native objects and motion. What you get is a project you can open and adjust in
Motionade Studio, not a rendered file.

Motionade is in private alpha. Signing in needs an invited account.

The plugin uses the proprietary [Motionade Plugin License 1.0](LICENSE) from Pixed Studio LLC.
Read it before installing or using the plugin; the permissions below are subject to it.

## Install

### Claude Code

Needs Claude Code 2.1.287 or later. In a session:

```
/plugin marketplace add zhongth/motionade-plugin
/plugin install motionade@motionade
```

Then run `/mcp`, choose `plugin:motionade:motion-studio`, and choose **Authenticate**. Your
browser opens Motionade's sign-in and asks you to approve the connection.

### Codex

Needs Codex 0.158 or later. In a terminal:

```
codex plugin marketplace add zhongth/motionade-plugin
codex plugin add motionade@motionade
codex mcp login motion-studio
```

The last command opens Motionade's sign-in in your browser and asks you to approve the
connection.

## Use

Ask for a film in your own words:

> Make a 10-second launch film for my app in Motionade. Use `logo.png` and `demo.mp4` from this folder.

The agent uploads the media you point it at, builds the film, checks its own frames, and gives
you a Studio link. Open it to play the film, adjust anything by hand, and export an MP4. Ask the
agent for a revision while Studio is open and the change appears there.

The agent can also export the film itself, on your machine: your Google Chrome or Microsoft Edge
renders it in the background through Studio's own export, and the agent checks the file and its
sound. This needs the `playwright-core` package once, which the agent installs with one `npm`
command (it downloads no browser), and `ffmpeg` for the checks on the file.

## Update

- Claude Code: `/plugin marketplace update motionade`. To stay current without asking, open
  `/plugin`, go to **Marketplaces**, choose `motionade`, and choose **Enable auto-update**.
- Codex: `codex plugin marketplace upgrade`.

## Disconnect

In Studio, open **Account settings**. **Connected agents** lists every agent you signed in;
**Disconnect** signs one out, and its next call is refused until you sign in again.

## Feedback

Send feedback, bugs and questions to [feedback@motionade.app](mailto:feedback@motionade.app).
Studio's account menu has the same address.

## Licence

[Motionade Plugin License 1.0](LICENSE), copyright Pixed Studio LLC. This is a proprietary,
source-available licence, not an open-source licence.

- Use and privately customize the plugin for Motionade workflows, including paid client work.
  Local and hosted agents may load and cache it for those workflows.
- Your projects and videos remain yours to use, edit, export, and sell. This licence imposes
  no output royalty or attribution requirement.
- Marketplaces and installation tools may distribute intact official releases with the
  licence and notices. Public modified distributions, separate resale or rebranding, and
  adapting the materials to power another creation product require written permission,
  subject to the statutory exceptions in the licence.

The licence covers the distributed plugin materials. Hosted Motionade service access and
third-party components have separate terms. The full licence controls this summary.

## Versions

This repository holds released copies of the plugin; each commit is one release. What changed
in each is in the plugin's `CHANGELOG.md`.
