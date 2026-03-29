export async function getHost() {
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    
    if (!tabs || tabs.length === 0 || !tabs[0].url) {
      return "global"; 
    }

    const url = new URL(tabs[0].url);
    let host = url.hostname;

    if (host.startsWith("www.")) {
      host = host.replace("www.", "");
    }

    const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
    if (pathSegments.length > 0) {
      host = `${host}/${pathSegments[0]}`;
    }

    return host || "global";
  } catch (error) {
    return "global";
  }
}