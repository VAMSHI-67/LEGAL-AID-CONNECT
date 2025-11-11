const express = require('express');
const axios = require('axios');

const router = express.Router();

// POST /api/ml-match
// Forwards payload to the Flask ML service and returns its response
router.post('/', async (req, res) => {
  const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000/predict_match';
  try {
    const response = await axios.post(mlServiceUrl, req.body, { timeout: 5000 });
    return res.json({ success: true, data: response.data });
  } catch (error) {
    const status = error.response?.status || 502;
    const message = error.response?.data || error.message || 'ML service unavailable';
    return res.status(status).json({ success: false, message });
  }
});

module.exports = router;


