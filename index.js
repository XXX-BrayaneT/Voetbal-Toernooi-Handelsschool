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
    if (allPlayers.length >= 6) { // 6 extra + 1 capitaine = 7 max
        alert("Je team is compleet!");
        return;
    }

    // On compte les veldspelers actuels (hors capitaine)
    let veldspelersCount = 0;
    allPlayers.forEach(p => {
        if (p.querySelector(".p-role").value === "Veldspeler") veldspelersCount++;
    });

    // Si on a déjà 4 veldspelers, le nouveau est d'office un Wissel
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

    // Règle 1 : Max 4 veldspelers extra (car +1 capitaine = 5)
    if (select.value === "Veldspeler" && veldspelersExtra > 4) {
        alert("Maximum 5 veldspelers op het veld (inclusief kapitein)!");
        select.value = "Wissel";
        return;
    }

    // Règle 2 : Max 2 Wissels
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

// --- LECTURE DES RÉSULTATS ---
// --- LECTURE DES DONNÉES DEPUIS LE SHEET (Classement, Teams, Playoffs, Matchs) ---
async function loadResults() 
{
  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    
    // 1. Remplir le Tableau du Classement
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
    
    // 2. Remplir la Section des Équipes
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

    // 3. Remplir les Playoffs
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

    // 4. --- Remplir les Prochains Matchs (Version Finale) ---
    const matchesContainer = document.getElementById('matches-grid');
    if (matchesContainer && data.wedstrijden) {
        matchesContainer.innerHTML = ""; 

        // Filtrer les en-têtes et lignes vides
        const wedstrijden = data.wedstrijden.filter(row => row[0] && row[0] !== "Team A");

        wedstrijden.forEach(row => {
            // row[4] contient la colonne E du Sheet
            const v = (row[4] !== undefined && row[4] !== null) ? String(row[4]).toUpperCase().trim() : ""; 
            
            let c = "veld-default";
            if (v.includes("A")) c = "veld-a";
            else if (v.includes("B")) c = "veld-b";
            else if (v.includes("C")) c = "veld-c";
            else if (v.includes("D")) c = "veld-d";

            matchesContainer.innerHTML += `
            <div class="match-card">
                <div class="teams-split">
                    <div class="team-side side-a">
                        <span class="team-name">${row[0]}</span>
                    </div>
                    <div class="vs-badge">VS</div>
                    <div class="team-side side-b">
                        <span class="team-name">${row[1]}</span>
                    </div>
                </div>
                <div class="match-info-bar">
                    <span class="info-item">📅 ${row[2]}</span>
                    <span class="info-item">⏰ ${row[3]}</span>
                    <span class="info-item veld-badge ${c}">📍 Veld ${v || '?'}</span>
                </div>
            </div>`;
        });
      }

      } catch (error) {
        console.error("Fout bij laden :", error);
      }
}

// Gestion du menu Mobile
function toggleMenu() 
{
  const nav = document.getElementById("nav-menu");
  if (nav && window.innerWidth <= 768) {
    nav.classList.toggle("active");
  }
}

// Lancement au chargement
window.addEventListener('load', loadResults);

// Effet Glitch & Souris
document.addEventListener('mousemove', (e) => {
  const moveX = (e.clientX - window.innerWidth / 2) / 50;
  const moveY = (e.clientY - window.innerHeight / 2) / 50;
  const title = document.querySelector('.glitch-title');
  if(title) {
    title.style.transform = `translate(${-moveX}px, ${-moveY}px)`;
  }
});