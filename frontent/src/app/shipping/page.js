import axios from 'axios';

/**
 * Calls /api/shipping/check
 * @param {string} pincode
 * @param {number} orderValue
 * @param {number} totalWeightKg
 * @returns {Promise<Object>}
 */
export async function checkShipping(pincode, orderValue, totalWeightKg) {
  try {
    const response = await axios.post('http://localhost:9090/api/user/check', {
      pincode,
      orderValue,
      items: [], // Not used here — weight pre-calculated in frontend
      totalWeightKg, // include this if backend expects it
    });

    const data = response.data; // axios auto-parses JSON

    if (!data.success) {
      throw new Error(data.message || 'Failed to calculate shipping');
    }

    return data;
  } catch (error) {
    // Catch both network and server errors
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Failed to calculate shipping'
    );
  }
}
