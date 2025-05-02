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
  // Log request details for debugging
  console.log('Request details:', {
    path: event.path,
    httpMethod: event.httpMethod,
    queryParams: event.queryStringParameters,
    envVars: {
      baseId: process.env.AIRTABLE_BASE_ID ? 'Set' : 'Not set',
      tableName: process.env.AIRTABLE_TABLE_NAME ? 'Set' : 'Not set',
      apiKey: process.env.AIRTABLE_API_KEY ? 'Set (value hidden)' : 'Not set'
    }
  });

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
    const tableName = event.queryStringParameters?.table || process.env.AIRTABLE_TABLE_NAME;
    
    console.log('Attempting to fetch from table:', tableName);
    
    if (!tableName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Table name is required',
          message: 'Please set AIRTABLE_TABLE_NAME environment variable or provide table query parameter'
        }),
      };
    }

    // Fetch records from Airtable
    console.log('Fetching records from Airtable...');
    const records = await base(tableName)
      .select({
        // You can add view, filterByFormula, etc. here
        // Example: view: 'Grid view',
        maxRecords: 10, // Limit to 10 records for testing
      })
      .all();
    
    console.log(`Successfully fetched ${records.length} records`);
    
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
    console.error('Detailed Airtable error:', error.message);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch data from Airtable',
        message: error.message,
        details: {
          tableName: process.env.AIRTABLE_TABLE_NAME || 'Table name not set',
          baseId: process.env.AIRTABLE_BASE_ID || 'Base ID not set',
          // Don't include actual API key for security reasons
          apiKeyExists: !!process.env.AIRTABLE_API_KEY
        }
      }),
    };
  }
};
