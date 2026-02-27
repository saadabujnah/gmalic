const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MEAL_ANALYSIS_RULES } = require('./ai_rules');

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * @route   POST /api/ai/chat
 * @desc    Send a text message to the generative AI model
 * @access  Public
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // قواعد صارمة للمساعد الذكي
    let contextPrompt = MEAL_ANALYSIS_RULES;

    if (context && context.length > 0) {
        contextPrompt += '\n\nالمحادثة السابقة:\n';
        context.forEach(msg => {
            contextPrompt += `${msg.isUser ? "المستخدم" : "المساعد"}: ${msg.content}\n`;
        });
    }

    const prompt = `${contextPrompt}\n\nالسؤال الحالي: ${message}\n\nالرد:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

/**
 * @route   POST /api/ai/analyze-image
 * @desc    Send an image and prompt to the generative AI vision model
 * @access  Public
 */
router.post('/analyze-image', async (req, res) => {
    try {
        const { image, prompt } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const imagePart = {
            inlineData: {
                data: image,
                mimeType: 'image/jpeg'
            }
        };

        let analysisPrompt = MEAL_ANALYSIS_RULES;

        if (prompt) {
            analysisPrompt += `\n\nسؤال المستخدم: ${prompt}`;
        }

        const result = await model.generateContent([analysisPrompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        res.json({ analysis: text });

    } catch (error) {
        console.error('Error in /api/ai/analyze-image:', error);
        res.status(500).json({ error: 'Failed to analyze image' });
    }
});


/**
 * @route   POST /api/ai/analyze-meal
 * @desc    Analyze a meal image with user profile context
 * @access  Public
 */
router.post('/analyze-meal', async (req, res) => {
    try {
        const { image, context, prompt } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const imagePart = {
            inlineData: {
                data: image,
                mimeType: 'image/jpeg'
            }
        };

        // Build analysis prompt with profile context
        let analysisPrompt = MEAL_ANALYSIS_RULES;

        analysisPrompt += `\n\nمعلومات المستخدم:
- الوزن: ${context.user_profile.weight} كغ
- الطول: ${context.user_profile.height} سم
- الجنس: ${context.user_profile.gender}
- مستوى النشاط: ${context.user_profile.activity_level}
- الأهداف الصحية: ${context.user_profile.health_goals.join(', ') || 'غير محدد'}
- الحالات الطبية: ${context.user_profile.medical_conditions.join(', ') || 'لا يوجد'}
- الحساسيات: ${context.user_profile.allergies.join(', ') || 'لا يوجد'}

الأهداف اليومية:
- السعرات الحرارية: ${context.daily_targets.calories}
- حصة الوجبة الموصى بها: ${context.daily_targets.meal_portion} سعرة`;

        if (prompt) {
            analysisPrompt += `\n\nسؤال المستخدم: ${prompt}`;
        }

        const result = await model.generateContent([analysisPrompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        try {
            const jsonData = JSON.parse(text);
            res.json(jsonData);
        } catch (e) {
            res.json({ 
                raw_response: text,
                error: 'Failed to parse JSON response'
            });
        }

    } catch (error) {
        console.error('Error in /api/ai/analyze-meal:', error);
        res.status(500).json({ error: 'Failed to analyze meal' });
    }
});

/**
 * @route   POST /api/ai/analyze-meal-text
 * @desc    Analyze a meal description with user profile context
 * @access  Public
 */
router.post('/analyze-meal-text', async (req, res) => {
    try {
        const { description, context, prompt } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Build analysis prompt with profile context
        let analysisPrompt = MEAL_ANALYSIS_RULES;

        analysisPrompt += `\n\nوصف الطعام: ${description}

معلومات المستخدم:
- الوزن: ${context.user_profile.weight} كغ
- الطول: ${context.user_profile.height} سم
- الجنس: ${context.user_profile.gender}
- مستوى النشاط: ${context.user_profile.activity_level}
- الأهداف الصحية: ${context.user_profile.health_goals.join(', ') || 'غير محدد'}
- الحالات الطبية: ${context.user_profile.medical_conditions.join(', ') || 'لا يوجد'}
- الحساسيات: ${context.user_profile.allergies.join(', ') || 'لا يوجد'}

الأهداف اليومية:
- السعرات الحرارية: ${context.daily_targets.calories}
- حصة الوجبة الموصى بها: ${context.daily_targets.meal_portion} سعرة`;

        if (prompt) {
            analysisPrompt += `\n\nسؤال المستخدم: ${prompt}`;
        }

        const result = await model.generateContent(analysisPrompt);
        const response = await result.response;
        const text = response.text();

        try {
            const jsonData = JSON.parse(text);
            res.json(jsonData);
        } catch (e) {
            res.json({ 
                raw_response: text,
                error: 'Failed to parse JSON response'
            });
        }

    } catch (error) {
        console.error('Error in /api/ai/analyze-meal-text:', error);
        res.status(500).json({ error: 'Failed to analyze meal' });
    }
});

/**
 * @route   POST /api/ai/meal-recommendations
 * @desc    Get meal recommendations based on user profile
 * @access  Public
 */
router.post('/meal-recommendations', async (req, res) => {
    try {
        const { context } = req.body;

        if (!context) {
            return res.status(400).json({ error: 'Context is required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        let recommendationsPrompt = `أنت خبير تغذية محترف. قدم توصيات محددة للطعام.

قواعد إلزامية:
1. لا تضف نصائح طبية.
2. أجب بالعربية الفصحى المبسطة.
3. المخرجات يجب أن تكون JSON فقط بدون أي نص إضافي.

معلومات المستخدم:
- الأهداف الصحية: ${context.user_profile.health_goals.join(', ') || 'غير محدد'}
- الحالات الطبية: ${context.user_profile.medical_conditions.join(', ') || 'لا يوجد'}
- الحساسيات: ${context.user_profile.allergies.join(', ') || 'لا يوجد'}

بيانات الطعام:
${JSON.stringify(context.meal_data, null, 2)}

يرجى تقديم التوصيات بالتنسيق التالي:
{
  "is_recommended": true/false,
  "reason": "سبب التوصية أو عدمها",
  "modifications": ["تعديلات مقترحة"],
  "alternatives": ["بدائل مقترحة"],
  "timing": "التوقيت الموصى به",
  "portion_advice": "نصيحة حول حجم الحصة"
}`;

        const result = await model.generateContent(recommendationsPrompt);
        const response = await result.response;
        const text = response.text();

        try {
            const jsonData = JSON.parse(text);
            res.json({ recommendations: jsonData });
        } catch (e) {
            res.json({ 
                raw_response: text,
                error: 'Failed to parse JSON response'
            });
        }

    } catch (error) {
        console.error('Error in /api/ai/meal-recommendations:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

module.exports = router;
