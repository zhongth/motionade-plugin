// The Motionade plugin's local export (plugin spec §8). It opens an export link
// from `createExportLink` in the user's own Chrome or Edge, headless, through
// playwright-core (which downloads no browser). The page renders the film on
// this machine through Studio's own export. This saves the MP4 and checks it
// into a receipt. It renders nothing itself and holds no sign-in: the link
// carries its own short-lived, read-only access.
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants, existsSync } from "node:fs";
import { copyFile, link as hardLink, readFile, realpath, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import path from "node:path";

/** Exit codes: 0 and 1 as the plugin's `motionade` command; each failure its own. 3 is that command's "ffmpeg missing". */
export const EXIT = Object.freeze({
  done: 0,
  usage: 1,
  failed: 2,
  noBrowser: 4,
  noDriver: 5,
  expired: 6,
  refused: 7,
  blocked: 8,
  checksFailed: 9,
  timedOut: 10,
  insecureLink: 11,
  unreachable: 12,
  browserCrashed: 13,
  downloadFailed: 14,
  outputAppeared: 15,
});

/** The version this runner is tested with, and the oldest it takes. */
export const PLAYWRIGHT_CORE_MIN = "1.60.0";
export const PLAYWRIGHT_CORE = `playwright-core@${PLAYWRIGHT_CORE_MIN}`;
/** Where the install command the runner prints puts the driver, and where it looks. */
export const DRIVER_HOME = path.join(homedir(), ".motionade", "runtime");

/** A failure with its exit code; `fallback` says how to finish without this runner. */
export class ExportFailure extends Error {
  constructor(code, exit, message, detail) {
    super(message);
    this.code = code;
    this.exit = exit;
    this.detail = detail;
  }
}

/** Sound above -60 dBFS is heard; the export page measures the mix with the same threshold. */
const HEARD = 10 ** (-60 / 20);
/** How far the file's sound may start from the mix's: AAC frames blur an onset by a few samples. */
const SYNC_TOLERANCE_SECONDS = 0.01;
/** How far the file's loudness may move from the mix's: AAC at these rates keeps RMS well within it. */
const LOUDNESS_TOLERANCE_DB = 1;
/** Sound that stops this long before the picture ends is reported. */
const SHORT_SOUND_SECONDS = 1;

const LINK_REFUSED = new Set(["invalid_link", "project_not_found", "project_changed", "scene_not_found", "project_carries_flags", "invalid_document", "export_unavailable"]);
const BLOCKED = new Set(["missing_glyphs", "fonts_unavailable", "export_blocked", "browser_cannot_export", "renderer_unavailable"]);

/** The exit code for a failure the export page reported. */
export function exitForPageError(code) {
  if (code === "link_expired") return EXIT.expired;
  if (LINK_REFUSED.has(code)) return EXIT.refused;
  if (BLOCKED.has(code)) return EXIT.blocked;
  return EXIT.failed;
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * The ticket and its server, from a link `createExportLink` answered. Only
 * https, or http to this machine (File Mode): the page runs in the user's own
 * browser, so a link to anywhere else is refused.
 */
export function parseExportLink(link) {
  let url;
  try {
    url = new URL(link);
  } catch {
    return { ok: false, reason: "not_export_link" };
  }
  const ticket = /^\/export\/([\w-]+\.[\w-]+)$/.exec(url.pathname)?.[1];
  if (!["http:", "https:"].includes(url.protocol) || ticket === undefined || url.username !== "" || url.password !== "") {
    return { ok: false, reason: "not_export_link" };
  }
  if (url.protocol === "http:" && !LOOPBACK.has(url.hostname)) return { ok: false, reason: "insecure_link" };
  return { ok: true, origin: url.origin, ticket, href: url.href };
}

const firstLine = (error) => String(error?.message ?? error).split("\n")[0];

/** What a film's media, images and fonts arrive as: Studio reads them with fetch, an element or a stylesheet. */
const MEDIA_TYPES = new Set(["image", "media", "font", "fetch", "xhr", "stylesheet"]);

/**
 * What the export page may load, as Studio would. Every navigation stays on
 * the link's server. A GET for an image, media or a font may come from any
 * https server (a public image, the Google fonts catalogue), or over http from
 * this machine only. Hosted media arrive by a redirect from the link's server,
 * which the browser follows without asking again. `data:` and `blob:` stay in
 * the page. Anything else is blocked; the receipt fails on a block the film
 * needs and names any other (`receiptChecks`).
 *
 * @param {{ url: string; method: string; resourceType: string; navigation: boolean }} request
 * @param {string} origin
 */
export function allowedRequest({ url, method, resourceType, navigation }, origin) {
  const target = new URL(url);
  if (target.protocol === "data:" || target.protocol === "blob:") return true;
  if (target.origin === origin) return true;
  if (navigation || method !== "GET" || !MEDIA_TYPES.has(resourceType)) return false;
  return target.protocol === "https:" || (target.protocol === "http:" && LOOPBACK.has(target.hostname));
}

/** A URL to name in a receipt: no query, no fragment, and no export ticket in its path. */
export const redactUrl = (url) => {
  try {
    const target = new URL(url);
    return `${target.origin}${target.pathname}`.replace(/\/(api\/)?export\/[^/]+/, (_, api) => `/${api ?? ""}export/<ticket>`);
  } catch {
    return "<not a URL>";
  }
};

const versionAtLeast = (version, minimum) => {
  const [a, b] = [version, minimum].map((value) => value.split("-")[0].split(".").map(Number));
  for (let index = 0; index < 3; index++) if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) > (b[index] ?? 0);
  return true;
};

/**
 * The installed playwright-core, at `PLAYWRIGHT_CORE_MIN` or later: where Node
 * finds it from this file, then in `DRIVER_HOME`. A copy too old is passed
 * over and named; one that fails to load for another reason says why.
 */
export function loadDriver(fallback, places = [import.meta.url, path.join(DRIVER_HOME, "node_modules", "noop.js")]) {
  // Playwright reads its settings from the environment as it loads, PLAYWRIGHT_BROWSERS_PATH among them, which
  // moves where `chromium` comes from. None of them count here, nor in the browser, which inherits this environment.
  for (const name of Object.keys(process.env)) {
    if (/^(?:npm_(?:package_)?config_)?playwright_/i.test(name)) delete process.env[name];
  }
  const tooOld = [];
  for (const place of places) {
    const require = createRequire(place);
    let version;
    try {
      ({ version } = require("playwright-core/package.json"));
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") throw error;
      continue;
    }
    if (!versionAtLeast(version, PLAYWRIGHT_CORE_MIN)) {
      tooOld.push(version);
      continue;
    }
    return require("playwright-core");
  }
  const found = tooOld.length === 0 ? "which is not installed" : `and found only ${tooOld.join(", ")}, older than ${PLAYWRIGHT_CORE_MIN}`;
  throw new ExportFailure("no_driver", EXIT.noDriver,
    `This export drives your own Chrome or Edge through playwright-core ${PLAYWRIGHT_CORE_MIN} or later, ${found}. Install it once (it downloads no browser): npm install --prefix ${JSON.stringify(DRIVER_HOME)} ${PLAYWRIGHT_CORE}. Then run this again.`,
    { fallback });
}

/** Playwright's channel for each name `--browser` takes; `chromium` is Playwright's own build. */
const CHANNELS = new Map([["chrome", "chrome"], ["edge", "msedge"], ["chromium", "chromium"]]);

/** Where Chrome and Edge install on this platform, by channel: where Playwright's `chrome` and `msedge` channels look. */
function installedBrowsers() {
  if (process.platform === "darwin") {
    return [
      { channel: "chrome", place: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" },
      { channel: "msedge", place: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" },
    ];
  }
  if (process.platform === "linux") {
    return [{ channel: "chrome", place: "/opt/google/chrome/chrome" }, { channel: "msedge", place: "/opt/microsoft/msedge/msedge" }];
  }
  if (process.platform !== "win32") return [];
  const { LOCALAPPDATA, PROGRAMFILES, HOMEDRIVE } = process.env;
  const prefixes = [LOCALAPPDATA, PROGRAMFILES, process.env["PROGRAMFILES(X86)"], HOMEDRIVE && `${HOMEDRIVE}\\Program Files`, HOMEDRIVE && `${HOMEDRIVE}\\Program Files (x86)`];
  return prefixes.filter(Boolean).flatMap((prefix) => [
    { channel: "chrome", place: path.win32.join(prefix, "Google", "Chrome", "Application", "chrome.exe") },
    { channel: "msedge", place: path.win32.join(prefix, "Microsoft", "Edge", "Application", "msedge.exe") },
  ]);
}

/**
 * The Playwright channel `--browser` names: `chrome`, `edge` or `chromium`, or the
 * absolute path of Chrome or Edge where it installs (by its real path). Anything else
 * is refused before the driver loads: a person may approve this export outside a shell
 * sandbox, so --browser names a browser, never a program. Undefined when not given.
 */
export async function resolveBrowser(browser) {
  if (browser === undefined) return undefined;
  if (CHANNELS.has(browser)) return { channel: CHANNELS.get(browser) };
  const installed = installedBrowsers();
  const real = path.isAbsolute(browser) ? await realpath(browser).catch(() => null) : null;
  for (const { channel, place } of installed) {
    if (real !== null && real === await realpath(place).catch(() => null)) return { channel };
  }
  // An agent may pass a link here by mistake: a link is named only as one, and an export ticket never.
  const received = /^<?(?:https?|file):|:\/\//i.test(browser) ? "a link" : browser.replace(/\/export\/[^/\s]+/g, "/export/<ticket>");
  throw new ExportFailure("usage", EXIT.usage,
    `--browser takes chrome, edge or chromium, or the absolute path of Chrome or Edge where it installs (${installed.map(({ place }) => place).join(", ")}). Leave it out to use Chrome, then Edge. Received: ${received}`);
}

/** Chrome, then Edge, unless `browser` is the channel `resolveBrowser` answered. */
export async function launchBrowser(chromium, { browser, headed, fallback }) {
  const candidates = browser === undefined ? [{ channel: "chrome" }, { channel: "msedge" }] : [browser];
  const tried = [];
  let found = false;
  for (const candidate of candidates) {
    try {
      // The browser's own sandbox stays on: the page and its media come from the network.
      const launched = await chromium.launch({ ...candidate, headless: !headed, chromiumSandbox: true });
      return { launched, name: candidate.channel };
    } catch (error) {
      tried.push(`${candidate.channel}: ${String(error.message).split("\n")[0]}`);
      // Playwright's words for a browser that is not there, as against one that failed to start.
      found ||= !/is not found|executable doesn't exist|is not supported on/i.test(String(error.message));
    }
  }
  throw new ExportFailure("no_browser", EXIT.noBrowser, found
    ? "Chrome or Edge is installed but could not start. A coding agent's shell sandbox can block it: ask the person to approve running this one export command outside the sandbox, then run it again."
    : "No Chrome or Edge is installed on this machine. Install Google Chrome (it encodes the film's H.264 picture and AAC sound). --browser takes only chrome, edge or chromium, or the path of Chrome or Edge where it installs.",
    { tried, fallback });
}

/**
 * Plays the saved file in the same browser at normal speed, as a person's
 * player would, and reports what it showed: a container a decoder accepts can
 * still trip a player. A refused `play()` and a playback that never reaches
 * its end are answered as such, never thrown.
 */
export async function playInBrowser(context, bytes, timeout) {
  const server = createServer((request, response) => {
    if (request.url === "/film.mp4") {
      response.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": bytes.length });
      response.end(bytes);
    } else {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end('<!doctype html><title>Exported film</title><video id="film" muted preload="auto" src="/film.mp4"></video>');
    }
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  try {
    const player = await context.newPage();
    await player.goto(`http://127.0.0.1:${server.address().port}/`);
    const refused = await player.evaluate(() => {
      const video = document.getElementById("film");
      window.__played = { frames: 0, lastMediaTime: 0, errors: [] };
      video.addEventListener("error", () => window.__played.errors.push(video.error?.message ?? "media error"));
      const frame = (_now, metadata) => {
        window.__played.frames += 1;
        window.__played.lastMediaTime = metadata.mediaTime;
        video.requestVideoFrameCallback(frame);
      };
      video.requestVideoFrameCallback(frame);
      return video.play().then(() => null, (error) => String(error?.message ?? error));
    });
    let stalled = null;
    if (refused === null) {
      await player.waitForFunction(() => document.getElementById("film").ended || document.getElementById("film").error, null, { timeout })
        .catch((error) => { stalled = `It did not reach its end within ${Math.round(timeout / 1000)} s (${firstLine(error)}).`; });
    }
    const played = await player.evaluate(() => {
      const video = document.getElementById("film");
      return { ...window.__played, ended: video.ended, duration: video.duration, width: video.videoWidth, height: video.videoHeight };
    });
    return {
      ...played,
      errors: [...played.errors, ...(refused === null ? [] : [`play() was refused: ${refused}`]), ...(stalled === null ? [] : [stalled])],
    };
  } finally {
    await new Promise((done) => server.close(done));
  }
}

/**
 * Opens the link headless, waits for the page's state, and saves the file it
 * hands over. Answers the page's result and what the browser said; with
 * `play`, also what playing the saved file showed.
 */
export async function renderThroughPage(chromium, { link, out, browser, headed, timeoutSeconds, play, log }) {
  const fallback = `Or open the link in Chrome or Edge on this machine; the page renders the film there and downloads the MP4: ${link.href}`;
  const { launched, name } = await launchBrowser(chromium, { browser, headed, fallback });
  const errors = [];
  let crashed = false;
  // Each step's own failure, with its own exit code and the cause in one line.
  const step = async (code, exit, what, work) => {
    try {
      return await work();
    } catch (error) {
      if (error instanceof ExportFailure) throw error;
      if (crashed || /Target (page, context or browser has been closed|crashed)/.test(firstLine(error))) {
        throw new ExportFailure("browser_crashed", EXIT.browserCrashed, `The browser closed or crashed while trying to ${what}: ${firstLine(error)}`, { fallback });
      }
      throw new ExportFailure(code, exit, `The browser could not ${what}: ${firstLine(error)}`, { fallback });
    }
  };
  try {
    const context = await launched.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 800 } });
    // What Studio would load, and nothing else (`allowedRequest`); every block and every
    // failed load is named in the receipt with its kind, so a film missing media never passes.
    const blocked = [];
    const failed = [];
    await context.route("**/*", (route) => {
      const request = route.request();
      const asked = { url: request.url(), method: request.method(), resourceType: request.resourceType(), navigation: request.isNavigationRequest() };
      if (allowedRequest(asked, link.origin)) return route.continue();
      blocked.push({ url: redactUrl(asked.url), type: asked.resourceType });
      return route.abort("blockedbyclient");
    });
    const page = await context.newPage();
    // A read the page cancels itself (a seek, a range it no longer needs) is not a failure, and a
    // block is named in `blocked` already: Chrome reports one as `net::ERR_BLOCKED_BY_CLIENT.Inspector`.
    page.on("requestfailed", (request) => {
      const reason = request.failure()?.errorText ?? "failed";
      if (reason === "net::ERR_ABORTED" || reason.startsWith("net::ERR_BLOCKED_BY_CLIENT")) return;
      failed.push({ url: redactUrl(request.url()), type: request.resourceType(), reason });
    });
    page.on("response", (response) => {
      if (response.status() >= 400) failed.push({ url: redactUrl(response.url()), type: response.request().resourceType(), reason: String(response.status()) });
    });
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("crash", () => { crashed = true; });
    const timeout = timeoutSeconds * 1000;
    // Before the page opens: it hands the file over by itself once it exists.
    const download = page.waitForEvent("download", { timeout });
    download.catch(() => {});
    const started = Date.now();
    const answer = await step("unreachable", EXIT.unreachable, "open the link", () => page.goto(link.href, { waitUntil: "load", timeout: 120_000 }));
    if (answer === null || !answer.ok()) {
      throw new ExportFailure("unreachable", EXIT.unreachable, `The link's server answered ${answer?.status() ?? "nothing"} for the export page. Check the link, or ask for a new one.`, { fallback });
    }
    // A redirect the server answered is followed without the route seeing it: the page must still be the link's.
    if (new URL(page.url()).origin !== link.origin) {
      throw new ExportFailure("insecure_link", EXIT.insecureLink, `The link led to ${new URL(page.url()).origin}, not to its own server ${link.origin}. Pass the url createExportLink answered.`);
    }
    // The page says it is the export page at once; anything else is not one.
    await step("unreachable", EXIT.unreachable, "find the export page at the link",
      () => page.waitForFunction(() => window.__motionadeExport !== undefined, null, { timeout: 60_000 }));
    let state;
    let reported = "";
    let reportedAt = 0;
    while (Date.now() - started < timeout) {
      state = await step("browser_crashed", EXIT.browserCrashed, "follow the render", () => page.evaluate(() => window.__motionadeExport ?? null));
      if (state?.status === "done" || state?.status === "failed") break;
      const counting = state?.status === "rendering" && state.totalFrames > 0;
      const line = counting ? `rendering frame ${state.frame} of ${state.totalFrames}` : state?.status ?? "opening";
      // A new stage at once; the frame count every few seconds.
      if (line !== reported && (!counting || Date.now() - reportedAt >= 5000)) {
        log(line);
        reported = line;
        reportedAt = Date.now();
      }
      await step("browser_crashed", EXIT.browserCrashed, "follow the render", () => page.waitForTimeout(500));
    }
    if (state?.status === "failed") {
      throw new ExportFailure(state.error.code, exitForPageError(state.error.code), state.error.message, { detail: state.error.detail, browserErrors: errors });
    }
    if (state?.status !== "done") {
      throw new ExportFailure("timed_out", EXIT.timedOut, `The export did not finish within ${timeoutSeconds} s. Pass a longer --timeout, or export one Scene at a time.`, { lastState: state, fallback });
    }
    // Saved beside the target, then put into place without replacing anything: a file
    // that appeared there meanwhile is left alone, and the film is kept beside it.
    const partial = path.join(path.dirname(out), `.${path.basename(out)}.${randomUUID()}.partial`);
    try {
      await step("download_failed", EXIT.downloadFailed, "save the film", async () => {
        const file = await download;
        await file.saveAs(partial);
        const failure = await file.failure();
        if (failure) throw new Error(failure);
      });
      try {
        await placeFile(partial, out);
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        const { name, ext } = path.parse(out);
        const kept = path.join(path.dirname(out), `${name}.${randomUUID().slice(0, 8)}${ext}`);
        await placeFile(partial, kept);
        throw new ExportFailure("output_appeared", EXIT.outputAppeared, `${out} appeared while the film exported, so it was left alone. The film is saved at ${kept}.`, { savedAt: kept });
      }
    } finally {
      await rm(partial, { force: true });
    }
    const exportSeconds = (Date.now() - started) / 1000;
    let playback = null;
    if (play) {
      log(`playing the file at normal speed (${state.result.video.seconds} s)`);
      // A context of its own: the export page's routing allows only the link's server.
      playback = await playInBrowser(await launched.newContext(), await readFile(out), (state.result.video.seconds + 60) * 1000);
    }
    return { result: state.result, browser: { name, version: launched.version() }, errors, exportSeconds, playback, requests: { origin: link.origin, blocked, failed } };
  } finally {
    await launched.close();
  }
}

/**
 * Puts a finished file at `to`, never over one that exists there (EEXIST). A
 * hard link where the volume has them; a copy that refuses an existing file
 * where it does not (exFAT and FAT answer EPERM or ENOTSUP).
 */
export async function placeFile(from, to, link = hardLink) {
  try {
    await link(from, to);
  } catch (error) {
    if (!["EPERM", "ENOTSUP", "EOPNOTSUPP", "ENOSYS"].includes(error.code)) throw error;
    await copyFile(from, to, constants.COPYFILE_EXCL);
  }
}

/** Runs a tool; null when it is not installed. */
function run(command, args, { onStdout } = {}) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      reject(error);
      return;
    }
    const stdout = [];
    let stderr = "";
    child.stdout.on("data", (chunk) => (onStdout ? onStdout(chunk) : stdout.push(chunk)));
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => (error.code === "ENOENT" ? resolve(null) : reject(error)));
    child.on("close", (code) => resolve({ code, stdout: Buffer.concat(stdout).toString("utf8"), stderr }));
  });
}

