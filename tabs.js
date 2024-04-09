function getCurrentWindowTabs() {
    console.log("Getting current window tabs");
    return browser.tabs.query({ currentWindow: true });
}

function listTabs() {
    getCurrentWindowTabs().then((tabs) => {
        const tabsList = document.getElementById('tabs-list');
        const currentTabs = document.createDocumentFragment();
        let counter = 0;
        tabsList.textContent = '';
        for (const tab of tabs) {
            const tabLink = document.createElement("a"); 
                
            tabLink.textContent = tab.title
          
            tabLink.setAttribute("href", "#"); 
            tabLink.setAttribute("id", tab.id); 
            tabLink.classList.add("bookmark-remove-chosen");
            currentTabs.appendChild(tabLink);
            currentTabs.appendChild(document.createElement("br"));
            counter += 1;
        }
        tabsList.appendChild(currentTabs); // adds tabsList to tabs-list
    });
}

//not working
function makeAlert() { //notify user when over 14 tabs are present
    const numTabs = document.getElementById("num-weeks").value;
    console.log(getCurrentWindowTabs().length);
    if(getCurrentWindowTabs().length >= numTabs) {
        const notification = new Notification("You have a lot of tabs open!", {
            body: "You currently have "+ numTabs +" or more tabs. Try decreasing the amount!",
            icon: "icons/alert-icon-1562.png"
        });
        document.addEventListener("visibilitychange", () => { //when notification becomes visible, remove
            if (document.visibilityState === "visible") {
              notification.close();
            }
        });
    }
}

//bro fix the sort lmao
function organizeByTime(oldestFirst) {
    console.log("Organizing...")
    getCurrentWindowTabs().then((tabs) => {
        for (var i = 0; i < tabs.length-1; i++) { //make more efficient later
            var curTab = tabs[i];
            for(var j = i+1; j < tabs.length; j++) {
                if((!oldestFirst && curTab.lastAccessed > tabs[i+1].lastAccessed) || (oldestFirst && curTab.lastAccessed < tabs[i+1].lastAccessed)) {
                    curTab = tabs[j];
                }
            }
            browser.tabs.move([curTab.id], { index: i });
        }
    });
}

//works; finished
function removeDuplicates() { //loop through the tabs; if there is duplicate(s), remove duplicates
    console.log("Removing duplicates...")
    getCurrentWindowTabs().then((tabs) => {
        for (var i = 0; i < tabs.length-1; i++) {
            console.log(tabs[i].url);
            for(var j = i+1; j < tabs.length; j++) {
                if(tabs[i].url === tabs[j].url) {
                    browser.tabs.remove(tabs[j].id);
                    console.log("Tab removed");
                }
            }
        }
    });
}

// Need to check
function removeOld(n) { //loop through tabs; if a tab has been last acessed >= week ago, remove
    console.log("Removing old...")
    getCurrentWindowTabs().then((tabs) => {
        for (const tab of tabs) {
            if(tab.lastAccessed >= 604800000*n) { //in milliseconds/week
                browser.tabs.remove(tab.id);
            }
        }
    });
}

//works; finished
function bookmarkAndRemove(tab) {
    getCurrentWindowTabs().then((tabs) => {
        for (const t of tabs) {
            if(t.id == tab.id) { //find the tab with the same id and bookmark/remove it
                browser.bookmarks.create({ title: t.title, url: t.url });
                browser.tabs.remove(t.id);
            }
        }
        tab.remove();
    });
}

document.addEventListener("DOMContentLoaded", listTabs);
document.addEventListener("DOMContentLoaded", makeAlert);

//TODO: refresh function in order to save #weeks
//TODO: prevent negative weeks/tabs
document.addEventListener("click", (e) => {
    if (e.target.id === "organize-time-oldest") {
        organizeByTime(true);
        browser.runtime.reload();
    } else if (e.target.id === "organize-time-newest") {
        organizeByTime(false);
        browser.runtime.reload();
    } else if (e.target.id === "remove-duplicates") {
        removeDuplicates();
        browser.runtime.reload();
    } else if (e.target.id === "remove-old") {
        removeOld(document.getElementById("num-weeks").value); //get input from num-weeks and pass in
        browser.runtime.reload();
    } else if (e.target.id === "bookmark-remove-chosen") {
        bookmarkAndRemove(e.target);
        browser.runtime.reload();
    }
});
  
