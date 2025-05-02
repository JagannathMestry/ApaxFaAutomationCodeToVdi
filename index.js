const https = require('https');

module.exports = async function (context, req) {
    context.log('Function started: testing GET request with built-in https');

    const url = '';
    const token = ' ';  // Replace with your actual token

    const fetchData = (url, token) => {
        return new Promise((resolve, reject) => {
         
            const options = {
                headers: {
                    'Content-Type':'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            https.get(url, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject(err);
                    }
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    };

    try {
        const data = await fetchData(url, token);

        context.res = {
            status: 200,
            body: {
                message: "GET request successful using built-in https.",
                data: data
            }
        };
    } catch (error) {
        context.log('Request failed:', error.message);

        context.res = {
            status: 500,
            body: {
                message: "GET request failed.",
                error: error.message
            }
        };
    }
};