/**
 * One pass over interleaved float32 PCM, as the export page measures the mix
 * (`audio-meter.ts`). With `envelopeMs`, it also keeps the RMS of each
 * millisecond in `[from, to)`, over all channels, as the page does.
 *
 * @param {number} channels
 * @param {number} sampleRate
 * @param {{ from: number; to: number } | null} [envelopeMs]
 */
export function createPcmMeter(channels, sampleRate, envelopeMs = null) {
  let frames = 0;
  let squares = 0;
  let peak = 0;
  let first = null;
  let last = null;
  let carry = Buffer.alloc(0);
  const windowSize = Math.round(sampleRate / 1000);
  const envelope = [];
  let windowSquares = 0;
  let windowFilled = 0;
  let windowIndex = 0;
  const decibels = (amplitude) => (amplitude > 0 ? 20 * Math.log10(amplitude) : null);
  return {
    add(bytes) {
      const joined = carry.length > 0 ? Buffer.concat([carry, bytes]) : bytes;
      const whole = joined.length - (joined.length % (4 * channels));
      for (let offset = 0; offset < whole; offset += 4 * channels) {
        let loudest = 0;
        let frameSquares = 0;
        for (let channel = 0; channel < channels; channel++) {
          const value = joined.readFloatLE(offset + channel * 4);
          frameSquares += value * value;
          loudest = Math.max(loudest, Math.abs(value));
        }
        squares += frameSquares;
        peak = Math.max(peak, loudest);
        if (loudest > HEARD) {
          first ??= frames;
          last = frames;
        }
        frames += 1;
        windowSquares += frameSquares;
        if (++windowFilled === windowSize) {
          if (envelopeMs !== null && windowIndex >= envelopeMs.from && windowIndex < envelopeMs.to) {
            envelope.push(Math.sqrt(windowSquares / (windowSize * channels)));
          }
          windowIndex += 1;
          windowSquares = 0;
          windowFilled = 0;
        }
      }
      carry = Buffer.from(joined.subarray(whole));
    },
    result() {
      if (frames === 0) return null;
      return {
        sampleRate,
        seconds: frames / sampleRate,
        peakDb: decibels(peak),
        rmsDb: decibels(Math.sqrt(squares / (frames * channels))),
        firstSoundSeconds: first === null ? null : first / sampleRate,
        lastSoundSeconds: last === null ? null : (last + 1) / sampleRate,
        ...(envelopeMs === null ? {} : { envelope, envelopeStartMs: Math.max(0, envelopeMs.from) }),
      };
    },
  };
}

