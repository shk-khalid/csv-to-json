const { createClient } = require('@supabase/supabase-js');

class Database {
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
        throw error;
      }
    } catch (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
  }

  /**
   * Create users table if it doesn't exist
   * Note: In production, this should be handled via Supabase migrations
   */
  async createUsersTable() {
    try {
      // Check if table exists by trying to query it
      const { error } = await this.supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, but we can't create it via the client
        // In a real scenario, you'd run this SQL in Supabase SQL editor:
        console.log('⚠️  Users table may not exist. Please run this SQL in Supabase SQL editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  age INT NOT NULL,
  address JSONB,
  additional_info JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for service role
CREATE POLICY "Allow all operations for service role" ON public.users
FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_age ON public.users(age);
CREATE INDEX IF NOT EXISTS idx_users_address ON public.users USING GIN(address);
CREATE INDEX IF NOT EXISTS idx_users_additional_info ON public.users USING GIN(additional_info);
        `);
      }
    } catch (error) {
      console.warn('Note: Please ensure the users table exists in Supabase');
    }
  }

  /**
   * Clear all users from the table
   */
  async clearUsers() {
    try {
      const { error, count } = await this.supabase
        .from('users')
        .delete()
        .neq('id', 0); // Delete all records

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      throw new Error(`Failed to clear users: ${error.message}`);
    }
  }

  /**
   * Insert multiple users into the database
   */
  async insertUsers(users) {
    if (!users || users.length === 0) {
      return 0;
    }

    try {
      // Prepare data for insertion
      const usersData = users.map(user => ({
        name: user.name,
        age: user.age,
        address: user.address,
        additional_info: user.additional_info
      }));

      const { data, error } = await this.supabase
        .from('users')
        .insert(usersData)
        .select();

      if (error) {
        throw error;
      }

      return data ? data.length : 0;
    } catch (error) {
      throw new Error(`Failed to insert users: ${error.message}`);
    }
  }

  /**
   * Calculate age distribution using Supabase
   */
  async calculateAgeDistribution() {
    try {
      // Get all users to calculate distribution
      const { data: users, error } = await this.supabase
        .from('users')
        .select('age');

      if (error) {
        throw error;
      }

      if (!users || users.length === 0) {
        return {
          under20: 0,
          between20And40: 0,
          between40And60: 0,
          over60: 0,
          total: 0
        };
      }

      // Calculate distribution
      const distribution = users.reduce((acc, user) => {
        const age = user.age;
        
        if (age < 20) {
          acc.under20++;
        } else if (age >= 20 && age <= 40) {
          acc.between20And40++;
        } else if (age > 40 && age <= 60) {
          acc.between40And60++;
        } else if (age > 60) {
          acc.over60++;
        }
        
        acc.total++;
        return acc;
      }, {
        under20: 0,
        between20And40: 0,
        between40And60: 0,
        over60: 0,
        total: 0
      });

      return distribution;
    } catch (error) {
      throw new Error(`Failed to calculate age distribution: ${error.message}`);
    }
  }

  /**
   * Get all users (for debugging purposes)
   */
  async getAllUsers() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('id');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Close database connection (not needed for Supabase)
   */
  async closeConnection() {
    // Supabase handles connections automatically
    console.log('✅ Supabase connection closed');
  }
}

module.exports = new Database();