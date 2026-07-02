let hasChecked = false;

export async function checkForUpdates() {
  if (hasChecked) return;
  hasChecked = true;

  const isTauri = typeof window !== "undefined" &&
    (window as any).__TAURI_INTERNALS__ !== undefined;

  if (!isTauri) return;

  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");

    const update = await check();

    if (update) {
      const shouldUpdate = window.confirm(
        `A new version of CA-flow (${update.version}) is available. Update now?`
      );

      if (shouldUpdate) {
        await update.downloadAndInstall();
        await relaunch();
      }
    }
  } catch (err) {
    console.error("Update check failed:", err);
  }
}
