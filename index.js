const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwGZj1JTE61vNISu9zSrR6qR8aNaG4O4OmCN3-mlaOmZEgWPiUAKWm_HrhFwvAjn2pRlA/exec";

let playerCount = 0;
const maxExtraPlayers = 6;
const maxReserves = 2;

// --- SÉCURITÉ : NETTOYAGE DES TEXTES ---
function sanitize(text) {
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
}

function updateCounter() {
    const counterElement = document.getElementById('current-count');
    if (counterElement) {
        counterElement.innerText = playerCount + 1;
    }
}

function addPlayer() {
    const allPlayers = document.querySelectorAll(".player");
    if (allPlayers.length >= 6) {
        alert("Je team is compleet!");
        return;
    }

    let veldspelersCount = 0;
    allPlayers.forEach(p => {
        if (p.querySelector(".p-role").value === "Veldspeler") veldspelersCount++;
    });

    const defaultRole = (veldspelersCount >= 4) ? "Wissel" : "Veldspeler";

    const container = document.getElementById("players");
    const div = document.createElement("div");
    div.className = "player";
    div.innerHTML = `
    <div class="grid">
      <input type="text" class="p-naam" placeholder="Naam speler" required>
      <input type="text" class="p-voor" placeholder="Voornaam" required>
      <input type="text" class="p-klas" placeholder="Klas" required>
      <select class="p-role" onchange="checkRoles(this)">
        <option value="Veldspeler" ${defaultRole === "Veldspeler" ? "selected" : ""}>Veldspeler</option>
        <option value="Wissel" ${defaultRole === "Wissel" ? "selected" : ""}>Wissel</option>
      </select>
      <button type="button" onclick="removePlayer(this)" style="background:var(--danger); color:white; border:none; border-radius:8px; cursor:pointer; padding: 5px;">❌</button>
    </div>
  `;
    container.appendChild(div);
    playerCount++;
    updateCounter();
}

function removePlayer(button) {
    button.closest(".player").remove();
    playerCount--;
    updateCounter();
}

function checkRoles(select) {
    const allPlayers = document.querySelectorAll(".player");
    let veldspelersExtra = 0;
    let wissels = 0;

    allPlayers.forEach(p => {
        const role = p.querySelector(".p-role").value;
        if (role === "Veldspeler") veldspelersExtra++;
        if (role === "Wissel") wissels++;
    });

    if (select.value === "Veldspeler" && veldspelersExtra > 4) {
        alert("Maximum 5 veldspelers op het veld (inclusief kapitein)!");
        select.value = "Wissel";
        return;
    }

    if (select.value === "Wissel" && wissels > 2) {
        alert("Maximum 2 wisselspelers toegestaan!");
        select.value = "Veldspeler";
    }
}

// --- ENVOI DU FORMULAIRE ---
const form = document.getElementById('teamForm');
if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerText = "Bezig avec l'inscription...";

        const playersData = [];
        document.querySelectorAll('.player').forEach(div => {
            playersData.push({
                naam: sanitize(div.querySelector('.p-naam').value),
                voornaam: sanitize(div.querySelector('.p-voor').value),
                klas: sanitize(div.querySelector('.p-klas').value),
                role: div.querySelector('.p-role').value
            });
        });

        const dataToSend = {
            teamName: sanitize(document.getElementById('TeamNaam').value),
            email: document.getElementById('KapiteinEmail').value,
            capName: sanitize(document.getElementById('KapiteinNaam').value),
            capFirstName: sanitize(document.getElementById('KapiteinVoornaam').value),
            capClass: sanitize(document.getElementById('KapiteinKlas').value),
            players: playersData
        };

        fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(dataToSend)
            })
            .then(res => res.json())
            .then(response => {
                if (response.status === "success") {
                    alert("✅ Inschrijving geslaagd!");
                    form.reset();
                    document.getElementById("players").innerHTML = "";
                    playerCount = 0;
                    updateCounter();
                    loadResults();
                } else {
                    alert("⚠️ " + response.message);
                }
            })
            .catch(error => {
                console.error('Fout!', error);
                alert("Er is een fout opgetreden.");
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerText = "Team inschrijven";
            });
    });
}

