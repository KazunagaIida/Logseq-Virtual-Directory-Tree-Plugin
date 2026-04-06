/**
 * Copy text to clipboard with fallback for sandboxed iframes.
 *
 * In Logseq's release build the plugin runs inside a sandboxed iframe where
 * `navigator.clipboard.writeText()` is blocked.  The legacy
 * `document.execCommand('copy')` still works as long as the call originates
 * from a user gesture (click handler).
 */
export function copyToClipboard(text: string): boolean {
  // Always run the synchronous execCommand path first while the user gesture
  // is still active — this is the only reliable method inside Logseq's
  // sandboxed iframe.  The modern Clipboard API is attempted afterwards as a
  // best-effort upgrade (it overwrites the clipboard with the same text).
  const ok = execCommandCopy(text);

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return ok;
}

function execCommandCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Keep it off-screen so it doesn't cause a visual flash.
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    // execCommand may throw in very restrictive environments.
  }
  document.body.removeChild(textarea);
  return success;
}
