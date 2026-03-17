export async function getHost() {
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    
    if (!tabs || tabs.length === 0 || !tabs[0].url) {
      return "global"; // Fallback for empty tabs
    }

    const url = new URL(tabs[0].url);
    return url.hostname || "global";
  } catch (error) {
    return "global";
  }
}