
import axios from 'axios';
import 'dotenv/config';

async function check() {
    const key = process.env.JUPITER_API_KEY;
    console.log('JUPITER_API_KEY loaded:', key ? `${key.substring(0, 4)}...${key.substring(key.length-4)}` : 'undefined');

    const url = 'https://api.jup.ag/tokens/v2/tag?query=verified';
    console.log(`Requesting ${url}...`);

    try {
        const response = await axios.get(url, {
            headers: {
                'x-api-key': key || '',
                'Accept': 'application/json'
            }
        });
        console.log('Response Status:', response.status);
        console.log('Data Type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
        if (Array.isArray(response.data)) {
            console.log('Items:', response.data.length);
            if (response.data.length > 0) {
                console.log('Sample keys:', Object.keys(response.data[0]));
            }
        }
    } catch (error: any) {
        console.error('Request Failed:', error.response?.status, error.response?.statusText);
        if (error.response?.data) {
             console.error('Error Body:', error.response.data);
        } else {
             console.error('Error Details:', error.message);
        }
    }
}

check();
