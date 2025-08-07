import random
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

class WorkoutGenerator:
    def __init__(self):
        self.exercise_database = self._load_exercise_database()
        self.workout_templates = self._load_workout_templates()
        self.muscle_groups = {
            'chest': ['pectorals', 'anterior_deltoids'],
            'back': ['latissimus_dorsi', 'rhomboids', 'middle_trapezius'],
            'shoulders': ['deltoids', 'rotator_cuff'],
            'arms': ['biceps', 'triceps', 'forearms'],
            'legs': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
            'core': ['abs', 'obliques', 'lower_back']
        }
        
    def _load_exercise_database(self) -> Dict[str, Any]:
        """Load comprehensive exercise database"""
        return {
            "push_up": {
                "name": "Push-up",
                "category": "chest",
                "target_muscles": ["pectorals", "triceps", "anterior_deltoids"],
                "difficulty": "beginner",
                "equipment": [],
                "instructions": [
                    "Start in plank position with hands shoulder-width apart",
                    "Lower body until chest nearly touches floor",
                    "Push back up to starting position",
                    "Keep core engaged throughout movement"
                ],
                "tips": [
                    "Keep your body in a straight line",
                    "Don't let hips sag or pike up",
                    "Control the descent"
                ],
                "form_checkpoints": [
                    {
                        "name": "body_alignment",
                        "description": "Maintain straight line from head to heels",
                        "key_points": ["straight_back", "engaged_core", "neutral_neck"]
                    },
                    {
                        "name": "hand_position",
                        "description": "Hands positioned correctly",
                        "key_points": ["shoulder_width", "under_shoulders", "fingers_forward"]
                    }
                ],
                "variations": ["incline", "decline", "diamond", "wide_grip"],
                "calories_per_minute": 8.5
            },
            "squat": {
                "name": "Squat",
                "category": "legs",
                "target_muscles": ["quadriceps", "glutes", "hamstrings"],
                "difficulty": "beginner",
                "equipment": [],
                "instructions": [
                    "Stand with feet shoulder-width apart",
                    "Lower body by bending knees and hips",
                    "Descend until thighs are parallel to floor",
                    "Drive through heels to return to start"
                ],
                "tips": [
                    "Keep chest up and core engaged",
                    "Don't let knees cave inward",
                    "Weight should be on heels"
                ],
                "form_checkpoints": [
                    {
                        "name": "knee_tracking",
                        "description": "Knees track over toes",
                        "key_points": ["no_valgus", "proper_alignment", "stable_base"]
                    },
                    {
                        "name": "depth",
                        "description": "Adequate squat depth",
                        "key_points": ["hip_crease_below_knee", "full_range", "controlled_descent"]
                    }
                ],
                "variations": ["goblet", "front", "overhead", "single_leg"],
                "calories_per_minute": 9.2
            },
            "plank": {
                "name": "Plank",
                "category": "core",
                "target_muscles": ["abs", "obliques", "lower_back"],
                "difficulty": "beginner",
                "equipment": [],
                "instructions": [
                    "Start in forearm plank position",
                    "Keep body in straight line",
                    "Engage core and glutes",
                    "Hold position for specified time"
                ],
                "tips": [
                    "Don't hold your breath",
                    "Keep hips level",
                    "Engage entire core"
                ],
                "form_checkpoints": [
                    {
                        "name": "alignment",
                        "description": "Proper body alignment",
                        "key_points": ["straight_line", "no_sagging", "level_hips"]
                    }
                ],
                "variations": ["side", "reverse", "single_arm", "single_leg"],
                "calories_per_minute": 5.8
            }
            # Add more exercises...
        }
    
    def _load_workout_templates(self) -> Dict[str, Any]:
        """Load workout templates for different goals"""
        return {
            "strength": {
                "structure": "compound_focus",
                "rep_ranges": {"strength": (3, 6), "hypertrophy": (8, 12)},
                "rest_periods": {"compound": 180, "isolation": 90},
                "exercise_selection": ["compound_primary", "isolation_secondary"]
            },
            "cardio": {
                "structure": "circuit_based",
                "intensity_zones": {"low": 0.6, "moderate": 0.7, "high": 0.85},
                "work_rest_ratios": {"hiit": (1, 1), "steady": (1, 0.2)},
                "exercise_selection": ["bodyweight", "plyometric"]
            },
            "flexibility": {
                "structure": "flow_based",
                "hold_times": {"static": 30, "dynamic": 15},
                "progression": "gradual_increase",
                "exercise_selection": ["stretches", "mobility"]
            }
        }

    async def generate_workout(
        self,
        user_preferences: Dict[str, Any],
        duration: int = 45,
        difficulty: str = "intermediate",
        equipment: List[str] = None,
        user_history: List[Dict] = None
    ) -> Dict[str, Any]:
        """Generate personalized workout using AI algorithms"""
        
        if equipment is None:
            equipment = []
        if user_history is None:
            user_history = []
            
        # Analyze user patterns and preferences
        workout_analysis = self._analyze_user_patterns(user_history, user_preferences)
        
        # Select workout type based on goals and recovery
        workout_type = self._select_workout_type(user_preferences, workout_analysis)
        
        # Generate exercise selection
        exercises = self._select_exercises(
            workout_type=workout_type,
            duration=duration,
            difficulty=difficulty,
            equipment=equipment,
            user_preferences=user_preferences,
            workout_analysis=workout_analysis
        )
        
        # Calculate workout parameters
        workout_params = self._calculate_workout_parameters(exercises, duration, difficulty)
        
        # Generate coaching notes
        coaching_notes = self._generate_coaching_notes(exercises, user_preferences, workout_analysis)
        
        return {
            "name": self._generate_workout_name(workout_type, difficulty),
            "description": self._generate_workout_description(workout_type, exercises),
            "duration": duration,
            "difficulty": difficulty,
            "category": workout_type,
            "exercises": exercises,
            "estimated_calories": workout_params["calories"],
            "target_muscles": workout_params["target_muscles"],
            "equipment": list(set(equipment)),
            "coaching_notes": coaching_notes,
            "workout_structure": workout_params["structure"]
        }
    
    def _analyze_user_patterns(self, user_history: List[Dict], preferences: Dict) -> Dict[str, Any]:
        """Analyze user workout patterns and recovery needs"""
        if not user_history:
            return {
                "muscle_fatigue": {},
                "preferred_exercises": [],
                "recovery_needed": False,
                "progression_ready": True
            }
        
        # Analyze recent workouts for muscle group fatigue
        recent_workouts = [w for w in user_history if self._is_recent(w.get('completedAt', ''))]
        muscle_fatigue = self._calculate_muscle_fatigue(recent_workouts)
        
        # Identify preferred exercises
        preferred_exercises = self._identify_preferred_exercises(user_history)
        
        # Assess recovery needs
        recovery_needed = self._assess_recovery_needs(recent_workouts)
        
        # Check progression readiness
        progression_ready = self._check_progression_readiness(user_history)
        
        return {
            "muscle_fatigue": muscle_fatigue,
            "preferred_exercises": preferred_exercises,
            "recovery_needed": recovery_needed,
            "progression_ready": progression_ready,
            "workout_frequency": len(recent_workouts)
        }
    
    def _select_workout_type(self, preferences: Dict, analysis: Dict) -> str:
        """Select optimal workout type based on goals and recovery"""
        primary_goal = preferences.get('goals', {}).get('primaryGoal', 'general_fitness')
        
        # Map goals to workout types
        goal_mapping = {
            'weight_loss': 'cardio',
            'muscle_gain': 'strength',
            'strength': 'strength',
            'endurance': 'cardio',
            'general_fitness': 'functional'
        }
        
        base_type = goal_mapping.get(primary_goal, 'functional')
        
        # Adjust based on recovery needs
        if analysis['recovery_needed']:
            return 'flexibility' if base_type == 'strength' else 'yoga'
        
        return base_type
    
    def _select_exercises(
        self,
        workout_type: str,
        duration: int,
        difficulty: str,
        equipment: List[str],
        user_preferences: Dict,
        workout_analysis: Dict
    ) -> List[Dict[str, Any]]:
        """Select and structure exercises for the workout"""
        
        # Filter exercises by equipment and difficulty
        available_exercises = self._filter_exercises(equipment, difficulty)
        
        # Calculate number of exercises based on duration
        num_exercises = max(4, min(8, duration // 6))
        
        # Select exercises based on workout type
        if workout_type == 'strength':
            exercises = self._select_strength_exercises(
                available_exercises, num_exercises, workout_analysis
            )
        elif workout_type == 'cardio':
            exercises = self._select_cardio_exercises(
                available_exercises, num_exercises, workout_analysis
            )
        else:
            exercises = self._select_functional_exercises(
                available_exercises, num_exercises, workout_analysis
            )
        
        # Add sets and reps
        for i, exercise in enumerate(exercises):
            exercise.update(self._calculate_sets_reps(exercise, difficulty, i))
            exercise['order'] = i + 1
        
        return exercises
    
    def _filter_exercises(self, equipment: List[str], difficulty: str) -> List[Dict]:
        """Filter exercises based on available equipment and difficulty"""
        filtered = []
        
        difficulty_levels = {
            'beginner': ['beginner'],
            'intermediate': ['beginner', 'intermediate'],
            'advanced': ['beginner', 'intermediate', 'advanced']
        }
        
        allowed_difficulties = difficulty_levels.get(difficulty, ['beginner'])
        
        for exercise_id, exercise in self.exercise_database.items():
            # Check difficulty
            if exercise['difficulty'] not in allowed_difficulties:
                continue
            
            # Check equipment requirements
            required_equipment = set(exercise.get('equipment', []))
            available_equipment = set(equipment)
            
            if required_equipment.issubset(available_equipment) or not required_equipment:
                filtered.append(exercise.copy())
        
        return filtered
    
    def _select_strength_exercises(
        self, available_exercises: List[Dict], num_exercises: int, analysis: Dict
    ) -> List[Dict]:
        """Select exercises for strength training"""
        exercises = []
        muscle_fatigue = analysis.get('muscle_fatigue', {})
        
        # Prioritize compound movements
        compound_exercises = [e for e in available_exercises if len(e['target_muscles']) >= 2]
        isolation_exercises = [e for e in available_exercises if len(e['target_muscles']) < 2]
        
        # Select compound exercises first (60% of workout)
        compound_count = max(2, int(num_exercises * 0.6))
        selected_compound = self._select_by_muscle_balance(
            compound_exercises, compound_count, muscle_fatigue
        )
        exercises.extend(selected_compound)
        
        # Fill remaining with isolation exercises
        remaining = num_exercises - len(exercises)
        if remaining > 0:
            selected_isolation = self._select_by_muscle_balance(
                isolation_exercises, remaining, muscle_fatigue
            )
            exercises.extend(selected_isolation)
        
        return exercises
    
    def _select_cardio_exercises(
        self, available_exercises: List[Dict], num_exercises: int, analysis: Dict
    ) -> List[Dict]:
        """Select exercises for cardio training"""
        # Focus on high-calorie burning exercises
        cardio_exercises = [
            e for e in available_exercises 
            if e.get('calories_per_minute', 0) > 7 or e['category'] == 'cardio'
        ]
        
        if len(cardio_exercises) < num_exercises:
            cardio_exercises.extend(available_exercises)
        
        # Select diverse movement patterns
        selected = []
        movement_patterns = set()
        
        for exercise in cardio_exercises:
            if len(selected) >= num_exercises:
                break
            
            pattern = exercise['category']
            if pattern not in movement_patterns or len(movement_patterns) >= 3:
                selected.append(exercise)
                movement_patterns.add(pattern)
        
        return selected[:num_exercises]
    
    def _select_functional_exercises(
        self, available_exercises: List[Dict], num_exercises: int, analysis: Dict
    ) -> List[Dict]:
        """Select exercises for functional training"""
        # Balance between different muscle groups
        muscle_groups = ['chest', 'back', 'legs', 'core', 'shoulders']
        exercises_per_group = max(1, num_exercises // len(muscle_groups))
        
        selected = []
        for group in muscle_groups:
            group_exercises = [e for e in available_exercises if e['category'] == group]
            if group_exercises:
                selected.extend(random.sample(
                    group_exercises, 
                    min(exercises_per_group, len(group_exercises))
                ))
        
        # Fill remaining slots
        while len(selected) < num_exercises and available_exercises:
            remaining_exercises = [e for e in available_exercises if e not in selected]
            if remaining_exercises:
                selected.append(random.choice(remaining_exercises))
            else:
                break
        
        return selected[:num_exercises]
    
    def _select_by_muscle_balance(
        self, exercises: List[Dict], count: int, muscle_fatigue: Dict
    ) -> List[Dict]:
        """Select exercises while balancing muscle groups and considering fatigue"""
        if not exercises:
            return []
        
        selected = []
        muscle_usage = {}
        
        # Sort exercises by muscle fatigue (less fatigued muscles first)
        def fatigue_score(exercise):
            muscles = exercise['target_muscles']
            return sum(muscle_fatigue.get(muscle, 0) for muscle in muscles) / len(muscles)
        
        sorted_exercises = sorted(exercises, key=fatigue_score)
        
        for exercise in sorted_exercises:
            if len(selected) >= count:
                break
            
            # Check muscle balance
            muscles = exercise['target_muscles']
            current_usage = sum(muscle_usage.get(muscle, 0) for muscle in muscles)
            
            if current_usage < 2:  # Limit muscle group usage
                selected.append(exercise)
                for muscle in muscles:
                    muscle_usage[muscle] = muscle_usage.get(muscle, 0) + 1
        
        return selected
    
    def _calculate_sets_reps(self, exercise: Dict, difficulty: str, exercise_index: int) -> Dict:
        """Calculate sets and reps for an exercise"""
        base_sets = {
            'beginner': 2,
            'intermediate': 3,
            'advanced': 4
        }
        
        base_reps = {
            'beginner': (8, 12),
            'intermediate': (10, 15),
            'advanced': (12, 20)
        }
        
        sets = base_sets.get(difficulty, 3)
        rep_range = base_reps.get(difficulty, (10, 15))
        
        # Adjust for exercise type
        if exercise['category'] == 'core':
            rep_range = (rep_range[0] + 5, rep_range[1] + 10)
        elif len(exercise['target_muscles']) >= 3:  # Compound exercises
            rep_range = (rep_range[0] - 2, rep_range[1] - 2)
        
        # Generate sets
        exercise_sets = []
        for i in range(sets):
            reps = random.randint(rep_range[0], rep_range[1])
            exercise_sets.append({
                'type': 'reps',
                'reps': reps,
                'rest_time': 60 if exercise['category'] == 'core' else 90
            })
        
        return {
            'sets': exercise_sets,
            'rest_time': exercise_sets[0]['rest_time'] if exercise_sets else 60
        }
    
    def _calculate_workout_parameters(self, exercises: List[Dict], duration: int, difficulty: str) -> Dict:
        """Calculate overall workout parameters"""
        total_calories = 0
        target_muscles = set()
        
        for exercise in exercises:
            # Calculate calories for this exercise
            exercise_duration = duration / len(exercises)
            calories_per_min = exercise.get('calories_per_minute', 6)
            total_calories += exercise_duration * calories_per_min
            
            # Collect target muscles
            target_muscles.update(exercise['target_muscles'])
        
        return {
            'calories': int(total_calories),
            'target_muscles': list(target_muscles),
            'structure': 'circuit' if len(exercises) > 6 else 'traditional'
        }
    
    def _generate_coaching_notes(
        self, exercises: List[Dict], preferences: Dict, analysis: Dict
    ) -> str:
        """Generate AI coaching notes for the workout"""
        notes = []
        
        # Personalized motivation
        goal = preferences.get('goals', {}).get('primaryGoal', 'fitness')
        notes.append(f"This workout is designed to support your {goal.replace('_', ' ')} goals.")
        
        # Recovery considerations
        if analysis.get('recovery_needed'):
            notes.append("Focus on controlled movements and proper form today.")
        
        # Exercise-specific tips
        if any(ex['category'] == 'core' for ex in exercises):
            notes.append("Remember to breathe steadily during core exercises.")
        
        if any(len(ex['target_muscles']) >= 3 for ex in exercises):
            notes.append("Take adequate rest between compound movements.")
        
        # Progression notes
        if analysis.get('progression_ready'):
            notes.append("You're ready to challenge yourself - focus on perfect form.")
        
        return " ".join(notes)
    
    def _generate_workout_name(self, workout_type: str, difficulty: str) -> str:
        """Generate creative workout name"""
        type_names = {
            'strength': ['Power', 'Strength', 'Iron', 'Force'],
            'cardio': ['Burn', 'Blast', 'Fire', 'Storm'],
            'functional': ['Flow', 'Fusion', 'Dynamic', 'Total'],
            'flexibility': ['Zen', 'Flow', 'Restore', 'Balance']
        }
        
        difficulty_modifiers = {
            'beginner': ['Foundation', 'Start', 'Base'],
            'intermediate': ['Challenge', 'Push', 'Advance'],
            'advanced': ['Elite', 'Max', 'Ultimate']
        }
        
        type_words = type_names.get(workout_type, ['Fitness'])
        diff_words = difficulty_modifiers.get(difficulty, [''])
        
        return f"{random.choice(diff_words)} {random.choice(type_words)} Session"
    
    def _generate_workout_description(self, workout_type: str, exercises: List[Dict]) -> str:
        """Generate workout description"""
        muscle_groups = set()
        for exercise in exercises:
            muscle_groups.update(exercise['target_muscles'])
        
        primary_muscles = list(muscle_groups)[:3]
        muscle_text = ", ".join(primary_muscles).replace('_', ' ')
        
        descriptions = {
            'strength': f"Build strength and muscle with targeted exercises for {muscle_text}",
            'cardio': f"High-energy cardio workout to boost endurance and burn calories",
            'functional': f"Full-body functional training targeting {muscle_text}",
            'flexibility': f"Improve flexibility and mobility with flowing movements"
        }
        
        return descriptions.get(workout_type, f"Balanced workout targeting {muscle_text}")
    
    def _is_recent(self, date_str: str, days: int = 7) -> bool:
        """Check if date is within recent days"""
        try:
            workout_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return (datetime.now() - workout_date).days <= days
        except:
            return False
    
    def _calculate_muscle_fatigue(self, recent_workouts: List[Dict]) -> Dict[str, float]:
        """Calculate muscle fatigue based on recent workouts"""
        fatigue = {}
        
        for workout in recent_workouts:
            days_ago = self._days_since_workout(workout.get('completedAt', ''))
            fatigue_factor = max(0, 1 - (days_ago / 7))  # Fatigue decreases over 7 days
            
            for exercise in workout.get('exercises', []):
                for muscle in exercise.get('target_muscles', []):
                    fatigue[muscle] = fatigue.get(muscle, 0) + fatigue_factor
        
        return fatigue
    
    def _days_since_workout(self, date_str: str) -> int:
        """Calculate days since workout"""
        try:
            workout_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return (datetime.now() - workout_date).days
        except:
            return 7
    
    def _identify_preferred_exercises(self, history: List[Dict]) -> List[str]:
        """Identify user's preferred exercises based on ratings and frequency"""
        exercise_scores = {}
        
        for workout in history:
            rating = workout.get('rating', 3)
            for exercise in workout.get('exercises', []):
                name = exercise.get('name', '')
                if name:
                    exercise_scores[name] = exercise_scores.get(name, 0) + rating
        
        # Sort by score and return top exercises
        sorted_exercises = sorted(exercise_scores.items(), key=lambda x: x[1], reverse=True)
        return [name for name, score in sorted_exercises[:5]]
    
    def _assess_recovery_needs(self, recent_workouts: List[Dict]) -> bool:
        """Assess if user needs recovery based on recent activity"""
        if len(recent_workouts) >= 4:  # 4+ workouts in last week
            return True
        
        # Check for consecutive high-intensity days
        consecutive_days = 0
        for workout in sorted(recent_workouts, key=lambda x: x.get('completedAt', ''), reverse=True):
            if workout.get('difficulty') == 'advanced':
                consecutive_days += 1
                if consecutive_days >= 2:
                    return True
            else:
                consecutive_days = 0
        
        return False
    
    def _check_progression_readiness(self, history: List[Dict]) -> bool:
        """Check if user is ready for progression"""
        if len(history) < 3:
            return False
        
        recent_ratings = [w.get('rating', 3) for w in history[-3:]]
        return sum(recent_ratings) / len(recent_ratings) >= 4.0