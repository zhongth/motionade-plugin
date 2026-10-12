#!/usr/bin/env node
// motionade-export: save a film from an export link, with a receipt. See export-film.mjs.
import { EXIT, ExportFailure, exportFilm, PLAYWRIGHT_CORE_MIN, receiptExit } from "./export-film.mjs";

const USAGE = `Usage:
  node motionade-export.mjs <link> --out <new file>.mp4 [--browser chrome|edge|chromium|<path>] [--timeout <seconds>] [--play] [--headed]

  <link> is the url createExportLink answered. The film renders on this machine in Chrome
  or Edge, headless, through Studio's own export; the MP4 is saved to --out, which must not
  exist yet, and a receipt is printed as JSON. --browser picks Chrome, Edge or Playwright's
  Chromium (by default Chrome, then Edge); a <path> must be Chrome's or Edge's own, where it
  installs: --browser names a browser, never a program. --timeout defaults to 1800 seconds,
  the link's own life. --play also plays the saved file in the same browser at normal speed
  and checks that it plays to the end. Progress goes to stderr.

Every run prints JSON: the receipt, or {ok: false, error: {code, message}}.

Exit codes: 0 exported and every check that ran passed (status says when some were skipped);
1 usage; 2 the export failed; 4 Chrome or Edge could not start (not installed, or blocked by a shell sandbox); 5 no playwright-core
${PLAYWRIGHT_CORE_MIN} or later; 6 the link expired; 7 the link was refused (not valid, the project changed or
is gone, a Scene is missing, the project carries flags); 8 the project or browser blocks the
export (characters no font covers, a font that cannot load, media not ready, no encoder);
9 the file was saved but a receipt check failed; 10 timed out; 11 the link is not https or
local; 12 the link's server did not serve the export page; 13 the browser crashed; 14 the file
did not download; 15 a file appeared at --out meanwhile (the film is kept beside it).`;

/** `--name value` options after the positional link, and the flags `--headed` and `--play`. */
function parse(args) {
  const positional = [];
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--headed" || argument === "--play") options[argument.slice(2)] = true;
    else if (argument.startsWith("--")) options[argument.slice(2)] = args[(index += 1)];
    else positional.push(argument);
  }
  return { positional, options };
}

const print = (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);

const { positional, options } = parse(process.argv.slice(2));
const timeout = options.timeout === undefined ? 1800 : Number(options.timeout);
if (positional.length !== 1 || options.out === undefined || !Number.isFinite(timeout) || timeout <= 0) {
  process.stderr.write(`${USAGE}\n`);
  print({ ok: false, status: "failed", error: { code: "usage", message: "Pass one export link and --out <new file>.mp4; --timeout is a positive number of seconds." } });
  process.exit(EXIT.usage);
}
try {
  const receipt = await exportFilm({
    link: positional[0],
    out: options.out,
    browser: options.browser,
    headed: options.headed === true,
    play: options.play === true,
    timeoutSeconds: timeout,
    log: (line) => process.stderr.write(`[motionade export] ${line}\n`),
  });
  print(receipt);
  process.exitCode = receiptExit(receipt);
} catch (error) {
  // Every failure answers in JSON with its own exit code; an unforeseen one is 2, its stack on stderr.
  const known = error instanceof ExportFailure;
  if (!known) process.stderr.write(`${error?.stack ?? error}\n`);
  print({
    ok: false,
    status: "failed",
    error: known
      ? { code: error.code, message: error.message, ...(error.detail === undefined ? {} : error.detail) }
      : { code: "export_failed", message: String(error?.message ?? error).split("\n")[0] },
  });
  process.exitCode = known ? error.exit : EXIT.failed;
}
