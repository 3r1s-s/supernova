let search = document.getElementById('search');

const query = new URLSearchParams(window.location.search).get('q');
const page = new URLSearchParams(window.location.search).get('page') || 1;
const page_size = 15;

const app = document.querySelector('.app');

window.addEventListener('load', (event) => {
    if (!query) {
        startPage();
            app.style.opacity = 1;
        return;
    }

    search.value = query;
    placeholders();
    document.getElementById('ai').href = `/ai/?q=${query}`;
    getResults(page);
    document.title = `${query} - SuperNova`;
    app.style.opacity = 1;
});

function placeholders() {
    for (let i = 0; i < 15; i++) {
        const result = document.createElement('div');
        result.classList.add('result-placeholder');
        result.style.height = Math.floor(Math.random() * 50) + 100 + 'px';
        result.style.animationDelay = `${i * 100}ms`;
        document.querySelector('.results-column').appendChild(result);
    }
}

async function getResults(page) {
    const results = document.querySelector('.results-column');
    const resultsExtra = document.querySelector('.results-extra');
    const query = search.value.toLowerCase();
    const apps = await fetchApps();
    let starttime = new Date().getTime();
    let success = true;
    try {
        fetch(`${url}/search?query=${query.replace(/^define\s+/, '')}&page=${page}&page_size=${page_size}`)
            .then(response => response.json())
            .then(data => {
                results.innerHTML = '';
                resultsExtra.innerHTML = '';

                const matchingApp = apps.find(app =>
                    app.keywords.split(', ').some(keyword => query.includes(keyword))
                );

                if (matchingApp) {
                    results.innerHTML += `
                    <div class="result-app" style="opacity:0;">
                        <iframe src="${matchingApp.src}?query=${encodeURIComponent(query.split(' ').slice(1).join(' '))}" width="100%" frameborder="0" class="app-iframe" id="app-iframe" height="0"></iframe>
                    </div>
                    `;

                    window.addEventListener('message', (e) => {
                        if (e.data?.type === 'iframeHeight') {
                            document.getElementById('app-iframe').style.height = `${e.data.height}px`;
                            setTimeout(() => {
                                document.querySelector('.result-app').style.opacity = 1;
                            }, 200);
                        }
                    });
                }

                if (data.detail) {
                    document.querySelector('.result-count').innerHTML = '';
                    results.innerHTML += `
                            <div class="result">
                                <h1 class="result-title" style="color: var(--app-text);">No Results</h1>
                                <span>${data.detail}</span>
                            </div>
                        `;
                    success = false;
                }
                if (success) {
                    paginate(data);
                    if (data.results.length > 0) {
                        data.results.forEach(result => {
                            results.innerHTML += `
                                <a class="result" href="${result.url}" ${settings.get('open-new-window') ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                                    <h1 class="result-title">${result.title.sanitize()}</h1>
                                    <span class="result-link">${result.url.sanitize()}</span>
                                    <span class="result-desc">${result.description.sanitize() || '<i>No description available.</i>'}</span>
                                </a>
                            `;
                        });

                        const endtime = new Date().getTime();
                        const duration = (endtime - starttime) / 1000;
                        document.querySelector('.result-count').innerHTML = `${data.total_results} results found in ${duration.toFixed(2)} seconds.`;
                    } else {
                        results.innerHTML = '';
                        resultsExtra.innerHTML = '';
                        document.querySelector('.result-count').innerHTML = '';
                        results.innerHTML += `
                                <div class="result">
                                    <h1 class="result-title" style="color: var(--app-text);">Error</h1>
                                    <span>Try searching for something less specific.</span>
                                    <i class="subtext">Error: ${error}</i>
                                </div>
                            `;
                    }
                }
                const wikiSearch = query.includes('define') ? query.replace('define', '').trim() : query;
                searchWikipedia(wikiSearch).then(title => {
                    if (title) {
                        getWikiPreview(title).then(info => {
                            if (info.valid) {

                                resultsExtra.innerHTML += `
                            <div class="wiki-preview ${info.thumbnail != null ? '' : 'no-image'}" style="opacity:0;">
                            <div class="wiki-banner">
                            <h2 id="wiki-title" class="${info.title.length > 25 ? 'long-title' : ''}">${info.title}</h2>
                            <div class="wiki-image-container">
                            <img id="wiki-image" src="${info.thumbnail}"/>
                            </div>
                            </div>
                            <div class="wiki-info">
                            <p id="wiki-desc">
                            ${info.extract.length > 200 ? info.extract.slice(0, 200) + '...' : info.extract}.
                            <a href="https://en.wikipedia.org/wiki/${info.title}" target="_blank" rel="noopener noreferrer">Read more</a>
                            </p>
                            ${info.website ? `<p id="wiki-site">Official Site: <a href="${info.website}" target="_blank" rel="noopener noreferrer">${new URL(info.website).hostname}</a></p>` : ''}
                            </div>
                            </div>
                            `;

                                setTimeout(() => {
                                    document.querySelector('.wiki-preview').style.opacity = 1;
                                }, 100);
                            }
                        });
                    }
                });
            })
    } catch (error) {
        console.log(error);
        results.innerHTML = '';
        resultsExtra.innerHTML = '';
        document.querySelector('.result-count').innerHTML = '';
        results.innerHTML += `
            <div class="result">
                <h1 class="result-title" style="color: var(--app-text);">Error</h1>
                <span>Try searching for something less specific.</span>
                <i class="subtext">Error: ${error}</i>
            </div>
        `;
    };
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

search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        search.blur();
        searchBar();
    }
});

