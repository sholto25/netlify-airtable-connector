const Airtable = require('airtable');
require('dotenv').config();

// Configure Airtable with environment variables
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

// Set CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*', // Restrict this to your Webflow site in production
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Successful preflight call' }),
    };
  }
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get table name from environment variable or query parameter
    const tableName = event.queryStringParameters.table || process.env.AIRTABLE_TABLE_NAME;
    
    if (!tableName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Table name is required' }),
      };
    }

    // Fetch records from Airtable
    const records = await base(tableName)
      .select({
        // You can add view, filterByFormula, etc. here
        // Example: view: 'Grid view',
        // Example: maxRecords: 100,
      })
      .all();
    
    // Transform records to a simpler format
    const formattedRecords = records.map(record => ({
      id: record.id,
      ...record.fields
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedRecords),
    };
  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch data from Airtable' }),
    };
  }
};
