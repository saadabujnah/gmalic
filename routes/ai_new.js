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
    let contextPrompt = `أنت مساعد تغذية داخل تطبيق صحي.
تحليل الوجبات الغذائية وحساب قيمها الغذائية تلقائيًا.

قواعد إلزامية:
1. عند تحليل صورة طعام، الكميات تقديرية دائمًا.
2. قدّر الكميات بناءً على حجم الطبق المعتاد (100-300غ للوجبات العادية).
3. احسب جميع القيم الغذائية لكل مكوّن بدون استثناء.
4. استخدم بيانات USDA أو OpenFoodFacts كأساس حسابي.
5. احسب السعرات وباقي القيم تلقائيًا بعد تفكيك الوجبة.
6. لا تستخدم null أو "غير متأكد" أو أي قيمة مشابهة.
7. يجب أن تكون جميع القيم الغذائية أرقام صالحة.
8. أجب بصيغة JSON فقط.
9. اللغة العربية فقط.

أمثلة على التقدير:
- قطعة دجاج متوسطة: 150غ
- ملعقة أرز: 50غ
- شريحة خبز: 30غ
- ملعقة زيت: 15غ

صيغة الإخراج:
{
  "dish_name": "",
  "ingredients": [
    {
      "name": "",
      "quantity_grams": number,
      "calories_kcal": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "confidence": "high | medium | low"
    }
  ],
  "totals": {
    "calories_kcal": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number
  },
  "overall_confidence": "high | medium | low",
  "estimation_note": "القيم تقديرية اعتمادًا على صورة الطبق"
}

ملاحظة: جميع القيم يجب أن تكون أرقام صالحة، لا تترك أي قيمة فارغة.`;

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
    // Note: This requires multipart/form-data handling on the server,
    // which needs a library like 'multer'. For simplicity, this example
    // assumes the image is sent as a base64 string.
    try {
        const { image, prompt } = req.body; // Expecting image as base64 string

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

        let analysisPrompt = `أنت مساعد ذكي متخصص في الصحة والتغذية واللياقة البدنية.

قواعد صارمة يجب الالتزام بها دائمًا:
1. لا تخمّن أي قيمة غذائية.
2. إن لم تتوفر بيانات مؤكدة، اطلب توضيحًا من المستخدم.
3. اعتمد فقط على:
   - بيانات USDA
   - أو OpenFoodFacts
   - أو بيانات يقدّمها التطبيق صراحة.
4. جميع القيم الغذائية يجب أن تكون رقمية وقابلة للحساب.
5. لا تضف نصائح طبية.
6. لا تكتب شرحًا طويلًا.
7. أجب بالعربية الفصحى المبسطة.
8. عند الشك، أرجع "غير متأكد" بدل التخمين.
9. المخرجات يجب أن تكون JSON فقط بدون أي نص إضافي.

يرجى تحليل هذه الصورة في سياق الصحة والتغذية واللياقة البدنية.`;

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
        let analysisPrompt = `أنت خبير تغذية محترف. قم بتحليل صورة الطعام التالية.

قواعد صارمة:
1. لا تخمّن أي قيمة غذائية.
2. إن لم تتوفر بيانات مؤكدة، اطلب توضيحًا من المستخدم.
3. اعتمد فقط على بيانات USDA أو OpenFoodFacts.
4. جميع القيم الغذائية يجب أن تكون رقمية وقابلة للحساب.
5. لا تضف نصائح طبية.
6. أجب بالعربية الفصحى المبسطة.
7. عند الشك، أرجع "غير متأكد" بدل التخمين.
8. المخرجات يجب أن تكون JSON فقط بدون أي نص إضافي.

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

        analysisPrompt += `\n\nيرجى تحليل الصورة وإرجاع النتائج بالتنسيق التالي:
{
  "meal_name": "اسم الطبق",
  "estimated_calories": "السعرات الحرارية المقدرة",
  "protein": "البروتين (غ)",
  "carbs": "الكربوهيدرات (غ)",
  "fat": "الدهون (غ)",
  "fiber": "الألياف (غ)",
  "sugar": "السكر (غ)",
  "portion_size": "حجم الحصة الموصى بها",
  "is_suitable": true/false,
  "warnings": ["تحذيرات إذا وجدت"],
  "recommendations": ["توصيات محددة للمستخدم"]
}`;

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
        let analysisPrompt = `أنت خبير تغذية محترف. قم بتحليل وصف الطعام التالي.

قواعد صارمة:
1. لا تخمّن أي قيمة غذائية.
2. إن لم تتوفر بيانات مؤكدة، اطلب توضيحًا من المستخدم.
3. اعتمد فقط على بيانات USDA أو OpenFoodFacts.
4. جميع القيم الغذائية يجب أن تكون رقمية وقابلة للحساب.
5. لا تضف نصائح طبية.
6. أجب بالعربية الفصحى المبسطة.
7. عند الشك، أرجع "غير متأكد" بدل التخمين.
8. المخرجات يجب أن تكون JSON فقط بدون أي نص إضافي.

وصف الطعام: ${description}

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

        analysisPrompt += `\n\nيرجى تحليل الوصف وإرجاع النتائج بالتنسيق التالي:
{
  "meal_name": "اسم الطبق",
  "estimated_calories": "السعرات الحرارية المقدرة",
  "protein": "البروتين (غ)",
  "carbs": "الكربوهيدرات (غ)",
  "fat": "الدهون (غ)",
  "fiber": "الألياف (غ)",
  "sugar": "السكر (غ)",
  "portion_size": "حجم الحصة الموصى بها",
  "is_suitable": true/false,
  "warnings": ["تحذيرات إذا وجدت"],
  "recommendations": ["توصيات محددة للمستخدم"]
}`;

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

قواعد صارمة:
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
