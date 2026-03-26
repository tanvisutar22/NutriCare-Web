import client from "../utils/openAi.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import dietPlan from "../models/diet.model.js";
import MealLog from "../models/mealLogs.model.js";
import ActivityLog from "../models/activityLog.model.js";
import { upsertDailyScoreUnified } from "../utils/Daily Score/UpsertDailyScore.js";
async function extractHealthData(userInput) {
 const prompt = `
Extract structured JSON.

Rules:
- Input may contain multiple meals and activities
- Return:
{
  "meals": [
    {
      "mealType": "breakfast/lunch/dinner/snack",
      "foods": [{ "name", "quantity", "unit" }],
      "nutrition": { "calories", "protein", "carbs" }
    }
  ],
  "activities": [
    {
      "activityType": "",
      "duration": number,
      "distance": number,
      "caloriesBurned": number
    }
  ]
}

Return ONLY JSON.

Input: "${userInput}"
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  const text = response?.choices[0]?.message?.content || null;

  try {
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Invalid JSON from AI");
  }
}
export async function userLogs(req, res) {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }
    const { input } = req.body;
    if (!input) {
      return res.status(400).json(new ApiError(400, "Input is required"));
    }
    const extractedData = await extractHealthData(input);
     if(!extractedData){
        return res.status(500).json(new ApiError(500, "Failed to extract data from input"));
     }
     const date=new Date();
     date.setHours(0,0,0,0);
     if(extractedData.meals && extractedData.meals.length > 0){
        handleMeals(authId, date, extractedData.meals);
     }
     if(extractedData.activities && extractedData.activities.length > 0){
        handleActivities(authId, date, extractedData.activities);
     }
     const diet = await dietPlan.findOne({
  authId,
  status: "active",
  startDate: { $lte: date },
  endDate: { $gte: date }
});
     const targets={
        targetCalories: diet ? diet.calorieTarget : 0,
        targetProtein: diet ? diet.proteinTarget : 0
     }  
     console.log(diet, targets);
    const result= await upsertDailyScoreUnified({authId, date: new Date(), data: extractedData, targets: targets });
    console.log("Daily score upserted:", result);
    return res.json(new ApiResponse(200, extractedData));
}
catch (error) {
    console.error("Error in userLogs:", error);
    res.status(500).json(new ApiError(500, "Internal Server Error while fetching user logs"));
  } 
}
async function handleMeals(authId, date, meals) {
  for (let meal of meals) {

    const existing = await MealLog.findOne({
      authId,
      date,
      mealType: meal.mealType
    });

    if (existing) {
      // 🔥 UPDATE

      // add foods
      existing.foods.push(...(meal.foods || []));

      // add nutrition
      existing.nutrition.calories += meal.nutrition?.calories || 0;
      existing.nutrition.protein += meal.nutrition?.protein || 0;
      existing.nutrition.carbs += meal.nutrition?.carbs || 0;
      existing.nutrition.fat += meal.nutrition?.fat || 0;

      await existing.save();

    } else {
      // 🆕 CREATE

      await MealLog.create({
        authId,
        date,
        mealType: meal.mealType,
        foods: meal.foods || [],
        nutrition: meal.nutrition || {}
      });
    }
  }
}
async function handleActivities(userId, date, activities) {
  for (let act of activities) {
    await ActivityLog.create({
      userId,
      date,
      activityType: act.activityType,
      duration: act.duration || 0,
      distance: act.distance || 0,
      caloriesBurned: act.caloriesBurned || 0
    });
  }
}
export async function dietChatbotUtility(req,res) {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }
    const { message ,history } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json(new ApiError(400, "Message is required"));
    }
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,

      messages: [
        {
          role: "system",
          content: `
You are a strict diet and fitness assistant.

RULES:
- DO NOT log meals or activities
- DO NOT extract structured JSON
- ONLY give guidance, suggestions, and advice
- If user tries to log food/activity → say:
  "Please log this in the Meal Log or Activity Log section."

- Keep answers short and helpful
- Use previous conversation context if available

- If unrelated query → say:
  "I can only help with diet and fitness."

- Help with:
  diet plans, calories, protein, weight loss, muscle gain, healthy habits
`
        },

        // 🔥 include previous chat
       ...(history && history.length > 0 ? history : []),

        {
          role: "user",
          content: message
        }
      ]
    });
    console.log("Chatbot response:", response.choices[0].message.content);
    return res.status(200).json({   
       reply: response.choices[0].message.content  
    });

  } catch (error) {
    console.error("Chatbot Error:", error);

    return res.status(500).json( {
      reply: "Something went wrong, please try again."
    });  
  }
}

