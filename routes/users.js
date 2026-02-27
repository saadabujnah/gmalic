const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const auth = require('../middleware/auth');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user language preference
router.get('/language', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('users')
      .select('language')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ language: data?.language || 'system' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user language preference
router.put('/language', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { language } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ language })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ language: data.language });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
