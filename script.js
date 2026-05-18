let pokemons = [];
const MAX_POKEMON = 1350;
const PER_PAGE = 20;
let currentPage = 1;
const totalPages = Math.ceil(MAX_POKEMON / PER_PAGE);
const pagesCache = {}; // pageNumber -> array of pokemon data
const pokemonsMap = {}; // id -> pokemon data
const evolutionSpriteCache = {}; // species name -> sprite url
let allPokemonList = []; // complete list of all pokemon {id, name}

function getFlavorText(speciesData) {
  if (!speciesData || !speciesData.flavor_text_entries) return '';
  const englishEntry = speciesData.flavor_text_entries.find(e => e.language.name === 'en');
  return englishEntry ? englishEntry.flavor_text.replace(/\n/g, ' ') : '';
}

async function getEvolutionSprite(speciesName) {
  const key = String(speciesName || '').toLowerCase();
  if (!key) return '';
  if (evolutionSpriteCache[key]) return evolutionSpriteCache[key];

  const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${key}`)
    .then(r => r.ok ? r.json() : null)
    .catch(() => null);

  const sprite = pokemonData?.sprites?.front_default || '';
  evolutionSpriteCache[key] = sprite;
  return sprite;
}

async function loadAllPokemonList() {
  // Load a lightweight list of all Pokémon for global search
  if (allPokemonList.length > 0) return;
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON}`);
    const data = await response.json();
    allPokemonList = data.results.map((p, idx) => ({
      id: idx + 1,
      name: p.name
    }));
  } catch (e) {
    console.error('Failed to load Pokémon list:', e);
  }
}

async function pokedex() {
  // load the first page on start and the full pokemon list
  await loadAllPokemonList();
  await loadPage(1);
}

async function loadPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  const container = document.getElementById('container');
  const startId = (page - 1) * PER_PAGE + 1;
  const endId = Math.min(page * PER_PAGE, MAX_POKEMON);

  if (pagesCache[page]) {
    renderPokemons(pagesCache[page]);
    updatePagination();
    return;
  }

  container.innerHTML = 'Loading Pokémon...';
  const pokemonRequests = [];
  const speciesRequests = [];
  for (let i = startId; i <= endId; i++) {
    pokemonRequests.push(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(r => r.ok ? r.json() : null).catch(() => null));
    speciesRequests.push(fetch(`https://pokeapi.co/api/v2/pokemon-species/${i}`).then(r => r.ok ? r.json() : null).catch(() => null));
  }

  const results = await Promise.all(pokemonRequests);
  const species = await Promise.all(speciesRequests);
  const list = results.map((pokemon, idx) => {
    if (!pokemon) return null;
    const color = species[idx]?.color?.name || 'default';
    const flavorText = getFlavorText(species[idx]);
    const merged = { ...pokemon, color, flavor_text: flavorText };
    pokemonsMap[merged.id] = merged;
    return merged;
  }).filter(Boolean);

  pagesCache[page] = list;
  renderPokemons(list);
  updatePagination();
}

