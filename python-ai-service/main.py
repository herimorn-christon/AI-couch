from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import os
from dotenv import load_dotenv

from services.workout_generator import WorkoutGenerator
from services.form_analyzer import FormAnalyzer
from services.nutrition_analyzer import NutritionAnalyzer
from services.progress_predictor import ProgressPredictor
from services.coaching_ai import CoachingAI
from models.workout_models import WorkoutRequest, WorkoutResponse
from models.form_models import FormAnalysisResponse
from models.nutrition_models import NutritionRequest, NutritionResponse
from models.progress_models import ProgressPredictionResponse

load_dotenv()

app = FastAPI(
    title="AI Workout Tracker - ML Service",
    description="Advanced AI services for workout generation, form analysis, and coaching",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI services
workout_generator = WorkoutGenerator()
form_analyzer = FormAnalyzer()
nutrition_analyzer = NutritionAnalyzer()
progress_predictor = ProgressPredictor()
coaching_ai = CoachingAI()

@app.get("/")
async def root():
    return {"message": "AI Workout Tracker ML Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "workout_generator": "ready",
            "form_analyzer": "ready",
            "nutrition_analyzer": "ready",
            "progress_predictor": "ready",
            "coaching_ai": "ready"
        }
    }

@app.post("/generate-workout", response_model=WorkoutResponse)
async def generate_workout(request: WorkoutRequest):
    """Generate personalized AI workout based on user preferences and history"""
    try:
        workout = await workout_generator.generate_workout(
            user_preferences=request.user_preferences,
            duration=request.duration,
            difficulty=request.difficulty,
            equipment=request.equipment,
            user_history=request.user_history
        )
        return workout
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate workout: {str(e)}")

@app.post("/analyze-form", response_model=FormAnalysisResponse)
async def analyze_form(
    video: UploadFile = File(...),
    exercise_name: str = None,
    form_checkpoints: str = None
):
    """Analyze exercise form from video using computer vision"""
    try:
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        video_content = await video.read()
        
        analysis = await form_analyzer.analyze_form(
            video_content=video_content,
            exercise_name=exercise_name,
            form_checkpoints=form_checkpoints
        )
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze form: {str(e)}")

@app.post("/analyze-nutrition", response_model=NutritionResponse)
async def analyze_nutrition(request: NutritionRequest):
    """Analyze nutrition from food photos and provide recommendations"""
    try:
        analysis = await nutrition_analyzer.analyze_nutrition(
            food_image=request.food_image,
            user_goals=request.user_goals,
            current_intake=request.current_intake
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze nutrition: {str(e)}")

@app.post("/predict-progress", response_model=ProgressPredictionResponse)
async def predict_progress(request: Dict[str, Any]):
    """Predict user progress based on workout history and goals"""
    try:
        prediction = await progress_predictor.predict_progress(
            user_stats=request.get("user_stats"),
            user_goals=request.get("user_goals"),
            workout_history=request.get("workout_history")
        )
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to predict progress: {str(e)}")

@app.post("/coaching-feedback")
async def generate_coaching_feedback(request: Dict[str, Any]):
    """Generate AI coaching feedback based on workout performance"""
    try:
        feedback = await coaching_ai.generate_feedback(
            workout=request.get("workout"),
            performance=request.get("performance"),
            user_stats=request.get("user_stats"),
            user_goals=request.get("user_goals")
        )
        return feedback
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate feedback: {str(e)}")

@app.post("/voice-coaching")
async def generate_voice_coaching(request: Dict[str, Any]):
    """Generate real-time voice coaching instructions"""
    try:
        coaching = await coaching_ai.generate_voice_coaching(
            exercise=request.get("exercise"),
            current_set=request.get("current_set"),
            form_score=request.get("form_score"),
            user_preferences=request.get("user_preferences")
        )
        return coaching
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate voice coaching: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )