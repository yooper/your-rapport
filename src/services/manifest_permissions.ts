
export async function requestAllSitesAccess(): Promise<void> {
  return chrome.permissions.request({
    origins: ["<all_urls>"]
  });
}


export async function allSitesAccessApproved(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.contains({ origins: ["<all_urls>"] }, (result) => {
      resolve(!!result);
    });
  });
}


document.getElementById("enableAllSites")?.addEventListener("click", async () => {
  const granted = await requestAllSitesAccess();
  console.log("All-sites access granted?", granted);
});
