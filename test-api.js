const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Check if API key is available
if (!process.env.GOOGLE_API_KEY) {
  console.error('❌ خطأ: لم يتم العثور على GOOGLE_API_KEY في ملف .env');
  console.log('تأكد من إضافة مفتاح Google API إلى ملف .env');
  process.exit(1);
}

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Test the connection
async function testConnection() {
  try {
    console.log('🔄 جاري اختبار الاتصال بـ Google AI...');

    // Test with the new model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Generate a simple test response
    const result = await model.generateContent('مرحباً، كيف حالك؟');
    const response = await result.response;
    const text = response.text();

    console.log('✅ تم الاتصال بـ Google AI بنجاح!');
    console.log('📝 مثال على الرد:', text);
    console.log('\nيمكنك الآن تشغيل الخادم باستخدام: npm start');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بـ Google AI:', error.message);

    if (error.message.includes('API key')) {
      console.log('\n💡 قد يكون السبب:');
      console.log('1. مفتاح API غير صحيح');
      console.log('2. مفتاح API لا يملك الصلاحيات المطلوبة');
      console.log('3. تم تجاوز الحد المسموح به لاستخدام API');
    }

    // Try with the older model as fallback
    console.log('\n🔄 جاري اختبار النموذج الاحتياطي gemini-1.5-flash...');
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const fallbackResult = await fallbackModel.generateContent('مرحباً، كيف حالك؟');
      const fallbackResponse = await fallbackResult.response;
      const fallbackText = fallbackResponse.text();

      console.log('✅ تم الاتصال بـ Google AI بنجاح باستخدام النموذج الاحتياطي!');
      console.log('📝 مثال على الرد:', fallbackText);
      console.log('\n💡 يرجى تحديث الكود لاستخدام gemini-1.5-flash بدلاً من gemini-2.5-flash-lite');
    } catch (fallbackError) {
      console.error('❌ فشل الاتصال حتى بالنموذج الاحتياطي:', fallbackError.message);
    }
  }
}

testConnection();
