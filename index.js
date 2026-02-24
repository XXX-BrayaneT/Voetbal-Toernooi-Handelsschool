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
  if (playerCount >= maxExtraPlayers) {
    alert("Je team is compleet! (Max. 7 spelers inclusief kapitein)");
    return;
  }
  const container = document.getElementById("players");
  const div = document.createElement("div");
  div.className = "player";
  div.innerHTML = `
    <div class="grid">
      <input type="text" class="p-naam" placeholder="Naam speler" required>
      <input type="text" class="p-voor" placeholder="Voornaam" required>
      <input type="text" class="p-klas" placeholder="Klas" required>
      <select class="p-role" onchange="checkReserves(this)">
        <option value="Veldspeler">Veldspeler</option>
        <option value="Wissel">Wissel</option>
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

function checkReserves(select) {
  const allSelects = document.querySelectorAll(".p-role");
  let currentReserves = 0;
  allSelects.forEach(s => { if (s.value === "Wissel") currentReserves++; });
  if (currentReserves > maxReserves) {
    alert("Maximum 2 wisselspelers!");
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

    // Changement ici : On utilise une requête standard pour lire la réponse du script
    fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(dataToSend)
    })
    .then(res => res.json()) // On attend un JSON du script
    .then(response => {
      if (response.status === "success") {
        alert("✅ Inschrijving geslaagd!");
        form.reset();
        document.getElementById("players").innerHTML = "";
        playerCount = 0;
        updateCounter();
        loadResults(); 
      } else {
        // Affiche l'erreur de doublon envoyée par le Google Script
        alert("⚠️ " + response.message);
      }
    })
    .catch(error => {
      console.error('Fout!', error);
      // En cas de bug réseau, on prévient l'utilisateur
      alert("Er is een fout opgetreden. Controleer de tabel of probeer het opnieuw.");
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.innerText = "Team inschrijven";
    });
  });
}

// --- LECTURE DES RÉSULTATS ---
// --- LECTURE DES RÉSULTATS ET DES ÉQUIPES ---
async function loadResults() {
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

    // 2. Remplir la Section des Équipes et Joueurs
    const teamsContainer = document.getElementById("teams-container");
    if (teamsContainer) {
      teamsContainer.innerHTML = "";
      if (!data.teams || data.teams.length === 0) {
        teamsContainer.innerHTML = "<p>Nog geen teams ingeschreven.</p>";
      } else {
        data.teams.forEach(t => {
          // On crée la liste des joueurs
          let playersHTML = t.players.map(p => {
            let icon = p.rol === "Kapitein" ? "👑" : "⚽";
            return `<li>${icon} <strong>${p.voornaam} ${p.naam}</strong> <span style="color:#666; font-size:12px;">(${p.klas})</span></li>`;
          }).join("");
          
          // On crée la carte de l'équipe
          const teamCard = document.createElement("div");
          teamCard.className = "card"; // On réutilise ton design "card"
          teamCard.innerHTML = `
            <h3 style="color: var(--primary); border-bottom: 2px solid var(--accent); padding-bottom: 5px; margin-bottom: 10px;">🛡️ ${t.team}</h3>
            <ul style="list-style: none; padding-left: 0;">${playersHTML}</ul>
          `;
          teamsContainer.appendChild(teamCard);
        });
      }
    }

  } catch (error) {
    console.error("Fout bij laden :", error);
  }
}

function toggleMenu() {
  const nav = document.getElementById("nav-menu");
  if (window.innerWidth <= 768) {
    nav.classList.toggle("active");
  }
}

window.addEventListener('load', loadResults);