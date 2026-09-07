/**
 * Database Configuration
 * 
 * This file handles all database-related configuration and setup.
 * It initializes the Supabase client and provides database utilities.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Test database connection
 * @returns {Promise<Object>} Connection status
 */
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      message: 'Database connection successful',
      data: data
    };
  } catch (error) {
    return {
      success: false,
      message: 'Database connection failed',
      error: error.message
    };
  }
};

/**
 * Get all users (for debugging)
 * @returns {Promise<Object>} Users data
 */
const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  supabase,
  testConnection,
  getAllUsers
};
