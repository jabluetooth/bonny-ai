fetch('http://localhost:3000/api/projects')
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(err => console.error('Fetch Failed:', err));
