const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function buildQueryParams(params = {}) {
    const query = new URLSearchParams(params).toString()
    return query ? `?${query}` : ''
}

async function request(endpoint, method = 'GET',  token = null, data = null) {
    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'any-value'
    }

    if (token)
        headers['Authorization'] = `Bearer ${token}`
    
    const config = {
        method,
        headers
    }

    let url = `${BASE_URL}${endpoint}`;

    if (data && method !== 'GET')
        config.body = JSON.stringify(data)
    else if (data && method === 'GET')
        url += buildQueryParams(data)

    try {
        return await fetch(url, config)
    } catch (error) {
        console.error('API Error:', error.message)
        throw error
    }
}


export const api = {
    get: (endpoint, token = null, data = null) => request(endpoint, 'GET', token, data),
    post: (endpoint, token, data = null) => request(endpoint, 'POST', token, data),
    put: (endpoint, token, data = null) => request(endpoint, 'PUT', token, data),
    delete: (endpoint, token, data = null) => request(endpoint, 'DELETE', token, data)
};