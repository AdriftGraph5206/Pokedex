async function pokedex() {
     const postElement = document.getElementById("container")
    const postsElement = document.createElement("div")
    
    let html = ""

    for(let i = 1; i <= 9 ; i++){ 
        let random = 1 + Math.floor(Math.random() * 1000)
    console.log("Random: " + random)

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)
    const data = await res.json()

    
   
    
    
    let typesHTML = "";

if (data.types.length === 1) {
    typesHTML = `<div class="${data.types[0].type.name}">${data.types[0].type.name}</div>`;
} else if (data.types.length === 2) {
    typesHTML = `
        <div class="${data.types[0].type.name}">${data.types[0].type.name}</div> <div class="${data.types[1].type.name}">${data.types[1].type.name}</div>
        
    `;
} else {
    console.log("types error");
}
        
        html += `
        <div class="card${i}">
    <h1>${data.name}</h1>
    <img src=${data.sprites.front_default}>
    ${typesHTML}
    </div>
    `
    }
    postElement.appendChild(postsElement)

    
postElement.innerHTML = html
console.log()
}

pokedex()