async function fetchApps() {
    const response = await fetch(`${formatUrl(homeurl)}/apps/apps.json`);
    return response.json();
}

function paginate(data) {
    const pageselect = document.getElementById('pages-selector');
    pageselect.innerHTML = '';
    for (let i = 1; i <= Math.min(data.total_pages - 1, 8); i++) {
        const option = document.createElement('a');
        option.value = i;
        option.innerHTML = i;
        if (i == page) {
            option.classList.add('selected');
        }
        option.href = `../?q=${query}&page=${i}`;
        pageselect.appendChild(option);
    }
}

function clearSearch() {
    search.value = '';
    search.focus();
}

async function getWikidataWebsite(id) {
  const res = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${id}&property=P856&format=json&origin=*`);
  const data = await res.json();
  return data.claims?.P856?.[0]?.mainsnak?.datavalue?.value || null;
}

async function getWikiPreview(title) {
  const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=extracts|pageimages|pageprops&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=300&origin=*`);
  const data = await response.json();
  const page = Object.values(data.query.pages)[0];

  const valid = !page.extract.toLowerCase().includes("may refer to");
  const wikidataID = page.pageprops?.wikibase_item || null;
  const website = wikidataID ? await getWikidataWebsite(wikidataID) : null;

  return {
    title: page.title,
    extract: page.extract,
    thumbnail: page.thumbnail?.source || null,
    website: website,
    valid: valid,
  };
}

async function searchWikipedia(query) {
  const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
  const data = await res.json();
  const topTitle = data.query.search[0]?.title;
  return topTitle;
}

