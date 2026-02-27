const express = require('express');
const router = express.Router();

/**
 * @route   POST /api/food/search
 * @desc    Returns a message that food search is currently unavailable
 * @access  Public
 */
router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Return a message indicating the service is no longer available
        const response = `عذراً، خدمة البحث عن معلومات الطعام غير متاحة حالياً. يمكنك استخدام المساعد الذكي للحصول على معلومات عامة عن ${query}.`;

        res.json({ details: response });

    } catch (error) {
        console.error('Error in /api/food/search:', error.message);
        res.status(500).json({ error: 'Failed to process food search request' });
    }
});

module.exports = router;