// --- LECTURE DES DONNÉES ---
async function loadResults() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();

        // 1. Classement
        const tableBody = document.querySelector("#resultaten table tbody");
        if (tableBody) {
            tableBody.innerHTML = "";
            if (!data.competitie || data.competitie.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='7'>Wachten op de eerste wedstrijden...</td></tr>";
            } else {
                data.competitie.forEach(row => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
            <td><strong>${row[0]}</strong></td> 
            <td>${row[1]}</td> 
            <td>${row[2]}</td> 
            <td>${row[3]}</td> 
            <td>${row[4]}</td> 
            <td>${row[7]}</td> 
            <td><strong>${row[8]}</strong></td> `;
                    tableBody.appendChild(tr);
                });
            }
        }

        // 2. Équipes
        const teamsContainer = document.getElementById("teams-container");
        if (teamsContainer) {
            teamsContainer.innerHTML = "";
            if (data.teams && data.teams.length > 0) {
                data.teams.forEach(t => {
                    let playersHTML = t.players.map(p => {
                        let icon = p.rol === "Kapitein" ? "👑" : "⚽";
                        return `<li>${icon} <strong>${p.voornaam} ${p.naam}</strong> <span style="color:#666; font-size:12px;">(${p.klas})</span></li>`;
                    }).join("");

                    const teamCard = document.createElement("div");
                    teamCard.className = "card";
                    teamCard.innerHTML = `
            <h3 style="color: var(--primary); border-bottom: 2px solid var(--accent); padding-bottom: 5px; margin-bottom: 10px;">🛡️ ${t.team}</h3>
            <ul style="list-style: none; padding-left: 0;">${playersHTML}</ul>
          `;
                    teamsContainer.appendChild(teamCard);
                });
            }
        }

        // 3. Playoffs
        if (data.playoffs && data.playoffs.length > 0) {
            const matchBlocks = document.querySelectorAll("#playoffs .match-block");
            data.playoffs.forEach((match, index) => {
                if (matchBlocks[index]) {
                    const t1 = match[1] || "TBD";
                    const s1 = match[2] || 0;
                    const s2 = match[3] || 0;
                    const t2 = match[4] || "TBD";
                    const w1 = (s1 > s2) ? "winner" : "";
                    const w2 = (s2 > s1) ? "winner" : "";

                    matchBlocks[index].innerHTML = `
            <div class="team top ${w1}">${t1} <span class="score">${s1}</span></div>
            <div class="team bottom ${w2}">${t2} <span class="score">${s2}</span></div>
          `;
                    if (index === 14) {
                        const championName = document.querySelector(".champion-name");
                        if (championName && (s1 > 0 || s2 > 0)) {
                            championName.innerText = (s1 > s2) ? t1 : t2;
                        }
                    }
                }
            });
        }

        // 4. Matchs & Résultats
        const matchesContainer = document.getElementById('matches-grid');
        const resultsContainer = document.getElementById('results-grid');

        if (data.wedstrijden) {
            if (matchesContainer) matchesContainer.innerHTML = "";
            if (resultsContainer) resultsContainer.innerHTML = "";

            data.wedstrijden.forEach(match => {
                // Ignore les lignes vides du Sheet
                if (!match.teamA || match.teamA.toString().trim() === "") return;

                const isFinished = match.scoreA !== "" && match.scoreA !== null && match.scoreA !== undefined;
                const v = (match.veld) ? String(match.veld).toUpperCase().trim() : "";
                let c = "veld-default";
                if (v.includes("A")) c = "veld-a";
                else if (v.includes("B")) c = "veld-b";
                else if (v.includes("C")) c = "veld-c";
                else if (v.includes("D")) c = "veld-d";

                const matchHTML = `
            <div class="match-card ${isFinished ? 'finished' : ''}">
                <div class="teams-split">
                    <div class="team-side side-a">
                        <span class="team-name">${match.teamA}</span>
                    </div>
                    <div class="vs-badge">${isFinished ? match.scoreA + ' - ' + match.scoreB : 'VS'}</div>
                    <div class="team-side side-b">
                        <span class="team-name">${match.teamB}</span>
                    </div>
                </div>
                <div class="match-info-bar">
                    <span class="info-item">📅 ${match.datum}</span>
                    <span class="info-item">⏰ ${match.uur}</span>
                    <span class="info-item veld-badge ${c}">📍 Veld ${v || '?'}</span>
                </div>
            </div>`;

                if (isFinished && resultsContainer) {
                    resultsContainer.innerHTML += matchHTML;
                } else if (matchesContainer) {
                    matchesContainer.innerHTML += matchHTML;
                }
            });
        }

        // À ajouter dans ta fonction loadResults()
// À insérer dans ta fonction loadResults()
const premiumContainer = document.getElementById("premium-leaderboard");

if (premiumContainer && data.topscorers) {
    premiumContainer.innerHTML = "";

    const sortedPlayers = data.topscorers
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
        .slice(0, 10);

    sortedPlayers.forEach((player, index) => {
        const rank = index + 1;
        const card = document.createElement("div");
        card.className = `player-card rank-${rank}`;
        
        card.innerHTML = `
            <div class="rank-box" style="width:40px; font-size:1.5rem; font-weight:bold; color:white;">${rank}</div>
            <div class="player-main" style="flex:1; padding-left:15px;">
                <span class="player-name">${player.voornaam} ${player.naam}</span>
                <span class="player-team">🛡️ ${player.team}</span>
            </div>
            <div class="player-stats" style="display:flex; gap:25px;">
                <div class="stat-item" style="text-align:center;">
                    <span class="stat-value value-goals">${player.goals}</span>
                    <span class="stat-label">Doelpunten</span>
                </div>
                <div class="stat-item" style="text-align:center;">
                    <span class="stat-value value-assists">${player.assists}</span>
                    <span class="stat-label">Assists</span>
                </div>
            </div>
        `;
        premiumContainer.appendChild(card);
    });
}
        // --- 5. Affichage du Top 10 Joueurs ---
const playersLeaderboard = document.getElementById("players-leaderboard");
if (playersLeaderboard && data.topscorers) {
    playersLeaderboard.innerHTML = "";



    // On s'assure de trier : d'abord Punten (desc), puis Assit (desc)
// À mettre dans loadResults()
const top10 = data.topscorers
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, 10);

    top10.forEach((p, index) => {
        const rank = index + 1;
        let badge = rank;
        
        // Design pour les 3 premiers
        if (rank === 1) badge = "🥇";
        else if (rank === 2) badge = "🥈";
        else if (rank === 3) badge = "🥉";

        const playerRow = document.createElement("div");
        playerRow.style = `
            display: flex; 
            align-items: center; 
            padding: 15px; 
            border-bottom: 1px solid rgba(255,255,255,0.1);
            background: ${rank % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};
        `;

        playerRow.innerHTML = `
            <div style="width: 40px; font-weight: bold; font-size: 1.2rem; text-align: center;">${badge}</div>
            <div style="flex: 1; padding-left: 15px;">
                <div style="font-weight: bold; color: #fff;">${p.voornaam} ${p.naam}</div>
                <div style="font-size: 0.8rem; color: #f1c40f;">🛡️ ${p.team}</div>
            </div>
            <div style="text-align: right; display: flex; gap: 20px;">
                <div style="text-align: center;">
                    <span style="display: block; font-weight: bold; color: #2ecc71; font-size: 1.1rem;">${p.goals}</span>
                    <small style="font-size: 0.6rem; text-transform: uppercase; opacity: 0.6;">Buts</small>
                </div>
                <div style="text-align: center; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 15px;">
                    <span style="display: block; font-weight: bold; color: #3498db; font-size: 1.1rem;">${p.assists}</span>
                    <small style="font-size: 0.6rem; text-transform: uppercase; opacity: 0.6;">Assists</small>
                </div>
            </div>
        `;
        playersLeaderboard.appendChild(playerRow);
    });
}
    } catch (error) {
        console.error("Fout bij laden :", error);
    }
}

// --- LOGIQUE GLOBALE ---

function toggleMenu() {
    const nav = document.getElementById("nav-menu");
    if (nav) {
        nav.classList.toggle("active");
    }
}

window.addEventListener('load', loadResults);

document.addEventListener('mousemove', (e) => {
    const moveX = (e.clientX - window.innerWidth / 2) / 50;
    const moveY = (e.clientY - window.innerHeight / 2) / 50;
    const title = document.querySelector('.glitch-title');
    if (title) {
        title.style.transform = `translate(${-moveX}px, ${-moveY}px)`;
    }
});