/** Silence the comparison starts with, before the mix's envelope, so a late file has somewhere to show. */
const ALIGN_LEAD_MS = 200;
/** The furthest the file's sound is looked for from the mix's, either way. */
const ALIGN_MAX_LAG_MS = 250;

/** The milliseconds of the file's envelope the alignment reads, for a mix envelope. */
export const fileEnvelopeRange = (mix) => ({
  from: mix.envelopeStartMs - ALIGN_LEAD_MS - ALIGN_MAX_LAG_MS,
  to: mix.envelopeStartMs + mix.envelope.length + ALIGN_MAX_LAG_MS,
});

/**
 * How many milliseconds the file's sound runs behind the mix's (negative:
 * ahead): the shift of the file's envelope that best matches the mix's, by
 * least squares, nothing before the file's start. A codec's priming silence
 * and its pre-echo move a threshold crossing by tens of milliseconds; they
 * barely move this. The smallest shift wins a tie.
 */
export function soundOffsetMs(mix, file) {
  const at = (envelope, start, ms) => (ms - start >= 0 && ms - start < envelope.length ? envelope[ms - start] : 0);
  let best = Infinity;
  let offset = 0;
  for (let step = 0; step <= 2 * ALIGN_MAX_LAG_MS; step++) {
    const lag = step % 2 === 0 ? step / 2 : -(step + 1) / 2;
    let difference = 0;
    for (let ms = mix.envelopeStartMs - ALIGN_LEAD_MS; ms < mix.envelopeStartMs + mix.envelope.length; ms++) {
      const heard = ms < 0 ? 0 : at(mix.envelope, mix.envelopeStartMs, ms);
      const played = ms + lag < 0 ? 0 : at(file.envelope, file.envelopeStartMs, ms + lag);
      difference += (heard - played) ** 2;
    }
    if (difference < best) {
      best = difference;
      offset = lag;
    }
  }
  return offset;
}

