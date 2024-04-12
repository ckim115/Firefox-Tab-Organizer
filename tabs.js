// Returns all the tabs in the current window
function getCurrentWindowTabs() {
    console.log("Getting current window tabs");
    return browser.tabs.query({ currentWindow: true });
}

// Creates a list on the extension display that lists all the current window's tabs as links
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

// Creates a warning on the extension display when over a certain number of tabs are created.
function warnUser() {
    const limitval = document.getElementById("num-tabs").value;
    const warning = document.getElementById("for-notif");
    getCurrentWindowTabs().then((tabs) => {
        if(tabs.length >= limitval) {
            warning.style.display = "block";
            warning.textContent = "You currently have " + limitval + " or more tabs!";
        } else {
            ignoreWarning();
        }
    });
}

// Removes the warning for the number of tabs created when clicked on
function ignoreWarning() {
    const warning = document.getElementById("for-notif");
    warning.style.display = "None";
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
    browser.runtime.reload();
}

// Finds and removes tabs with duplicate urls
function removeDuplicates() { //loop through the tabs; if there is duplicate(s), remove duplicates
    console.log("Removing duplicates...")
    var numDel = 0;
    getCurrentWindowTabs().then((tabs) => {
        for (var i = 0; i < tabs.length-1; i++) {
            console.log(tabs[i].url);

            for(var j = i+1; j < tabs.length; j++) {
                if(tabs[i].url === tabs[j].url) {
                    browser.tabs.remove(tabs[j].id);
                    console.log("Tab removed");
                    numDel++;
                }
            }
        }
    });

    if(numDel > 0) browser.runtime.reload();
}

// Removes all tabs that have not been accessed for a certain number of weeks or more
// The number of weeks is determined by milliseconds since the epoch
function removeOld() { //loop through tabs; if a tab has been last acessed >= week ago, remove
    console.log("Removing old...")
    const weeks = document.getElementById("num-weeks").value
    var numDel = 0;
    getCurrentWindowTabs().then((tabs) => {
        for (const tab of tabs) {
            if(Date.now() - tab.lastAccessed >= 604800000*weeks) { //in milliseconds since the epoch
                browser.tabs.remove(tab.id);
                numDel++;
            }
        }
    });

    if(numDel > 0) browser.runtime.reload();
}

// From the extension display list of tabs, bookmarks and removes the chosen tab
function bookmarkAndRemove(tab) {
    getCurrentWindowTabs().then((tabs) => {
        for (const t of tabs) {
            if(t.id == tab.id) { //find the tab with the same id and bookmark/remove it
                browser.bookmarks.create({ title: t.title, url: t.url });
                browser.tabs.remove(t.id);
                tab.remove();
                browser.runtime.reload();
            }
        }
    });
}

// // Gets the saved local storage information for number of weeks before a tab is considered 'old' and
// // the reccomended number of tabs to initialize the extension when opening it
function updateInputs() {
    const weeks = browser.storage.local.get("min-weeks");
    weeks.then((result) => {
        //should be only one
        const results = Object.values(result);
        for(const r of results) {
            const rInt = parseInt(r);
            if(rInt !== "NaN") {
                document.getElementById("num-weeks").value = parseInt(r);
            }
        }
    });
    const tabs = browser.storage.local.get("max-tabs");
    tabs.then((result) => {
        const results = Object.values(result);
        for(const r of results) {
            const rInt = parseInt(r);
            if(rInt !== "NaN") {
                document.getElementById("num-tabs").value = parseInt(r);
            }
        }
    });
}

// Runs when extension loads
document.addEventListener("DOMContentLoaded", listTabs);
document.addEventListener("DOMContentLoaded", updateInputs);
document.addEventListener("DOMContentLoaded", warnUser);


document.addEventListener("click", (e) => {
    if (e.target.id === "organize-time-oldest") {
        organizeByTime(true);
        console.log("Organizing by time (oldest)...")
    } else if (e.target.id === "organize-time-newest") {
        organizeByTime(false);
        console.log("Organizing by time (newest)...")
    } else if (e.target.id === "remove-duplicates") {
        console.log("Removing duplicates...")
        removeDuplicates();
    } else if (e.target.id === "remove-old") {
        console.log("Removing old tabs...")
        removeOld(); //get input from num-weeks and pass in
    }else if (e.target.id === "for-notif") {
        console.log("Ignoring...");
        //something here to make it dissappear
        ignoreWarning();
    } else if (e.target.id === "num-weeks") {
        //saves in local storage the number of weeks
        browser.storage.local.set({ ["min-weeks"] : document.getElementById("num-weeks").value });
    } else if (e.target.id === "num-tabs") {
        //saves in local storage the number of tabs
        browser.storage.local.set({ ["max-tabs"] : document.getElementById("num-tabs").value });
        warnUser();
    } else {
        console.log("Removing and bookmarking...");
        bookmarkAndRemove(e.target);
    } 
});
