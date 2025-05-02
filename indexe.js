const fetchData = async () => {
    const res = await fetch('https://api.example.com/data', {
      headers: { Authorization: 'Bearer your_token_here' }
    });
    const data = await res.json();
    console.log(data);
  };
  
  fetchData();
  