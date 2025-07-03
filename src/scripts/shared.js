const neuboturl = 'https://neubot.joshatticus.site';
const homeurl = 'https://eris.pages.dev/supernova';
// const homeurl = 'http://127.0.0.1:5500';
const url = 'https://api.novasearch.xyz';

const formatUrl = url => url.endsWith('/') ? url.slice(0, -1) : url;

const storage = (() => {
    let storageData = {};
    let storageName = 'supernova-data';

    try {
        storageData = JSON.parse(localStorage.getItem(storageName) || '{}');
    } catch (e) {
        console.error(e);
    }

    return {
        get(key) {
            return storageData[key];
        },

        set(key, value) {
            storageData[key] = value;
            localStorage.setItem(storageName, JSON.stringify(storageData));
        },

        delete(key) {
            delete storageData[key];
            localStorage.setItem(storageName, JSON.stringify(storageData));
        },

        all() {
            return storageData;
        },

        clear() {
            storageData = {};
            localStorage.setItem(storageName, JSON.stringify(storageData));
        },

        settings: {
            get(key) {
                return storageData && storageData.settings && storageData.settings[key];
            },

            set(key, value) {
                if (!storageData.settings) {
                    storageData.settings = {};
                }
                storageData.settings[key] = value;
                localStorage.setItem(storageName, JSON.stringify(storageData));
            },

            delete(key) {
                if (storageData.settings) {
                    delete storageData.settings[key];
                    localStorage.setItem(storageName, JSON.stringify(storageData));
                }
            },

            all() {
                return storageData.settings || {};
            },

            clear() {
                if (storageData.settings) {
                    storageData.settings = {};
                    localStorage.setItem(storageName, JSON.stringify(storageData));
                }
            }
        },
    };
})();

const settings = storage.settings;

setTheme();

String.prototype.sanitize = function () {
    return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/`/g, '&#96;').replace(/'/g, '&#39;');
};

String.prototype.code = function () {
    return `<div class="json-block">${this.sanitize()}</div>`;
};

const device = {
    is: {
        iPhone: /iPhone/.test(navigator.userAgent),
        iPad: /iPad/.test(navigator.userAgent),
        iOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
        android: /Android/.test(navigator.userAgent),
        mobile: /Mobi|Android/i.test(navigator.userAgent) // matches most mobile browsers
    },
    prefers: {
        language: navigator.language || navigator.userLanguage,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        reducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches
    },
    supports: {
        share: typeof navigator.share === 'function',
        directDownload: 'download' in document.createElement('a')
    },
    userAgent: navigator.userAgent
};

function toggleSetting(id) {
    const element = document.getElementById(id);
    if (settings.get(id) === true) {
        element.classList.remove('checked');
        settings.set(id, false);
    } else {
        element.classList.add('checked');
        settings.set(id, true);
    }

    haptic();
}

function accordion(element) {
    if (element.parentNode.classList.contains('open')) {
        element.parentNode.style.maxHeight = element.scrollHeight + "px";
        element.parentNode.classList.remove('open');
    } else {
        element.parentNode.style.maxHeight = element.scrollHeight + element.parentNode.querySelector('.accordion-content').scrollHeight + "px";
        element.parentNode.classList.add('open');
    }
}

function toggleRadio(group, id) {
    const items = document.querySelectorAll(`.radio-group[data-group="${group}"] .menu-button`);
    items.forEach(item => {
        item.classList.remove('selected');
    });

    const selectedItem = document.getElementById(id);
    selectedItem.classList.add('selected');

    settings.set(group, id);

    haptic();
}

function pageElements() {
    const options = document.querySelectorAll('.menu-button');
    options.forEach(option => {
        if (settings.get(option.id)) {
            option.classList.add('checked');
        }
    });

    const radioGroups = document.querySelectorAll('.radio-group');
    radioGroups.forEach(group => {
        const groupName = group.dataset.group;
        const selectedId = settings.get(groupName);
        if (selectedId) {
            group.querySelectorAll('.menu-button').forEach(option => {
                if (option.id === selectedId) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        }
    });

    // abr
    document.getElementById('dark-mode').innerText = `${settings.get('darkMode') ? 'On' : 'Off'}`;

    setTheme();

    document.querySelectorAll('.accordion').forEach(element => element.style.maxHeight = element.querySelector('.accordion-title').scrollHeight + "px");
}

function timeAgo(tstamp) {
    const currentTime = Date.now();
    const lastSeenTime = tstamp * 1000;
    const timeDifference = currentTime - lastSeenTime;
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    }
}

function formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${size} ${sizes[i]}`;
}

