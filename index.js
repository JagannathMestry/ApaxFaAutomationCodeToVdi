// Add custom handling for specific status codes
if (response.status === 401) {
    return {
        status: 401,
        jsonBody: { error: 'Unauthorized: Invalid credentials.' }
    };
}

if (response.status === 404) {
    return {
        status: 404,
        jsonBody: { error: 'Not Found: Authentication service endpoint not found.' }
    };
}

if (!response.ok) {
    return {
        status: response.status,
        jsonBody: { error: `Unexpected error with status ${response.status}`, details: data }
    };
}