/**
 * What ffprobe and ffmpeg say of the file; null where they are not installed.
 * `envelopeMs` is the range of the sound's envelope to keep (`fileEnvelopeRange`).
 *
 * @param {string} file
 * @param {number} sampleRate
 * @param {{ from: number; to: number } | null} [envelopeMs]
 */
export async function inspectFile(file, sampleRate, envelopeMs = null) {
  const probed = await run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,nb_frames,duration,start_time,sample_rate,channels", "-of", "json", file]);
  if (probed === null) return null;
  const streams = JSON.parse(probed.stdout || "{}").streams ?? [];
  const decoded = await run("ffmpeg", ["-nostdin", "-v", "error", "-xerror", "-err_detect", "explode", "-i", file, "-map", "0:v", "-map", "0:a?", "-f", "null", "-"]);
  let sound = null;
  if (streams.some((stream) => stream.codec_type === "audio")) {
    const meter = createPcmMeter(2, sampleRate, envelopeMs);
    // Decoded on the file's own clock from 0: a track placed late in the container comes
    // out with that much silence first, as a player presents it.
    await run("ffmpeg", ["-nostdin", "-v", "error", "-i", file, "-map", "0:a:0", "-af", "aresample=async=1:first_pts=0", "-f", "f32le", "-ac", "2", "-ar", String(sampleRate), "pipe:1"], { onStdout: (chunk) => meter.add(chunk) });
    sound = meter.result();
  }
  return {
    video: streams.find((stream) => stream.codec_type === "video") ?? null,
    audio: streams.find((stream) => stream.codec_type === "audio") ?? null,
    decode: decoded === null ? null : { ok: decoded.code === 0 && decoded.stderr.trim() === "", stderr: decoded.stderr.trim().slice(0, 2000) },
    sound,
  };
}

