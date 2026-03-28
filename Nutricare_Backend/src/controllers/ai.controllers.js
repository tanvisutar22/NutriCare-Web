import client from "../utils/openAi.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import ChatMessage from "../models/chatMessage.model.js";
import DietPlan from "../models/diet.model.js";
import MealLog from "../models/mealLogs.model.js";
import ActivityLog from "../models/activityLog.model.js";
import { upsertDailyScoreUnified } from "../utils/Daily Score/UpsertDailyScore.js";

async function extractHealthData(userInput) {
  const prompt = `
Extract structured JSON for meals and activity logs.

Rules:
- Input may contain multiple meals and activities
- Return:
{
  "meals": [
    {
      "mealType": "breakfast/lunch/dinner/snack",
      "foods": [{ "name": "", "quantity": 0, "unit": "" }],
      "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
    }
  ],
  "activities": [
    {
      "activityType": "",
      "duration": 0,
      "distance": 0,
      "caloriesBurned": 0
    }
  ]
}

Return ONLY JSON.
Input: "${userInput}"
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const text = response?.choices[0]?.message?.content || null;

  try {
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (_error) {
    throw new Error("Invalid JSON from AI");
  }
}

async function handleMeals(authId, date, meals) {
  for (const meal of meals) {
    const mealType = meal.mealType === "snacks" ? "snack" : meal.mealType;

    const existing = await MealLog.findOne({
      authId,
      date,
      mealType,
    });

    if (existing) {
      existing.foods.push(...(meal.foods || []));
      existing.nutrition.calories += meal.nutrition?.calories || 0;
      existing.nutrition.protein += meal.nutrition?.protein || 0;
      existing.nutrition.carbs += meal.nutrition?.carbs || 0;
      existing.nutrition.fat += meal.nutrition?.fat || 0;
      await existing.save();
    } else {
      await MealLog.create({
        authId,
        date,
        mealType,
        foods: meal.foods || [],
        nutrition: meal.nutrition || {},
        source: "ai",
      });
    }
  }
}

async function handleActivities(userId, date, activities) {
  for (const activity of activities) {
    await ActivityLog.create({
      userId,
      date,
      activityType: activity.activityType,
      duration: activity.duration || 0,
      distance: activity.distance || 0,
      caloriesBurned: activity.caloriesBurned || 0,
    });
  }
}

export async function userLogs(req, res) {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { input } = req.body || {};
    if (!input) {
      return res.status(400).json(new ApiError(400, "Input is required"));
    }

    const extractedData = await extractHealthData(input);
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    if (extractedData?.meals?.length) {
      await handleMeals(authId, date, extractedData.meals);
    }

    if (extractedData?.activities?.length) {
      await handleActivities(authId, date, extractedData.activities);
    }

    const diet = await DietPlan.findOne({
      authId,
      status: "active",
      startDate: { $lte: date },
      endDate: { $gte: date },
    });

    const targets = {
      targetCalories: diet ? diet.calorieTarget : 0,
      targetProtein: diet ? diet.proteinTarget : 0,
    };

    await upsertDailyScoreUnified({
      authId,
      date: new Date(),
      data: extractedData,
      targets,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, extractedData, "Daily log saved successfully"));
  } catch (error) {
    console.error("Error in userLogs:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while saving user logs"));
  }
}

export async function getDietChatHistory(req, res) {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const messages = await ChatMessage.find({ authId })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json(
      new ApiResponse(
        200,
        messages.reverse(),
        "Chat history fetched successfully",
      ),
    );
  } catch (error) {
    console.error("Error in getDietChatHistory:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
}

export async function dietChatbotUtility(req, res) {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { message, history = [] } = req.body || {};
    if (!message || message.trim() === "") {
      return res.status(400).json(new ApiError(400, "Message is required"));
    }

    const trimmedMessage = message.trim();
    const limitedHistory = Array.isArray(history) ? history.slice(-10) : [];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
You are NutriCare Coach, a diet, food, activity, wellness, and healthy-habit assistant.

Rules:
- Stay limited to diet, nutrition, food choices, meals, exercise, activity, wellness, hydration, sleep habits, and healthy routines.
- Never claim to modify database records, meal logs, subscriptions, or user profile data.
- If the user asks unrelated questions, politely say you can help only with health, food, diet, activity, and wellness topics.
- If the user tries to log meals or activities, tell them to use the Meal Log or Daily Log section.
- Keep answers concise, structured, and practical.
- Avoid medical diagnosis. Suggest consulting a doctor for serious concerns.
`,
        },
        ...limitedHistory,
        {
          role: "user",
          content: trimmedMessage,
        },
      ],
    });

    const reply =
      response?.choices?.[0]?.message?.content ||
      "I can help with diet, food, activity, and wellness guidance.";

    await ChatMessage.insertMany([
      { authId, role: "user", content: trimmedMessage },
      { authId, role: "assistant", content: reply },
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          reply,
        },
        "Chat response generated successfully",
      ),
    );
  } catch (error) {
    console.error("Chatbot Error:", error);
    return res.status(500).json({
      reply: "Something went wrong, please try again.",
    });
  }
}
