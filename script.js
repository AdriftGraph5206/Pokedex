async function getPost() {
    let response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
    response = await response.json()
    console.log(response);
    console.log(response.title)
}

async function getPosts() {
    let response = await fetch('https://jsonplaceholder.typicode.com/posts')
    response = await response.json();
    return response;
}
async function getUsers() {
    let response = await fetch('https://jsonplaceholder.typicode.com/users')
    response = await response.json();
    return response;
}

function getUserByID(users, id) {
    return users.find(user => user.id == id);
}

window.onload = async () => {
    const posts = await getPosts();
    const users = await getUsers();



    const postsElement = document.querySelector(".posts");

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');

        const user = getUserByID(users, post.userId);

        postElement.innerHTML = `
            
            <p class="title">${post.title}</p>
            <pclass="post">${post.body}</p>
            <p class="user">${user.name}</p>
        `;
        postsElement.append(postElement);
    });
}