async function renderEvolutionChain(node) {
  if (!node) return '';

  const speciesName = node.species?.name || 'Unknown';
  const sprite = await getEvolutionSprite(speciesName);
  
  // Fetch Pokemon by species name to get ID for clickability
  const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesName}`)
    .then(r => r.ok ? r.json() : null)
    .catch(() => null);
  const pokemonId = pokemonData?.id || '';
  const onclickAttr = pokemonId ? `onclick="openasd(${pokemonId})" style="cursor: pointer;"` : '';
  
  let html = `
    <div class="evolution-stage" ${onclickAttr}>
      ${sprite ? `<img class="evolution-sprite" src="${sprite}" alt="${speciesName}">` : ''}
      <p>${speciesName}</p>
    </div>
  `;
  if (node.evolves_to && node.evolves_to.length > 0) {
    html += '<div class="evolution-branch">';
    for (const nextNode of node.evolves_to) {
      html += '<div class="evolution-path">';
      html += '<div class="evolution-arrow">→</div>';
      html += await renderEvolutionChain(nextNode);
      html += '</div>';
    }
    html += '</div>';
  }

  return html;
}

function renderPokemons(list) {
  const container = document.getElementById('container');
  if (!list || list.length === 0) {
    container.innerHTML = 'No Pokémon found.';
    return;
  }

  const html = list.map(data => {
    const typesHTML = data.types.map(t => `<div class="${t.type.name}">${t.type.name}</div>`).join(' ');
    const img = data.sprites && data.sprites.front_default ? data.sprites.front_default : '';
    return `
      <div class="card" data-name="${data.name}" data-id="${data.id}" onclick="openasd(${data.id})" style="background-color: ${data.color}">
        <h1>${data.name}</h1>
        <p>${data.id}</p>
        ${img ? `<img src="${img}" alt="${data.name}">` : ''}
        <div class="types">${typesHTML}</div>
      </div>
    `;

  }).join('');

  container.innerHTML = html;
}

async function openasd(id) {
  let datas = pokemonsMap[Number(id)];
  if (!datas || !datas.evolution) {
    const p = datas || await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.ok ? r.json() : null).catch(() => null);
    const s = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then(r => r.ok ? r.json() : null).catch(() => null);
    if (!p) return;
    const color = datas?.color || s?.color?.name || 'default';
    const flavorText = datas?.flavor_text || getFlavorText(s);
    const evolutionUrl = s?.evolution_chain?.url;
    const evolution = evolutionUrl
      ? await fetch(evolutionUrl).then(r => r.ok ? r.json() : null).catch(() => null)
      : null;
    datas = { ...p, color, flavor_text: flavorText, evolution: evolution?.chain || datas?.evolution || null };
    pokemonsMap[datas.id] = datas;
  }
  const open = document.getElementById('open');
  const img = datas.sprites && datas.sprites.front_default ? datas.sprites.front_default : '';
  const typesHTML = datas.types.map(t => `<div class="${t.type.name}">${t.type.name}</div>`).join(' ');
  const evolutionHTML = datas.evolution ? await renderEvolutionChain(datas.evolution) : '<p>No evolution data.</p>';
  open.style.backgroundColor = 'rgba(15, 23, 33, 0.9)';
  open.style.zIndex = 2;
  open.style.display = 'flex';
  open.innerHTML = `
    <div class="detail-card">
      <div class="detail-header">
        <div>
          <h1>${datas.name}</h1>
          <p class="pokemon-id">#${datas.id}</p>
        </div>
        ${img ? `<img class="pokemon-image" src="${img}" alt="${datas.name}">` : ''}
        <button id="closeBtn" class="close-btn">✕</button>
      </div>
      <p class="flavor-text">${datas.flavor_text}</p>
      <div class="types detail-types">${typesHTML}</div>
      <div class="stats">
        <p>hp: ${datas.stats[0].base_stat}</p>
        <p>attack: ${datas.stats[1].base_stat}</p>
        <p>defense: ${datas.stats[2].base_stat}</p>
        <p>special-attack: ${datas.stats[3].base_stat}</p>
        <p>special-defense: ${datas.stats[4].base_stat}</p>
        <p>speed: ${datas.stats[5].base_stat}</p>
      </div>
      <div class="evolution">
        <h2>Evolution Chain</h2>
        ${evolutionHTML}
      </div>
    </div>
  `;
}

async function search() {
  const q = document.getElementById('search1').value.toLowerCase().trim();
  if (!q) {
    // Show current page if no search
    if (pagesCache[currentPage]) {
      renderPokemons(pagesCache[currentPage]);
    }
    return;
  }

  // Find all matches across all Pokémon
  const matches = allPokemonList.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(q);
    const idMatch = String(p.id).startsWith(q);
    return nameMatch || idMatch;
  });

  if (matches.length === 0) {
    document.getElementById('container').innerHTML = 'No Pokémon found.';
    return;
  }

  // Load pages containing matches and render them
  const matchedPokemon = [];
  const pagesToLoad = new Set();
  
  matches.forEach(m => {
    const pageNum = Math.ceil(m.id / PER_PAGE);
    pagesToLoad.add(pageNum);
  });

  // Load all required pages
  for (const page of pagesToLoad) {
    if (!pagesCache[page]) {
      await loadPage(page);
    } else {
      matchedPokemon.push(...pagesCache[page]);
    }
  }

  // Filter and render matched Pokémon
  const filtered = allPokemonList
    .filter(p => matches.some(m => m.id === p.id))
    .map(p => pokemonsMap[p.id])
    .filter(Boolean);

  if (filtered.length > 0) {
    renderPokemons(filtered);
  } else {
    document.getElementById('container').innerHTML = 'No Pokémon found.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search1');
  const btn = document.getElementById('searchBtn');
  if (input) input.addEventListener('input', search);
  if (btn) btn.addEventListener('click', search);
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  if (prev) prev.addEventListener('click', () => loadPage(currentPage - 1));
  if (next) next.addEventListener('click', () => loadPage(currentPage + 1));
  
  // Page input handler
  const pageInput = document.getElementById('pageInput');
  if (pageInput) {
    pageInput.addEventListener('change', (e) => {
      const page = parseInt(e.target.value, 10);
      if (page >= 1 && page <= totalPages) {
        loadPage(page);
      } else {
        e.target.value = currentPage;
      }
    });
  }
  
  // Random button handler
  const randomBtn = document.getElementById('randomBtn');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      const randomId = Math.floor(Math.random() * MAX_POKEMON) + 1;
      openasd(randomId);
    });
  }
  
  // Close button handler
  document.addEventListener('click', (e) => {
    if (e.target.id === 'closeBtn') {
      const open = document.getElementById('open');
      open.style.display = 'none';
    }
  });
  
  pokedex();
  updatePagination();
});

function updatePagination() {
  const pageInput = document.getElementById('pageInput');
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  if (pageInput) pageInput.value = currentPage;
  if (prev) prev.disabled = currentPage <= 1;
  if (next) next.disabled = currentPage >= totalPages;
}
