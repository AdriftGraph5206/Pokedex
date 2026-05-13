let pokemons = [];

async function pokedex() {
  const container = document.getElementById('container');
  const open = document.getElementById('open');
  container.innerHTML = 'Loading Pokémon...';

  const max = 1025;
  const requests = [];
  for (let i = 1; i <= max; i++) {
    requests.push(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(r => r.json()).catch(() => null));
  }

  const results = await Promise.all(requests);
  pokemons = results.filter(Boolean);
  renderPokemons(pokemons);
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
      <div class="card" data-name="${data.name}" data-id="${data.id}" ')">
        <h1>${data.name}</h1>
        <p>${data.id}</p>
        ${img ? `<img src="${img}" alt="${data.name}">` : ''}
        <div class="types">${typesHTML}</div>
      </div>
    `;

  }).join('');

  container.innerHTML = html;
}
//     let html1 = function openasd(datas) {
//       const open = document.getElementById('open');
//       open.style.backgroundColor = 'red';
//       open.style.zIndex = 2;
//       console.log(datas)
//       return `
//       <h1>${datas}</h1>
//       `

    
// }

// console.log(html1())
// open.innerHTML = html1();

function search() {
  const q = document.getElementById('search1').value.toLowerCase().trim();
  const cards = document.querySelectorAll('#container .card');
  if (!q) {
    cards.forEach(c => c.style.display = '');
    return;
  }

  cards.forEach(c => {
    const name = c.dataset.name.toLowerCase();
    const id = String(c.dataset.id);
    const match = name.includes(q) || id.startsWith(q);
    c.style.display = match ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search1');
  const btn = document.getElementById('searchBtn');
  if (input) input.addEventListener('input', search);
  if (btn) btn.addEventListener('click', search);
  pokedex();
});
