import { spawnSync } from "node:child_process";
import { setInterval } from "node:timers";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const syncIntervalMs = 180_000;
let syncing = false;

function git(args) {
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed.`);
  }

  return result.stdout.trim();
}

async function syncFromOrigin() {
  if (syncing) return;
  syncing = true;

  try {
    const branch = git(["branch", "--show-current"]);
    if (!branch) {
      console.warn("[github-sync] Detached HEAD; automatic updates are paused.");
      return;
    }

    let upstream;
    try {
      upstream = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
    } catch (error) {
      console.warn(`[github-sync] No upstream is configured for ${branch}; updates are paused.`, error);
      return;
    }

    git(["fetch", "--quiet"]);

    const changedRemoteFiles = new Set(
      git(["diff", "--name-only", "-z", `HEAD..${upstream}`]).split("\0").filter(Boolean),
    );
    const changedLocalFiles = new Set([
      ...git(["diff", "--name-only", "-z", "HEAD"]).split("\0"),
      ...git(["ls-files", "--others", "--exclude-standard", "-z"]).split("\0"),
    ].filter(Boolean));
    const overlappingFiles = [...changedRemoteFiles].filter((file) => changedLocalFiles.has(file));
    if (overlappingFiles.length > 0) {
      console.info(`[github-sync] Updates to ${overlappingFiles.join(", ")} are waiting because those files have local changes.`);
      return;
    }

    const [ahead, behind] = git(["rev-list", "--left-right", "--count", `HEAD...${upstream}`])
      .split(/\s+/)
      .map(Number);

    if (ahead > 0 && behind > 0) {
      console.warn(`[github-sync] ${branch} and ${upstream} have diverged; resolve the branch manually.`);
      return;
    }

    if (behind > 0) {
      git(["merge", "--ff-only", upstream]);
      console.info(`[github-sync] Fast-forwarded ${branch} by ${behind} commit${behind === 1 ? "" : "s"}.`);
    }
  } catch (error) {
    console.error("[github-sync] Could not check or apply GitHub updates; will retry at the next interval.", error);
  } finally {
    syncing = false;
  }
}

if (process.argv.includes("--once")) {
  await syncFromOrigin();
} else {
  void syncFromOrigin();
  setInterval(syncFromOrigin, syncIntervalMs);
}
