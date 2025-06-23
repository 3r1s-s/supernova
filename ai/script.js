String.prototype.sanitize = function () {
    return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/`/g, '&#96;').replace(/'/g, '&#39;');
};

const search = document.getElementById('search');
const neumessage = document.getElementById('postbar-input');

const query = new URLSearchParams(window.location.search).get('q') || '';
const page = new URLSearchParams(window.location.search).get('page') || 1;
const page_size = 15;

let waitforresponse;
let pfp;

window.addEventListener('load', (event) => {
    search.value = query;
    if (!query || query == '') {
        document.getElementById('all').href = `../`;
    } else {
        document.getElementById('all').href = `../?q=${query}&page=${1}`;
    }
    askNeu(`${query}`);
});

function askNeu(askquery) {
    waitforresponse = true;
    try {
        document.querySelector('.aura-glow-fade').classList.add('show');

        if (!askquery) {
            try {
                fetch(`${formatUrl(neuboturl)}/api/user`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": `Bearer ${storage.get('neu-token')}`
                    }
                }).then(response => response.json()).then(data => {
                    if (data.authenticated) {
                        const splitName = data.user.name.split(' ');
                        const firstName = splitName[0];
                        const lastName = splitName[splitName.length - 1];
                        pfp = data.user.profile_pic;
                        document.querySelector('.greeting').innerHTML = `<span>Hello, ${firstName}</span>`;
                    } else {
                        document.querySelector('.greeting').innerHTML = `<span>Hello, Stranger</span>`;
                    }
                    setTimeout(() => {
                        document.querySelector('.aura-glow-fade').classList.remove('show');
                        document.querySelector('.greeting').classList.remove('hide');
                        document.querySelector('.greeting').style.visibility = 'visible';
                        document.querySelector('.chat-header').style.visibility = 'visible';
                    }, 50);
                });
            } catch (error) {
                console.log(error);
            }
        } else {
            document.querySelector('.aura-glow-fade').classList.add('show');
            document.querySelector('.chat-header').classList.remove('hide');
            document.querySelector('.greeting').classList.add('hide');
            document.getElementById('title-query').innerHTML = askquery;
            fetch(`${formatUrl(neuboturl)}/api/user`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${storage.get('neu-token')}`
                }
            }).then(response => response.json()).then(data => {
                if (data.authenticated) {
                    pfp = data.user.profile_pic;
                }
            });
            fetch(`${formatUrl(neuboturl)}/api/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${storage.get('neu-token')}`
                },
                body: JSON.stringify({
                    query: `tell me about ${askquery}`,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            }).then(response => response.json()).then(data => {
                console.log(data);
                aiMessage(data.response, data.thoughts);
                document.querySelector('.aura-glow-fade').classList.remove('show');
            });
        }
    } catch (error) {
        console.log(error);
        aiMessage(error);
    }
    waitforresponse = false;
}

function aiMessage(message, details) {
    let messageJson;
    try {
        messageJson = JSON.parse(message);
    } catch (error) {
        messageJson = {};
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    if (messageJson.type) {
        if (messageJson.error) {
            messageDiv.innerHTML = `
            <div>
                <img class="pfp" src="../src/images/supernova-ai.svg">
            </div>
            <div class="message-content">
                <span class="username">SuperNova</span>
                <span class="message-text">${messageJson.error}</span>
            </div>
            `;

            document.querySelector('.chat').append(messageDiv);
            document.querySelector('.greeting').classList.add('hide');
            return;
        }

        if (messageJson.type == 'search_results') {
            const aiResults = document.createElement('div');
            aiResults.classList.add('ai-results');

            messageJson.results.forEach(result => {
                const resultDiv = document.createElement('div');
                resultDiv.classList.add('ai-result');
                resultDiv.innerHTML = `
                <a href="${result.url}" ${settings.get('open-new-window') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="ai-result-link">
                    <span class="ai-result-title">${result.title}</span>
                    <span class="ai-result-url">${result.url}</span>
                    <span class="ai-result-description">${result.description}</span>
                </a>
                `;
                aiResults.append(resultDiv);
            })

            messageDiv.innerHTML = `
            ${aiResults.outerHTML}
            `

            messageDiv.classList.add('ai-search-result');
        }
    } else {
        messageDiv.innerHTML = `
        <div>
            <img class="pfp" src="../src/images/supernova-ai.svg">
        </div>
        <div class="message-content">
            <span class="username">SuperNova</span>
            <span class="message-text">${message}</span>
        </div>
        `;
    }

    document.querySelector('.chat').append(messageDiv);
    document.body.scrollIntoView({ behavior: 'smooth', block: 'end' });
    waitforresponse = false;
}

function sendMessage(message) {
    if (message !== '' && !waitforresponse) {
        waitforresponse = true;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'user');
        messageDiv.innerHTML = `
        <div>
            <img class="pfp" src="${pfp || '../src/images/user-icon.svg'}">
        </div>
        <div class="message-content">
            <span class="username">You</span>
            <span class="message-text">${message}</span>
        </div>
    `;
        document.querySelector('.chat').append(messageDiv);
        document.querySelector('.greeting').classList.add('hide');
        fetch(`${formatUrl(neuboturl)}/api/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${storage.get('neu-token')}`
            },
            body: JSON.stringify({
                query: message,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            })
        }).then(response => response.json()).then(data => {
            console.log(data);
            aiMessage(data.response, data.thoughts);
            document.querySelector('.aura-glow-fade').classList.remove('show');
        });
    }
    document.body.scrollIntoView({ behavior: 'smooth', block: 'end' });
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

function searchBar() {
    const searchquery = search.value.toLowerCase();
    navigate(searchquery);
}

function navigate(searchquery) {
    const navurl = new URL(window.location.href);
    navurl.searchParams.set('q', searchquery);
    window.location.href = `${navurl}`;
}

neumessage.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && waitforresponse == false) {
        sendMessage(neumessage.value);
        neumessage.value = '';
        event.preventDefault();
    } else {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    }
});

search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        search.blur();
        searchBar();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT' && !event.target.hasAttribute('focus')) return;
    neumessage.focus();
});

function newChat() {
    const navurl = new URL(window.location.href);
    navurl.searchParams.set('q', '');
    window.location.href = `${navurl}`;
}

function buttonSendMessage() {
    sendMessage(neumessage.value);
    neumessage.value = '';
}