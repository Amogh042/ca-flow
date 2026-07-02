export async function checkForUpdates() {
  const isTauri = typeof window !== "undefined" && 
    (window as any).__TAURI_INTERNALS__ !== undefined;
  
  if (!isTauri) {
    console.log("Not running in Tauri, skipping update check");
    return;
  }

  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");

    alert("Checking for updates...");

    const update = await check();

    alert("Update check result: " + JSON.stringify(update));

    if (update) {
      const shouldUpdate = window.confirm(
        `A new version of CA-flow (${update.version}) is available. Update now?`
      );

      if (shouldUpdate) {
        alert("Downloading update...");
        await update.downloadAndInstall();
        alert("Update installed, relaunching...");
        await relaunch();
      }
    } else {
      alert("No update available - already on latest version");
    }
  } catch (err) {
    alert("Update check FAILED with error: " + String(err));
    console.error("Update check failed:", err);
  }
}
