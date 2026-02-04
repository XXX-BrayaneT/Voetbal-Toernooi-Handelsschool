// 1. URL UNIQUE ET PROPRE
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOtQtTcwjo6nFgsmePng4QeoJNrylen5dJ1_6EcXJSZ0cppXnBdQAHC5uotPp7e0KKSw/exec"; 

let playerCount = 0;           
const maxPlayers = 6;           
const maxReserves = 2;      

function addPlayer() {
  if (playerCount >= maxPlayers) {
    alert("Je team mag maximum 6 extra spelers hebben.");
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
      <button type="button" onclick="removePlayer(this)" style="background:var(--danger); color:white; border:none; border-radius:8px; cursor:pointer;">❌</button>
    </div>
  `;
  container.appendChild(div);
  playerCount++;
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

function removePlayer(button) {
  button.closest(".player").remove();
  playerCount--;
}

// --- ENVOI DU FORMULAIRE ---
const form = document.getElementById('teamForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerText = "Bezig...";

  const playersData = [];
  document.querySelectorAll('.player').forEach(div => {
    playersData.push({
      naam: div.querySelector('.p-naam').value,
      voornaam: div.querySelector('.p-voor').value,
      klas: div.querySelector('.p-klas').value,
      role: div.querySelector('.p-role').value
    });
  });

  const dataToSend = {
    teamName: document.getElementById('TeamNaam').value,
    email: document.getElementById('KapiteinEmail').value,
    capName: document.getElementById('KapiteinNaam').value,
    capFirstName: document.getElementById('KapiteinVoornaam').value,
    capClass: document.getElementById('KapiteinKlas').value,
    players: playersData
  };

  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(dataToSend)
  })
  .then(() => {
    alert("✅ Inschrijving geslaagd!");
    form.reset();
    document.getElementById("players").innerHTML = "";
    playerCount = 0;
    submitBtn.disabled = false;
    submitBtn.innerText = "Team inschrijven";
    // On recharge les résultats pour voir la nouvelle équipe (avec des 0)
    loadResults(); 
  })
  .catch(error => {
    console.error('Fout!', error);
    submitBtn.disabled = false;
  });
});

// --- LECTURE DES RÉSULTATS ---
async function loadResults() {
  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();

    const tableBody = document.querySelector("#resultaten table tbody");
    if (!tableBody) return;

    tableBody.innerHTML = ""; 

    if (!data || data.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='7'>Wachten op de eerste wedstrijden...</td></tr>";
      return;
    }

    data.forEach(row => {
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
  } catch (error) {
    console.error("Erreur de chargement :", error);
  }
}

function toggleMenu() {
  const nav = document.getElementById("nav-menu");
  // Si on est sur mobile (écran < 768px), on active/désactive la classe
  if (window.innerWidth <= 768) {
    nav.classList.toggle("active");
  }
}

// Lancer au chargement
window.addEventListener('load', loadResults);