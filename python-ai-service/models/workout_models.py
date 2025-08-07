from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class UserPreferences(BaseModel):
    units: str = "metric"
    notifications: bool = True
    voice_coaching: bool = True
    form_analysis: bool = True
    goals: Dict[str, Any] = {}

class WorkoutRequest(BaseModel):
    user_preferences: UserPreferences
    duration: int = 45
    difficulty: str = "intermediate"
    equipment: List[str] = []
    user_history: List[Dict[str, Any]] = []

class ExerciseSet(BaseModel):
    type: str
    reps: Optional[int] = None
    duration: Optional[int] = None
    rest_time: int = 60

class Exercise(BaseModel):
    name: str
    category: str
    target_muscles: List[str]
    instructions: List[str]
    tips: List[str]
    difficulty: str
    equipment: List[str]
    sets: List[ExerciseSet]
    rest_time: int
    order: int
    form_checkpoints: List[Dict[str, Any]] = []

class WorkoutResponse(BaseModel):
    name: str
    description: str
    duration: int
    difficulty: str
    category: str
    exercises: List[Exercise]
    estimated_calories: int
    target_muscles: List[str]
    equipment: List[str]
    coaching_notes: str
    workout_structure: str