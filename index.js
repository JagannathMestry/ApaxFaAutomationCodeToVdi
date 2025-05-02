const fetch = require('node-fetch');

module.exports = async function (context, req) {
  try {
    const res = await fetch('https://api.example.com/data', {
      headers: {
        Authorization: 'Bearer your_token_here'
      }
    });

    if (!res.ok) {
      throw new Error(`API call failed with status ${res.status}`);
    }

    const data = await res.json();

    context.res = {
      status: 200,
      body: data
    };
  } catch (error) {
    context.log.error('Fetch failed:', error);
    context.res = {
      status: 500,
      body: 'Failed to fetch data from external API.'
    };
  }
};