function startPage() {
    document.querySelector('.nav').remove();
    const more = document.createElement('div');
    more.innerHTML = `
                    <div class="more fixed">
                    <div class="apps-button" onclick="toggleApps()" id="apps">
                        <svg width="16" height="16" viewBox="0 0 175 175" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="35" height="35" fill="currentColor"></rect>
                            <rect y="70" width="35" height="35" fill="currentColor"></rect>
                            <rect y="140" width="35" height="35" fill="currentColor"></rect>
                            <rect x="140" width="35" height="35" fill="currentColor"></rect>
                            <rect x="140" y="70" width="35" height="35" fill="currentColor"></rect>
                            <rect x="140" y="140" width="35" height="35" fill="currentColor"></rect>
                            <rect x="70" width="35" height="35" fill="currentColor"></rect>
                            <rect x="70" y="70" width="35" height="35" fill="currentColor"></rect>
                            <rect x="70" y="140" width="35" height="35" fill="currentColor"></rect>
                        </svg>
                        <div class="apps-inner">        
                            <iframe class="frame" src="https://eris.pages.dev/apps" frameborder="0" style="height: 340px; width: 340px; color-scheme: light; border-radius: 25px; box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);"></iframe>
                        </div>                                
                    </div>
                    <div class="settings-button" onclick="openSettings();" id="settings">
                        <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M0.644169 15.2044C0.751639 15.4175 0.866389 15.627 0.988219 15.8323C1.34503 16.445 1.76284 17.0223 2.23048 17.545C2.3967 17.7307 2.65856 17.7968 2.89375 17.7126L5.25826 16.8621C5.96645 16.608 6.74841 17.07 6.87902 17.8018L7.32018 20.2764C7.36418 20.5227 7.55119 20.7167 7.79454 20.7688C8.86201 20.9976 9.95753 21.057 11.0418 20.9452C11.427 20.9061 11.8095 20.8457 12.1863 20.7643C12.375 20.7232 12.5303 20.5969 12.6121 20.4275C12.6441 20.37 12.6671 20.3068 12.6794 20.2397L13.132 17.7739C13.1978 17.4162 13.4191 17.1252 13.7102 16.9498C13.7478 16.9275 13.7867 16.9072 13.8264 16.8889C14.1041 16.7654 14.426 16.7408 14.7301 16.8496L17.0889 17.6938C17.2068 17.7362 17.3318 17.7406 17.4482 17.7107C17.5805 17.6872 17.7044 17.6208 17.7983 17.5172C18.2857 16.9783 18.7189 16.3833 19.0875 15.7497C19.4503 15.1137 19.748 14.4403 19.9703 13.7471C20.0128 13.6142 20.0083 13.4742 19.9629 13.3481C19.9307 13.2315 19.8646 13.1245 19.7685 13.043L17.8596 11.4179C17.6114 11.2067 17.4714 10.912 17.4409 10.6065C17.4371 10.563 17.4355 10.5194 17.4361 10.4758C17.444 10.1379 17.5847 9.80337 17.8591 9.56905L19.7638 7.94348C19.8146 7.90007 19.857 7.84958 19.8904 7.7944C19.9978 7.63842 20.0299 7.43844 19.9706 7.25291C19.8534 6.88733 19.7151 6.52704 19.5572 6.17466C19.1114 5.17572 18.5115 4.2528 17.7787 3.43934C17.612 3.25429 17.3509 3.18886 17.1161 3.27382L14.7569 4.12827C14.0592 4.38082 13.2679 3.93321 13.1344 3.19155L12.6871 0.714256C12.6423 0.468053 12.4542 0.273849 12.2106 0.22246C11.5182 0.0764882 10.803 0.00250031 10.088 0.000608251C9.88769 -0.0015584 9.68739 0.002064 9.48735 0.0114648C8.92415 0.0369819 8.36389 0.107332 7.81778 0.222459C7.78135 0.230146 7.74615 0.241028 7.71249 0.2548C7.5098 0.328781 7.35888 0.505679 7.31996 0.723547L6.8788 3.19817C6.81394 3.56157 6.58834 3.85866 6.29097 4.03446C5.98991 4.2061 5.61923 4.25412 5.27153 4.12827L2.91237 3.27382C2.70694 3.1995 2.48138 3.24016 2.31657 3.37545C2.2857 3.39886 2.25676 3.42543 2.23026 3.45505C1.81793 3.91588 1.44433 4.4192 1.11714 4.95183C1.05788 5.04799 1.00019 5.14513 0.944072 5.24319C0.878302 5.35619 0.814661 5.4704 0.753186 5.58577C0.464267 6.12611 0.222113 6.69081 0.0338354 7.26739C0.0213426 7.30567 0.0127871 7.34455 0.00802709 7.38352C-0.0257478 7.59364 0.0518458 7.809 0.218337 7.94974L2.13633 9.56992C2.41146 9.80242 2.55518 10.1364 2.56469 10.4743C2.56917 10.8294 2.42529 11.1857 2.13611 11.4301L0.218115 13.0503C0.0484589 13.1937 -0.0289685 13.4145 0.00982709 13.6284C0.0147983 13.6634 0.0228404 13.6982 0.0340542 13.7326C0.198098 14.235 0.403035 14.7283 0.644169 15.2044ZM10 14.5C12.2091 14.5 14 12.7091 14 10.5C14 8.29086 12.2091 6.5 10 6.5C7.79086 6.5 6 8.29086 6 10.5C6 12.7091 7.79086 14.5 10 14.5Z" fill="currentColor"></path>
                        </svg>                                        
                    </div>
                </div>
                `

    const content = document.querySelector('.content');
    const selector = document.querySelector('.selector-outer');
    const footer = document.querySelector('.footer');

    content.innerHTML = `
    <div class="hero fixed" style="gap: 25px; height: 80vh;">
    <div style="display:flex;align-items:center;gap:10px;position: relative;">
        <span class="logo big">SuperNova</span>
        <span class="logo big animated" style="position: absolute; top: 0;">SuperNova</span>
    </div>
                <div class="search">
                    <div class="icon">
                        <svg aria-hidden="true" width="28" height="28" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <div class="clearsearch" onclick="clearSearch();">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14.3527 12.0051L19.8447 6.51314C20.496 5.86247 20.496 4.80714 19.8447 4.15647C19.1933 3.50514 18.1387 3.50514 17.488 4.15647L11.996 9.64847L6.50401 4.15647C5.85334 3.50514 4.79734 3.50514 4.14734 4.15647C3.49601 4.80714 3.49601 5.86247 4.14734 6.51314L9.63934 12.0051L4.13401 17.5105C3.48267 18.1618 3.48267 19.2165 4.13401 19.8671C4.45934 20.1925 4.88601 20.3551 5.31267 20.3551C5.73934 20.3551 6.16601 20.1925 6.49134 19.8671L11.9967 14.3611L17.4887 19.8531C17.814 20.1785 18.2407 20.3411 18.6673 20.3411C19.094 20.3411 19.52 20.1785 19.846 19.8531C20.4973 19.2018 20.4973 18.1471 19.846 17.4965L14.3527 12.0051Z" fill="currentColor"/></svg>
                    </div>
                    <input id="search" type="text" placeholder="Search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                </div>
    </div>
    `
    selector.remove();
    footer.classList.add('fixed')
    app.appendChild(more);
    search = document.getElementById('search');
    search.focus();

    search.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            search.blur();
            searchBar();
        }
    });
}