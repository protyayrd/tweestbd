require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5454;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

console.log('Starting server with environment:', process.env.NODE_ENV || 'development');
console.log('Client-side routing is enabled for slug routes');

app.listen(PORT, () => {
    console.log('Server is running on port:', PORT);
    console.log('Visit:', API_BASE_URL);
});
