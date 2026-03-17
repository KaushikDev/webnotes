export async function getAll() {
  const data = await chrome.storage.sync.get("webnotes");
  return data.webnotes || {};
}

export async function saveAll(data) {
  await chrome.storage.sync.set({
    webnotes: data,
  });
}