const check = (passed, detail) => ({ passed, detail });
/**
 * Whether the film needs a request: one of the kinds it loads from any server
 * (image, media, font, fetch, stylesheet: what `allowedRequest` lets through),
 * or anything from the export page's own server, its code included. A URL that
 * cannot be read counts as needed.
 *
 * @param {{ url: string; type: string }} request
 * @param {string | undefined} origin
 */
const filmNeeds = ({ url, type }, origin) => {
  if (MEDIA_TYPES.has(type)) return true;
  try {
    return new URL(url).origin === origin;
  } catch {
    return true;
  }
};

const round = (value, places = 3) => (value === null || value === undefined ? value : Math.round(value * 10 ** places) / 10 ** places);

/**
 * The receipt's checks. Each one catches a problem a past export had: a file
 * that is not the one the page made, a project that changed while it was
 * opened (a text refit on open), a soundtrack shorter than the picture, sound
 * that starts late (44 ms once), loudness raised by a default (12 dB once).
 * Without ffmpeg the file checks are skipped, each named.
 *
 * A request the film needs (`filmNeeds`) that was blocked or failed fails
 * `everythingLoaded`. Any other, such as a script a deploy injects from
 * another server, is not the film's: it is named in `warnings`.
 *
 * @param {{ page: any; file: { bytes: number; sha256: string }; revisionAfter: number | null; revisionError?: string | null; playback?: any; inspected: any; requests?: { origin?: string; blocked: Array<{ url: string; type: string }>; failed: Array<{ url: string; type: string; reason: string }> } }} input
 */
