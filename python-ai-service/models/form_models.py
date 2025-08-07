from pydantic import BaseModel
from typing import List, Dict, Any

class FormFeedback(BaseModel):
    checkpoint: str
    score: float
    feedback: str
    status: str

class TimingAnalysis(BaseModel):
    total_duration: float
    average_rep_time: float
    tempo: str

class QualityMetrics(BaseModel):
    consistency: float
    smoothness: float
    overall_quality: float

class FormAnalysisResponse(BaseModel):
    overall_score: float
    feedback: List[FormFeedback]
    improvements: List[str]
    risk_level: str
    rep_count: int
    timing_analysis: TimingAnalysis
    form_breakdown: Dict[str, float]