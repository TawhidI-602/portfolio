const GITHUB_USERNAME = "TawhidI-602";

const EXCLUDED_REPOS = ["portfolio"];

const LANG_COLORS = {
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "JavaScript": "#f1e05a",
    "TypeScript": "#3178c6",
    "Java": "#b07219",
    "C++": "#f34b7d",
    "C": "#555555",
    "Python": "#3572A5",
};

async function loadGitHubProjects() {
    const container = document.getElementById("projects-container");

    try {
        const response = await fetch(
            `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&direction=desc&per_page=20`
        );

        if (!response.ok) throw new Error("Failed to fetch repos");

        const repos = await response.json();

        const filtered = repos.filter(
            (repo) =>
                !EXCLUDED_REPOS.includes(repo.name) &&
                repo.name.toLowerCase() !== GITHUB_USERNAME.toLowerCase()
        )
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, 3);

        if (filtered.length === 0) {
            container.innerHTML = "<p>No projects found.</p>";
            return;
        }

        const reposWithLangs = await Promise.all(
            filtered.map(async (repo) => {
                const langRes = await fetch(repo.languages_url);
                const languages = await langRes.json();
                return { ...repo, languages };
            })
        );

        container.innerHTML = "";

        reposWithLangs.forEach((repo) => {
            const card = document.createElement("div");
            card.className = "project-card";

            const totalBytes = Object.values(repo.languages).reduce((a, b) => a + b, 0);
            const langEntries = Object.entries(repo.languages);

            const barSegments = langEntries
                .map(([lang, bytes]) => {
                    const color = LANG_COLORS[lang] || "#888";
                    const percent = ((bytes / totalBytes) * 100).toFixed(1);
                    return `<span style="background:${color}; width:${percent}%; display:inline-block; height:100%;"></span>`;
                })
                .join("");

            const langBadges = langEntries
                .map(([lang, bytes]) => {
                    const color = LANG_COLORS[lang] || "#888";
                    const percent = ((bytes / totalBytes) * 100).toFixed(1);
                    return `<span class="project-lang">
                                <span class="lang-dot" style="background:${color};"></span>
                                ${lang} ${percent}%
                            </span>`;
                })
                .join("");

            const description = repo.description || "No description provided.";

            const homepageBtn = repo.homepage
                ? `<a class="project-btn project-btn--primary" href="${repo.homepage}" target="_blank">Live Site</a>`
                : "";

            card.innerHTML = `
                <div class="project-card-header">
                    <h3>${repo.name}</h3>
                </div>
                <p class="project-desc">${description}</p>
                <div class="lang-bar">${barSegments}</div>
                <div class="project-langs">${langBadges}</div>
                <div class="project-links">
                    ${homepageBtn}
                    <a class="project-btn" href="${repo.html_url}" target="_blank">GitHub</a>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = `<p>Could not load projects. <a href="https://github.com/${GITHUB_USERNAME}" target="_blank">View on GitHub</a> instead.</p>`;
        console.error(error);
    }
}

loadGitHubProjects();

// ── Death Stranding Like Button ──────────────────────────────────────────────

const SESSION_DURATION = 7000;
const MAX_LIKES_PER_SESSION = 300;

let totalCount = parseInt(localStorage.getItem("ds-likes") || "0");
let sessionActive = false;
let sessionLikes = 0;
let sessionStart = null;
let drainInterval = null;
let depleted = false;
let thumbFloatThrottle = 0;

const dsBtn = document.getElementById("dsBtn");
const dsCountEl = document.getElementById("dsCount");
const dsStaminaEl = document.getElementById("dsStamina");
const dsThumbEl = document.getElementById("dsThumb");

dsCountEl.textContent = totalCount;

function spawnFloatingThumb() {
    const now = Date.now();
    if (now - thumbFloatThrottle < 100) return;
    thumbFloatThrottle = now;

    const rect = dsBtn.getBoundingClientRect();
    const el = document.createElement("span");
    el.className = "ds-thumb-float";
    el.textContent = "👍";

    const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 60;
    const y = rect.top + (Math.random() - 0.5) * 20;
    const rot = (Math.random() - 0.5) * 40 + "deg";

    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.setProperty("--rot", rot);

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
}

function flashCounter() {
    dsCountEl.classList.remove("flash");
    void dsCountEl.offsetWidth;
    dsCountEl.classList.add("flash");
}

function startSession() {
    if (depleted) return;
    if (!sessionActive) {
        sessionActive = true;
        sessionLikes = 0;
        sessionStart = Date.now();
        dsBtn.classList.add("active");

        drainInterval = setInterval(() => {
            const elapsed = Date.now() - sessionStart;
            const pct = Math.max(0, 100 - (elapsed / SESSION_DURATION) * 100);
            dsStaminaEl.style.width = pct + "%";
            if (elapsed >= SESSION_DURATION) endSession();
        }, 30);
    }
    addLike();
}

function addLike() {
    if (!sessionActive || depleted) return;
    if (sessionLikes >= MAX_LIKES_PER_SESSION) { endSession(); return; }

    totalCount++;
    sessionLikes++;

    flashCounter();
    setTimeout(() => { dsCountEl.textContent = totalCount; }, 75);
    localStorage.setItem("ds-likes", totalCount);

    dsThumbEl.classList.remove("pop");
    void dsThumbEl.offsetWidth;
    dsThumbEl.classList.add("pop");

    spawnFloatingThumb();
}

function endSession() {
    sessionActive = false;
    depleted = true;
    clearInterval(drainInterval);
    dsBtn.classList.remove("active");
    dsBtn.classList.add("depleted");
    dsStaminaEl.style.width = "0%";
    dsStaminaEl.classList.add("depleted");
}

dsBtn.addEventListener("click", startSession);
dsBtn.addEventListener("touchstart", (e) => { e.preventDefault(); startSession(); });