export function receiptChecks({ page, file, revisionAfter, revisionError = null, playback = null, inspected, requests = { blocked: [], failed: [] } }) {
  const checks = {};
  const warnings = [];
  const skipped = [];
  const fps = page.video.fps;
  checks.fileIntact = check(file.bytes === page.file.bytes && file.sha256 === page.file.sha256,
    { saved: { bytes: file.bytes, sha256: file.sha256 }, made: { bytes: page.file.bytes, sha256: page.file.sha256 } });
  // A medium the page could not load exports as nothing, and the film looks finished: never a pass.
  const needs = (request) => filmNeeds(request, requests.origin);
  const blocked = requests.blocked.filter(needs).map(({ url }) => url);
  const failed = requests.failed.filter(needs).map(({ url, reason }) => `${url} (${reason})`);
  checks.everythingLoaded = check(blocked.length === 0 && failed.length === 0, { blocked, failed });
  for (const request of requests.blocked) {
    if (!needs(request)) warnings.push(`Blocked a request the film does not use (${request.type}): ${request.url}`);
  }
  for (const request of requests.failed) {
    if (!needs(request)) warnings.push(`A request the film does not use failed (${request.type}): ${request.url} (${request.reason})`);
  }
  // Plugin spec §9: a report, never a failed check. A server that keeps no notes, or one from
  // before the review, lists none.
  const unreviewed = page.review?.unreviewed ?? [];
  if (unreviewed.length > 0) {
    const named = unreviewed.map(({ sceneId, name, status, changedSinceReview }) =>
      `${name || sceneId} (${changedSinceReview ? "changed since review" : status ?? "no status"})`);
    warnings.push(`${unreviewed.length} Scene${unreviewed.length === 1 ? " is" : "s are"} not marked reviewed: ${named.join(", ")}.`);
  }
  checks.sourceUnchanged = check(revisionAfter === page.project.revision, {
    linkRevision: page.project.revision,
    revisionAfter,
    ...(revisionError === null ? {} : {
      unread: revisionError === "link_expired"
        ? "The link expired before the revision could be read again: the export outlasted it. Ask for a new link to check, or export one Scene at a time."
        : `The revision could not be read again (${revisionError}).`,
    }),
    note: "The export page has no writer, so opening the film cannot refit or save it; this checks that nothing else changed the project while it exported.",
  });
  const notRun = [];
  if (playback === null) notRun.push("browserPlayback: not asked for; pass --play to play the file to its end at normal speed.");
  else {
    checks.browserPlayback = check(
      playback.ended && playback.errors.length === 0 && playback.frames > 0 &&
        playback.lastMediaTime >= page.video.seconds - 2 / fps && playback.width === page.video.width && playback.height === page.video.height,
      { ...playback, lastMediaTime: round(playback.lastMediaTime), duration: round(playback.duration) },
    );
  }
  const mixed = page.audio !== null && page.audio.skipped !== true ? page.audio : null;
  if (page.audio?.skipped === true) {
    checks.soundEncoded = check(false, "This browser exported without sound: it has no AAC encoder. Google Chrome has one.");
  }
  if (mixed !== null && mixed.lastSoundSeconds !== null && page.video.seconds - mixed.lastSoundSeconds > SHORT_SOUND_SECONDS) {
    warnings.push(`The sound ends ${round(page.video.seconds - mixed.lastSoundSeconds, 2)} s before the picture.`);
  }
  if (mixed !== null && mixed.firstSoundSeconds === null) warnings.push("The film's sound is silent: nothing above -60 dBFS.");
  if (page.effectFallbacks.length > 0) warnings.push(...page.effectFallbacks.map((fallback) => `Exported as the painter's fallback: ${fallback}`));
  if (inspected === null) {
    skipped.push("picture, fullDecode, soundEncoded, audioCoversPicture, audioInSync, loudnessKept: ffmpeg and ffprobe are not installed. Install ffmpeg to check the file itself.");
    return { checks, warnings, skipped, notRun };
  }
  const { video, audio, decode, sound } = inspected;
  const frames = Number(video?.nb_frames);
  const seconds = Number(video?.duration);
  checks.picture = check(
    video?.codec_name === "h264" && video.width === page.video.width && video.height === page.video.height &&
      frames === page.video.frames && Math.abs(seconds - page.video.frames / fps) <= 1 / fps,
    { codec: video?.codec_name, width: video?.width, height: video?.height, frames, seconds, expected: { width: page.video.width, height: page.video.height, frames: page.video.frames, seconds: round(page.video.frames / fps) } },
  );
  if (decode === null) skipped.push("fullDecode: ffmpeg is not installed.");
  else checks.fullDecode = check(decode.ok, decode.ok ? "Every frame and sample decodes." : decode.stderr);
  if (mixed === null) {
    if (page.audio === null && audio !== null) warnings.push("The film has no sound, but the file has a sound track.");
    return { checks, warnings, skipped, notRun };
  }
  if (audio === null) {
    checks.soundEncoded = check(false, "The film's sound was mixed, but the file has no sound track.");
    return { checks, warnings, skipped, notRun };
  }
  const audioSeconds = Number(audio.duration);
  checks.audioCoversPicture = check(audioSeconds >= seconds - 1 / fps,
    { audioSeconds: round(audioSeconds), pictureSeconds: round(seconds), audioStart: Number(audio.start_time), videoStart: Number(video?.start_time) });
  if (sound === null) {
    skipped.push("audioInSync, loudnessKept: ffmpeg could not decode the sound.");
    return { checks, warnings, skipped, notRun };
  }
  // Sound runs late two ways: silence inside the track (encoder priming left in), and a
  // track placed later than the picture in the container. The file is decoded on its own
  // clock from 0 (`inspectFile`), so both show, and its envelope is aligned against the
  // mix's (`soundOffsetMs`). A first crossing of -60 dBFS is not: AAC pre-echo and priming
  // moved it to 28 ms for a track placed 44 ms late. Nor are the streams' start times:
  // they read 22.7 ms for it. Both are reported beside the offset. A server whose page
  // sends no envelope falls back to the first crossing.
  const aligned = mixed.envelope?.length > 0 && sound.envelope !== undefined;
  const offsetSeconds = aligned
    ? soundOffsetMs(mixed, sound) / 1000
    : sound.firstSoundSeconds !== null && mixed.firstSoundSeconds !== null ? sound.firstSoundSeconds - mixed.firstSoundSeconds : null;
  checks.audioInSync = check(
    (sound.firstSoundSeconds === null) === (mixed.firstSoundSeconds === null) && (offsetSeconds === null || Math.abs(offsetSeconds) <= SYNC_TOLERANCE_SECONDS),
    {
      offsetMs: offsetSeconds === null ? null : round(offsetSeconds * 1000, 1), toleranceMs: SYNC_TOLERANCE_SECONDS * 1000,
      measuredBy: aligned ? "envelope alignment" : "first sound above -60 dBFS",
      mixFirstSound: round(mixed.firstSoundSeconds, 4), fileFirstSound: round(sound.firstSoundSeconds, 4),
      audioStart: Number(audio.start_time), videoStart: Number(video?.start_time),
    },
  );
  const change = sound.rmsDb !== null && mixed.rmsDb !== null ? sound.rmsDb - mixed.rmsDb : null;
  checks.loudnessKept = check(
    (sound.rmsDb === null) === (mixed.rmsDb === null) && (change === null || Math.abs(change) <= LOUDNESS_TOLERANCE_DB),
    { normalizeLoudness: mixed.normalizeLoudness, mixRmsDb: round(mixed.rmsDb, 2), fileRmsDb: round(sound.rmsDb, 2), changeDb: round(change, 2), filePeakDb: round(sound.peakDb, 2), toleranceDb: LOUDNESS_TOLERANCE_DB },
  );
  return { checks, warnings, skipped, notRun };
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** `ok` when every check that ran passed; a pass that could not run every file check says so in `status`. */
export function receiptVerdict({ checks, skipped }) {
  const ok = Object.values(checks).every((entry) => entry.passed);
  return { ok, status: !ok ? "failed" : skipped.length > 0 ? "passed with skipped checks" : "passed" };
}

/** The exit code of a finished run: 0 for any pass, 9 when a check failed. */
export const receiptExit = (receipt) => (receipt.ok ? EXIT.done : EXIT.checksFailed);

/**
 * The whole export: render through the page, save the file, read the
 * project's revision again, inspect the file, and answer the receipt. Throws
 * `ExportFailure` for a failure before a file exists.
 */
export async function exportFilm({ link: given, out, browser, headed = false, play = false, timeoutSeconds = 1800, log = () => {} }) {
  const link = parseExportLink(given);
  if (!link.ok && link.reason === "insecure_link") {
    throw new ExportFailure("insecure_link", EXIT.insecureLink, `An export link is https, or http to this machine; pass the url createExportLink answered. Refused: ${given}`);
  }
  if (!link.ok) throw new ExportFailure("usage", EXIT.usage, `Pass the url createExportLink answered. Not an export link: ${given}`);
  const target = path.resolve(out);
  if (existsSync(target)) throw new ExportFailure("usage", EXIT.usage, `${target} exists. Choose a new file; this never overwrites one.`);
  const channel = await resolveBrowser(browser);
  const fallback = `Or open the link in Chrome or Edge on this machine; the page renders the film there and downloads the MP4: ${link.href}`;
  const { chromium } = loadDriver(fallback);
  const rendered = await renderThroughPage(chromium, { link, out: target, browser: channel, headed, timeoutSeconds, play, log });
  const page = rendered.result;
  const bytes = await readFile(target);
  log("checking the file");
  const revision = await fetch(`${link.origin}/api/export/${link.ticket}/revision`, { cache: "no-store" })
    .then((answer) => answer.json()).catch((error) => ({ ok: false, error: error.message }));
  const mixEnvelope = page.audio?.envelope?.length > 0 ? fileEnvelopeRange(page.audio) : null;
  const inspected = await inspectFile(target, page.audio?.sampleRate ?? 48000, mixEnvelope);
  const file = { path: target, bytes: bytes.length, sha256: sha256(bytes) };
  const { checks, warnings, skipped, notRun } = receiptChecks({
    page, file, inspected, playback: rendered.playback, requests: rendered.requests,
    revisionAfter: revision?.ok ? revision.revision : null,
    revisionError: revision?.ok ? null : revision?.error ?? "no answer",
  });
  if (rendered.errors.length > 0) warnings.push(...rendered.errors.map((error) => `Browser console: ${error}`));
  return {
    ...receiptVerdict({ checks, skipped }),
    file,
    project: page.project,
    scope: page.scope,
    window: page.window,
    quality: page.quality,
    video: { width: page.video.width, height: page.video.height, fps: page.video.fps, frames: page.video.frames, seconds: page.video.seconds },
    audio: page.audio === null
      ? { present: false }
      : page.audio.skipped === true
        ? { present: false, skipped: "this browser has no AAC encoder" }
        : {
          present: true,
          seconds: inspected?.audio ? Number(inspected.audio.duration) : page.audio.seconds,
          normalizeLoudness: page.audio.normalizeLoudness,
          firstSoundSeconds: round(page.audio.firstSoundSeconds, 4),
          lastSoundSeconds: round(page.audio.lastSoundSeconds, 4),
          rmsDb: round(page.audio.rmsDb, 2),
          peakDb: round(page.audio.peakDb, 2),
        },
    // `{notesKept: true, unreviewed}`, or `{notesKept: false}`; absent from a server before the review.
    ...(page.review === undefined ? {} : { review: page.review }),
    checks,
    warnings,
    skipped,
    notRun,
    browser: rendered.browser,
    exportSeconds: round(rendered.exportSeconds, 1),
    linkExpiresAt: page.expiresAt,
  };
}
