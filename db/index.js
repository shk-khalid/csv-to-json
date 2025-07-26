const { createClient } = require('@supabase/supabase-js');

class Database {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async testConnection() {
    try {
      const { error } = await this.supabase
        .from('users')
        .select('id', { head: true });
      if (error && error.code !== 'PGRST116') throw error;
    } catch (err) {
      throw new Error(`Connection failed: ${err.message}`);
    }
  }

  async createUsersTable() {
    try {
      const { error } = await this.supabase
        .from('users')
        .select('id', { head: true });
      if (error && error.code === 'PGRST116') {
        console.warn('Users table missing. Run SQL migration in Supabase.');
      }
    } catch {
      console.warn('Ensure users table exists.');
    }
  }

  async clearUsers() {
    try {
      const { error, count } = await this.supabase
        .from('users')
        .delete()
        .neq('id', 0);
      if (error) throw error;
      return count || 0;
    } catch (err) {
      throw new Error(`Clear failed: ${err.message}`);
    }
  }

  async insertUsers(users) {
    if (!users.length) return 0;
    try {
      const payload = users.map(u => ({
        name: u.name,
        age: u.age,
        address: u.address,
        additional_info: u.additional_info
      }));
      const { data, error } = await this.supabase
        .from('users')
        .insert(payload)
        .select();
      if (error) throw error;
      return data.length;
    } catch (err) {
      throw new Error(`Insert failed: ${err.message}`);
    }
  }

  async calculateAgeDistribution() {
    try {
      const { data: users, error } = await this.supabase
        .from('users')
        .select('age');
      if (error) throw error;
      const dist = { under20: 0, between20And40: 0, between40And60: 0, over60: 0, total: 0 };
      users.forEach(({ age }) => {
        if (age < 20) dist.under20++;
        else if (age <= 40) dist.between20And40++;
        else if (age <= 60) dist.between40And60++;
        else dist.over60++;
        dist.total++;
      });
      return dist;
    } catch (err) {
      throw new Error(`Distribution failed: ${err.message}`);
    }
  }

  async getAllUsers() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('id');
      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(`Fetch failed: ${err.message}`);
    }
  }

  async closeConnection() {
    console.log('Connection closed');
  }
}

module.exports = new Database();