String.prototype.sanitize = function () {
    return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/`/g, '&#96;').replace(/'/g, '&#39;');
};


function openSettings() {
    openModal({
        title: 'Settings', body: `
            <span class="modal-subheader">Account</span>
            <div class="modal-section" id="account-sec">
                <div style="display:flex;gap: 10px;">
                    <img src="${formatUrl(homeurl)}/src/images/user-icon.svg" class="pfp" id="user-icon">
                    <div style="display:flex;flex-direction:column;align-items: baseline;gap: 10px;">
                        <span id="username" class="placeholder-text"></span>
                        <button class="modal-button" id="sign-in" onclick=""></button>
                    </div>
                </div>
            </div>
            <span class="modal-subheader">Rate Limits</span>
            <span class="modal-subtext">Your limits will reset in 29 day(s). Limits do not roll over, any remaining queries at the end of the month will be discarded.</span>
            <div class="modal-section">
                <div style="display:flex;gap: 10px;flex-direction: column;">
                    <span class="modal-subheader">Total Queries</span>
                    <span class="" id="query-total-amount">0 / -- requests</span>
                    <div class="progressbar">
                        <span class="progress intermediate" style="" id="query-total"></span>
                    </div>
                </div>
            </div>
            <div class="modal-section">
                <div style="display:flex;gap: 10px;flex-direction: column;">
                    <span class="modal-subheader">Search</span>
                    <span class="" id="query-search-amount">0 / - requests</span>
                    <div class="progressbar">
                        <span class="progress intermediate" style="" id="query-search"></span>
                    </div>
                </div>
            </div>
            <div class="modal-section">
                <div style="display:flex;gap: 10px;flex-direction: column;">
                    <span class="modal-subheader">Weather</span>
                    <span class="" id="query-weather-amount">0 / - requests</span>
                    <div class="progressbar">
                        <span class="progress intermediate" style="" id="query-weather"></span>
                    </div>
                </div>
            </div>
            <span class="modal-subheader">Search Settings</span>
            <div class="modal-section" onclick="darkModeAlert();">
                <div style="display:flex;gap: 10px;align-items: center;">
                ${icon.moon}
                <span class="">Dark Mode</span>
                <span style="margin-left: auto;" id="dark-mode">${settings.get('darkMode') ? 'On' : 'Off'}</span>
                </div>
            </div>
            <div class="settings-options" style="margin: 5px 0;">
                <div class="menu-button" id="open-new-window" onclick="toggleSetting('open-new-window');"><span style="display: flex; gap: 10px;align-items: center;">${icon.results} Open results in a new window</span><div class="toggle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="m10 15.586-3.293-3.293-1.414 1.414L10 18.414l9.707-9.707-1.414-1.414z"></path></svg></div></div>
            </div>
        `,
    });

    pageElements();

    try {
        fetch(`${formatUrl(neuboturl)}/api/limits`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${storage.get('neu-token')}`
            }
        }).then(response => response.json()).then(data => {
            document.getElementById('query-total').style.width = `0%`;
            document.getElementById('query-search').style.width = `0%`;
            document.getElementById('query-weather').style.width = `0%`;
            document.querySelectorAll('.progress').forEach(element => {
                element.classList.remove('intermediate');
            })
            setTimeout(() => {
                document.getElementById('query-total-amount').innerHTML = `${data.total.used} / ${data.total.limit} requests`;
                document.getElementById('query-search-amount').innerHTML = `${data.search.used} / ${data.search.limit} requests`;
                document.getElementById('query-weather-amount').innerHTML = `${data.weather.used} / ${data.weather.limit} requests`;
                document.getElementById('query-total').style.width = `${data.total.used / data.total.limit * 100}%`;
                document.getElementById('query-search').style.width = `${data.search.used / data.search.limit * 100}%`;
                document.getElementById('query-weather').style.width = `${data.weather.used / data.weather.limit * 100}%`;
            }, 50);
        });
    } catch (error) {
    }
    try {
        fetch(`${formatUrl(neuboturl)}/api/user`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${storage.get('neu-token')}`
            }
        }).then(response => response.json()).then(data => {
            if (data.authenticated) {
                document.getElementById('account-sec').innerHTML = `
                <div style="display:flex;gap: 10px;">
                    <img src="${data.user.profile_pic}" class="pfp" id="user-icon">
                    <div style="display:flex;flex-direction:column;align-items: baseline;gap: 10px;">
                        <span id="username" style="font-weight: 600;">${data.user.name}<span style="font-weight: 400;opacity: 0.7;margin-left:5px">(${data.user.email})</span></span>
                        <button class="modal-button red" id="sign-in" onclick="login()">Sign Out</button>
                    </div>
                </div>
                `
            } else {
                document.getElementById('account-sec').innerHTML = `
                <div style="display:flex;gap: 10px;">
                    <img src="${formatUrl(homeurl)}/src/images/user-icon.svg" class="pfp" id="user-icon">
                    <div style="display:flex;flex-direction:column;align-items: baseline;gap: 10px;">
                        <span id="username">Sign in for increased rate limits and enhanced features</span>
                        <button class="modal-button" id="sign-in" onclick="login()">Sign In</button>
                    </div>
                </div>
                `   
            }
        });
    } catch (error) {
    }
}

function login() {
    window.location.href = `${formatUrl(neuboturl)}/login/app/?callbackURL=${formatUrl(homeurl)}/callback/neubot/?token=[TOKEN]`;
}

function toggleApps() {
    const appsInner = document.querySelector(".apps-inner");
    const frame = document.querySelector(".frame");

    if (!frame.classList.contains("open")) {
        frame.classList.add("open");
        document.addEventListener("click", clickAway);
    } else {
        frame.classList.remove("open");
        document.removeEventListener("click", clickAway);
    }
}

function clickAway(event) {
    const appsInner = document.querySelector(".apps-inner");
    const appsButton = document.querySelector(".apps-button");
    const frame = document.querySelector(".frame");

    if (!appsInner.contains(event.target) && !appsButton.contains(event.target)) {
        frame.classList.remove("open");
        document.removeEventListener("click", clickAway);
    }
}

function setTheme() {
    if (settings.get('darkMode') == undefined) {
        settings.set('darkMode', true);
    }

    if (settings.get('darkMode') == false) {
        document.body.classList.add('light');
    } else {
        document.body.classList.remove('light');
    }
}

// arb

function darkModeAlert() {
    openAlert({title: 'Dark Mode', center: true, message: `${icon.moon}`, sanitize: false,buttons: [{text: 'On', action: 'settings.set(`darkMode`, true);closeAlert();pageElements();'},{text: 'Off', action: 'settings.set(`darkMode`, false);closeAlert();pageElements();'}]})
}