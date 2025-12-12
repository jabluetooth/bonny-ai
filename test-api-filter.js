fetch('http://localhost:3000/api/projects?category=ai')
    .then(res => res.json())
    .then(data => {
        console.log('AI Projects:', data.length);
        data.forEach(p => console.log(' - ' + p.title));
    })
    .catch(err => console.error(err));

fetch('http://localhost:3000/api/projects?category=web')
    .then(res => res.json())
    .then(data => {
        console.log('Web Projects:', data.length);
        data.forEach(p => console.log(' - ' + p.title));
    })
    .catch(err => console.error(err));
