import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = 'FridgeApp.db';
const database_version = '1.0';
const database_displayname = 'Fridge Scanner Database';
const database_size = 200000;

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async initDB() {
    try {
      this.db = await SQLite.openDatabase(
        database_name,
        database_version,
        database_displayname,
        database_size
      );
      console.log('Database opened successfully');
      await this.createTables();
      return this.db;
    } catch (error) {
      console.error('Error opening database:', error);
      throw error;
    }
  }

  async createTables() {
    // User Profile Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        age INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Allergens Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS allergens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        allergen_name TEXT NOT NULL,
        severity TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
      );
    `);

    // Food Preferences Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS food_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        food_item TEXT NOT NULL,
        preference_type TEXT NOT NULL CHECK(preference_type IN ('like', 'dislike')),
        intensity INTEGER DEFAULT 5,
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
      );
    `);

    // Diseases Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS diseases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        disease_name TEXT NOT NULL,
        dietary_restrictions TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
      );
    `);

    // Products Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT UNIQUE NOT NULL,
        product_name TEXT NOT NULL,
        brand TEXT,
        category TEXT,
        ingredients TEXT,
        allergens TEXT,
        nutrition_data TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Fridge Inventory Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS fridge_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        barcode TEXT NOT NULL,
        scan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiry_date DATE,
        quantity INTEGER DEFAULT 1,
        location TEXT DEFAULT 'main',
        status TEXT DEFAULT 'fresh' CHECK(status IN ('fresh', 'near_expiry', 'expired', 'consumed')),
        consumed_date DATETIME,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    // Recipes Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_name TEXT NOT NULL,
        source TEXT,
        ingredients TEXT NOT NULL,
        instructions TEXT,
        cooking_time INTEGER,
        difficulty TEXT,
        cuisine_type TEXT,
        image_url TEXT,
        rating REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User Interactions Table (for ML learning)
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS user_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        interaction_type TEXT NOT NULL,
        product_id INTEGER,
        recipe_id INTEGER,
        action TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        context TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profile(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
      );
    `);

    // Recommendations Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        recipe_id INTEGER,
        recommendation_score REAL,
        reason TEXT,
        shown_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_response TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profile(id),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
      );
    `);

    // Notifications History Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS notifications_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_id INTEGER,
        notification_type TEXT NOT NULL,
        message TEXT NOT NULL,
        sent_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        acknowledged BOOLEAN DEFAULT 0,
        FOREIGN KEY (inventory_id) REFERENCES fridge_inventory(id)
      );
    `);

    console.log('All tables created successfully');
  }

  // User Profile Methods
  async createUserProfile(age) {
    const result = await this.db.executeSql(
      'INSERT INTO user_profile (age) VALUES (?)',
      [age]
    );
    return result[0].insertId;
  }

  async getUserProfile() {
    const results = await this.db.executeSql('SELECT * FROM user_profile LIMIT 1');
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
  }

  async updateUserProfile(userId, age) {
    await this.db.executeSql(
      'UPDATE user_profile SET age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [age, userId]
    );
  }

  // Allergen Methods
  async addAllergen(userId, allergenName, severity) {
    const result = await this.db.executeSql(
      'INSERT INTO allergens (user_id, allergen_name, severity) VALUES (?, ?, ?)',
      [userId, allergenName, severity]
    );
    return result[0].insertId;
  }

  async getAllergens(userId) {
    const results = await this.db.executeSql(
      'SELECT * FROM allergens WHERE user_id = ?',
      [userId]
    );
    return this.resultsToArray(results);
  }

  async deleteAllergen(allergenId) {
    await this.db.executeSql('DELETE FROM allergens WHERE id = ?', [allergenId]);
  }

  // Food Preferences Methods
  async addFoodPreference(userId, foodItem, preferenceType, intensity = 5) {
    const result = await this.db.executeSql(
      'INSERT INTO food_preferences (user_id, food_item, preference_type, intensity) VALUES (?, ?, ?, ?)',
      [userId, foodItem, preferenceType, intensity]
    );
    return result[0].insertId;
  }

  async getFoodPreferences(userId) {
    const results = await this.db.executeSql(
      'SELECT * FROM food_preferences WHERE user_id = ?',
      [userId]
    );
    return this.resultsToArray(results);
  }

  // Disease Methods
  async addDisease(userId, diseaseName, dietaryRestrictions) {
    const result = await this.db.executeSql(
      'INSERT INTO diseases (user_id, disease_name, dietary_restrictions) VALUES (?, ?, ?)',
      [userId, diseaseName, dietaryRestrictions]
    );
    return result[0].insertId;
  }

  async getDiseases(userId) {
    const results = await this.db.executeSql(
      'SELECT * FROM diseases WHERE user_id = ?',
      [userId]
    );
    return this.resultsToArray(results);
  }

  // Product Methods
  async addProduct(productData) {
    const { barcode, product_name, brand, category, ingredients, allergens, nutrition_data, image_url } = productData;

    try {
      const result = await this.db.executeSql(
        `INSERT OR REPLACE INTO products
        (barcode, product_name, brand, category, ingredients, allergens, nutrition_data, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [barcode, product_name, brand, category, ingredients, allergens, nutrition_data, image_url]
      );
      return result[0].insertId;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  async getProductByBarcode(barcode) {
    const results = await this.db.executeSql(
      'SELECT * FROM products WHERE barcode = ?',
      [barcode]
    );
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
  }

  // Fridge Inventory Methods
  async addToFridge(productId, barcode, expiryDate = null, quantity = 1) {
    const result = await this.db.executeSql(
      'INSERT INTO fridge_inventory (product_id, barcode, expiry_date, quantity) VALUES (?, ?, ?, ?)',
      [productId, barcode, expiryDate, quantity]
    );
    return result[0].insertId;
  }

  async getFridgeInventory() {
    const results = await this.db.executeSql(`
      SELECT
        fi.id,
        fi.product_id,
        fi.barcode,
        fi.scan_date,
        fi.expiry_date,
        fi.quantity,
        fi.status,
        p.product_name,
        p.brand,
        p.category,
        p.image_url
      FROM fridge_inventory fi
      LEFT JOIN products p ON fi.product_id = p.id
      WHERE fi.status != 'consumed'
      ORDER BY fi.expiry_date ASC
    `);
    return this.resultsToArray(results);
  }

  async getExpiringProducts(daysThreshold = 3) {
    const results = await this.db.executeSql(`
      SELECT
        fi.id,
        fi.expiry_date,
        fi.quantity,
        p.product_name,
        p.brand
      FROM fridge_inventory fi
      LEFT JOIN products p ON fi.product_id = p.id
      WHERE fi.status = 'fresh'
      AND fi.expiry_date IS NOT NULL
      AND julianday(fi.expiry_date) - julianday('now') <= ?
      AND julianday(fi.expiry_date) - julianday('now') >= 0
    `, [daysThreshold]);
    return this.resultsToArray(results);
  }

  async updateInventoryStatus(inventoryId, status) {
    await this.db.executeSql(
      'UPDATE fridge_inventory SET status = ? WHERE id = ?',
      [status, inventoryId]
    );
  }

  async consumeProduct(inventoryId) {
    await this.db.executeSql(
      'UPDATE fridge_inventory SET status = ?, consumed_date = CURRENT_TIMESTAMP WHERE id = ?',
      ['consumed', inventoryId]
    );
  }

  // Recipe Methods
  async addRecipe(recipeData) {
    const { recipe_name, source, ingredients, instructions, cooking_time, difficulty, cuisine_type, image_url } = recipeData;
    const result = await this.db.executeSql(
      `INSERT INTO recipes
      (recipe_name, source, ingredients, instructions, cooking_time, difficulty, cuisine_type, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [recipe_name, source, ingredients, instructions, cooking_time, difficulty, cuisine_type, image_url]
    );
    return result[0].insertId;
  }

  async getRecipes() {
    const results = await this.db.executeSql('SELECT * FROM recipes ORDER BY rating DESC');
    return this.resultsToArray(results);
  }

  async getRecipeById(recipeId) {
    const results = await this.db.executeSql('SELECT * FROM recipes WHERE id = ?', [recipeId]);
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
  }

  // User Interaction Methods (for ML)
  async logInteraction(userId, interactionType, action, productId = null, recipeId = null, context = null) {
    await this.db.executeSql(
      `INSERT INTO user_interactions
      (user_id, interaction_type, product_id, recipe_id, action, context)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, interactionType, productId, recipeId, action, context]
    );
  }

  async getUserInteractions(userId, limit = 100) {
    const results = await this.db.executeSql(
      'SELECT * FROM user_interactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );
    return this.resultsToArray(results);
  }

  // Recommendations Methods
  async saveRecommendation(userId, recipeId, score, reason) {
    const result = await this.db.executeSql(
      'INSERT INTO recommendations (user_id, recipe_id, recommendation_score, reason) VALUES (?, ?, ?, ?)',
      [userId, recipeId, score, reason]
    );
    return result[0].insertId;
  }

  async getRecommendations(userId) {
    const results = await this.db.executeSql(`
      SELECT
        r.id,
        r.recommendation_score,
        r.reason,
        r.shown_date,
        rec.recipe_name,
        rec.ingredients,
        rec.cooking_time,
        rec.difficulty,
        rec.image_url
      FROM recommendations r
      LEFT JOIN recipes rec ON r.recipe_id = rec.id
      WHERE r.user_id = ?
      ORDER BY r.recommendation_score DESC
      LIMIT 10
    `, [userId]);
    return this.resultsToArray(results);
  }

  // Notification Methods
  async logNotification(inventoryId, notificationType, message) {
    await this.db.executeSql(
      'INSERT INTO notifications_history (inventory_id, notification_type, message) VALUES (?, ?, ?)',
      [inventoryId, notificationType, message]
    );
  }

  async getNotificationHistory() {
    const results = await this.db.executeSql(
      'SELECT * FROM notifications_history ORDER BY sent_date DESC LIMIT 50'
    );
    return this.resultsToArray(results);
  }

  // Helper method to convert results to array
  resultsToArray(results) {
    const items = [];
    if (results[0] && results[0].rows) {
      for (let i = 0; i < results[0].rows.length; i++) {
        items.push(results[0].rows.item(i));
      }
    }
    return items;
  }

  async closeDatabase() {
    if (this.db) {
      await this.db.close();
      console.log('Database closed');
    }
  }
}

export default new DatabaseService();
