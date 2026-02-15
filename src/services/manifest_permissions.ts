
export async function requestAllSitesAccess(): Promise<boolean> {
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


