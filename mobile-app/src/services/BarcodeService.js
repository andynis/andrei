import axios from 'axios';

class BarcodeService {
  constructor() {
    this.openFoodFactsAPI = 'https://world.openfoodfacts.org/api/v0/product';
    this.upcDatabaseAPI = 'https://api.upcdatabase.org/product';
  }

  /**
   * Fetch product information from OpenFoodFacts database
   * @param {string} barcode - The product barcode
   * @returns {object} Product information
   */
  async getProductInfo(barcode) {
    try {
      // Try OpenFoodFacts first (free and comprehensive)
      const response = await axios.get(`${this.openFoodFactsAPI}/${barcode}.json`);

      if (response.data.status === 1 && response.data.product) {
        const product = response.data.product;

        return {
          barcode: barcode,
          product_name: product.product_name || product.generic_name || 'Unknown Product',
          brand: product.brands || '',
          category: product.categories || '',
          ingredients: product.ingredients_text || '',
          allergens: product.allergens || '',
          nutrition_data: JSON.stringify({
            energy: product.nutriments?.energy,
            fat: product.nutriments?.fat,
            carbohydrates: product.nutriments?.carbohydrates,
            proteins: product.nutriments?.proteins,
            salt: product.nutriments?.salt,
            sugar: product.nutriments?.sugars,
          }),
          image_url: product.image_url || product.image_front_url || '',
          expiry_info: this.extractExpiryInfo(product),
        };
      }

      // If OpenFoodFacts doesn't have the product, return basic info
      return this.createBasicProductInfo(barcode);

    } catch (error) {
      console.error('Error fetching product info:', error);
      return this.createBasicProductInfo(barcode);
    }
  }

  /**
   * Extract expiry information from product data
   * @param {object} product - Product data
   * @returns {object} Expiry information
   */
  extractExpiryInfo(product) {
    // OpenFoodFacts doesn't provide exact expiry dates, but we can estimate based on category
    const category = product.categories?.toLowerCase() || '';

    // Default shelf life in days based on product category
    let estimatedShelfLife = 30; // Default 30 days

    if (category.includes('dairy') || category.includes('milk') || category.includes('yogurt')) {
      estimatedShelfLife = 7;
    } else if (category.includes('meat') || category.includes('fish') || category.includes('seafood')) {
      estimatedShelfLife = 3;
    } else if (category.includes('vegetable') || category.includes('fruit')) {
      estimatedShelfLife = 7;
    } else if (category.includes('bread') || category.includes('bakery')) {
      estimatedShelfLife = 5;
    } else if (category.includes('frozen')) {
      estimatedShelfLife = 90;
    } else if (category.includes('canned') || category.includes('preserved')) {
      estimatedShelfLife = 365;
    } else if (category.includes('beverage') || category.includes('drink')) {
      estimatedShelfLife = 180;
    }

    return {
      estimated_shelf_life_days: estimatedShelfLife,
      category_based: true,
    };
  }

  /**
   * Create basic product info when API doesn't have data
   * @param {string} barcode - Product barcode
   * @returns {object} Basic product information
   */
  createBasicProductInfo(barcode) {
    return {
      barcode: barcode,
      product_name: 'Unknown Product',
      brand: '',
      category: 'Uncategorized',
      ingredients: '',
      allergens: '',
      nutrition_data: JSON.stringify({}),
      image_url: '',
      expiry_info: {
        estimated_shelf_life_days: 30,
        category_based: true,
      },
    };
  }

  /**
   * Calculate expiry date based on scan date and shelf life
   * @param {Date} scanDate - Date when product was scanned
   * @param {number} shelfLifeDays - Estimated shelf life in days
   * @returns {Date} Estimated expiry date
   */
  calculateExpiryDate(scanDate, shelfLifeDays) {
    const expiryDate = new Date(scanDate);
    expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);
    return expiryDate;
  }

  /**
   * Check if product contains any user allergens
   * @param {object} product - Product information
   * @param {array} userAllergens - List of user's allergens
   * @returns {object} Allergen check results
   */
  checkAllergens(product, userAllergens) {
    const productAllergens = product.allergens.toLowerCase();
    const productIngredients = product.ingredients.toLowerCase();

    const foundAllergens = [];

    userAllergens.forEach(allergen => {
      const allergenName = allergen.allergen_name.toLowerCase();
      if (productAllergens.includes(allergenName) || productIngredients.includes(allergenName)) {
        foundAllergens.push(allergen);
      }
    });

    return {
      hasAllergens: foundAllergens.length > 0,
      allergens: foundAllergens,
    };
  }

  /**
   * Validate barcode format
   * @param {string} barcode - Barcode to validate
   * @returns {boolean} Whether barcode is valid
   */
  validateBarcode(barcode) {
    // EAN-13, UPC-A, EAN-8, UPC-E formats
    const validLengths = [8, 12, 13, 14];
    const isNumeric = /^\d+$/.test(barcode);

    return isNumeric && validLengths.includes(barcode.length);
  }
}

export default new BarcodeService();
