import cv2
import mediapipe as mp
import numpy as np
import json
from typing import Dict, List, Any, Tuple
import tempfile
import os

class FormAnalyzer:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Exercise-specific form analysis rules
        self.exercise_rules = {
            "push_up": {
                "key_angles": ["elbow", "shoulder", "hip"],
                "checkpoints": {
                    "body_alignment": self._check_pushup_alignment,
                    "elbow_position": self._check_pushup_elbows,
                    "range_of_motion": self._check_pushup_rom
                }
            },
            "squat": {
                "key_angles": ["knee", "hip", "ankle"],
                "checkpoints": {
                    "knee_tracking": self._check_squat_knees,
                    "depth": self._check_squat_depth,
                    "back_position": self._check_squat_back
                }
            },
            "plank": {
                "key_angles": ["shoulder", "hip", "knee"],
                "checkpoints": {
                    "alignment": self._check_plank_alignment,
                    "hip_position": self._check_plank_hips,
                    "shoulder_stability": self._check_plank_shoulders
                }
            }
        }
    
    async def analyze_form(
        self,
        video_content: bytes,
        exercise_name: str,
        form_checkpoints: str = None
    ) -> Dict[str, Any]:
        """Analyze exercise form from video using computer vision"""
        
        # Save video to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            temp_file.write(video_content)
            temp_path = temp_file.name
        
        try:
            # Process video
            analysis_results = self._process_video(temp_path, exercise_name)
            
            # Generate feedback
            feedback = self._generate_feedback(analysis_results, exercise_name)
            
            return {
                "overall_score": feedback["overall_score"],
                "feedback": feedback["detailed_feedback"],
                "improvements": feedback["improvements"],
                "risk_level": feedback["risk_level"],
                "rep_count": analysis_results["rep_count"],
                "timing_analysis": analysis_results["timing"],
                "form_breakdown": analysis_results["form_scores"]
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def _process_video(self, video_path: str, exercise_name: str) -> Dict[str, Any]:
        """Process video and extract pose data"""
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError("Could not open video file")
        
        frames_data = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process frame with MediaPipe
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                # Extract landmarks
                landmarks = self._extract_landmarks(results.pose_landmarks)
                
                # Calculate angles
                angles = self._calculate_angles(landmarks)
                
                # Analyze form for this frame
                form_scores = self._analyze_frame_form(landmarks, angles, exercise_name)
                
                frames_data.append({
                    "frame": frame_count,
                    "landmarks": landmarks,
                    "angles": angles,
                    "form_scores": form_scores,
                    "timestamp": frame_count / cap.get(cv2.CAP_PROP_FPS)
                })
            
            frame_count += 1
        
        cap.release()
        
        if not frames_data:
            raise ValueError("No pose detected in video")
        
        # Analyze complete movement
        movement_analysis = self._analyze_movement_pattern(frames_data, exercise_name)
        
        return {
            "frames_data": frames_data,
            "rep_count": movement_analysis["rep_count"],
            "timing": movement_analysis["timing"],
            "form_scores": movement_analysis["average_scores"],
            "movement_quality": movement_analysis["quality_metrics"]
        }
    
    def _extract_landmarks(self, pose_landmarks) -> Dict[str, Tuple[float, float, float]]:
        """Extract pose landmarks as coordinates"""
        landmarks = {}
        
        landmark_names = [
            'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
            'right_eye_inner', 'right_eye', 'right_eye_outer',
            'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
            'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
            'left_index', 'right_index', 'left_thumb', 'right_thumb',
            'left_hip', 'right_hip', 'left_knee', 'right_knee',
            'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
            'left_foot_index', 'right_foot_index'
        ]
        
        for i, landmark in enumerate(pose_landmarks.landmark):
            if i < len(landmark_names):
                landmarks[landmark_names[i]] = (landmark.x, landmark.y, landmark.z)
        
        return landmarks
    
    def _calculate_angles(self, landmarks: Dict[str, Tuple[float, float, float]]) -> Dict[str, float]:
        """Calculate joint angles from landmarks"""
        angles = {}
        
        # Helper function to calculate angle between three points
        def calculate_angle(p1, p2, p3):
            """Calculate angle at p2 formed by p1-p2-p3"""
            v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
            v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
            
            cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
            cos_angle = np.clip(cos_angle, -1.0, 1.0)
            angle = np.arccos(cos_angle)
            
            return np.degrees(angle)
        
        try:
            # Left elbow angle
            if all(key in landmarks for key in ['left_shoulder', 'left_elbow', 'left_wrist']):
                angles['left_elbow'] = calculate_angle(
                    landmarks['left_shoulder'],
                    landmarks['left_elbow'],
                    landmarks['left_wrist']
                )
            
            # Right elbow angle
            if all(key in landmarks for key in ['right_shoulder', 'right_elbow', 'right_wrist']):
                angles['right_elbow'] = calculate_angle(
                    landmarks['right_shoulder'],
                    landmarks['right_elbow'],
                    landmarks['right_wrist']
                )
            
            # Left knee angle
            if all(key in landmarks for key in ['left_hip', 'left_knee', 'left_ankle']):
                angles['left_knee'] = calculate_angle(
                    landmarks['left_hip'],
                    landmarks['left_knee'],
                    landmarks['left_ankle']
                )
            
            # Right knee angle
            if all(key in landmarks for key in ['right_hip', 'right_knee', 'right_ankle']):
                angles['right_knee'] = calculate_angle(
                    landmarks['right_hip'],
                    landmarks['right_knee'],
                    landmarks['right_ankle']
                )
            
            # Hip angle (left side)
            if all(key in landmarks for key in ['left_shoulder', 'left_hip', 'left_knee']):
                angles['left_hip'] = calculate_angle(
                    landmarks['left_shoulder'],
                    landmarks['left_hip'],
                    landmarks['left_knee']
                )
            
            # Hip angle (right side)
            if all(key in landmarks for key in ['right_shoulder', 'right_hip', 'right_knee']):
                angles['right_hip'] = calculate_angle(
                    landmarks['right_shoulder'],
                    landmarks['right_hip'],
                    landmarks['right_knee']
                )
            
            # Shoulder angles
            if all(key in landmarks for key in ['left_elbow', 'left_shoulder', 'left_hip']):
                angles['left_shoulder'] = calculate_angle(
                    landmarks['left_elbow'],
                    landmarks['left_shoulder'],
                    landmarks['left_hip']
                )
            
            if all(key in landmarks for key in ['right_elbow', 'right_shoulder', 'right_hip']):
                angles['right_shoulder'] = calculate_angle(
                    landmarks['right_elbow'],
                    landmarks['right_shoulder'],
                    landmarks['right_hip']
                )
            
        except Exception as e:
            print(f"Error calculating angles: {e}")
        
        return angles
    
    def _analyze_frame_form(
        self, landmarks: Dict, angles: Dict, exercise_name: str
    ) -> Dict[str, float]:
        """Analyze form for a single frame"""
        
        exercise_name_clean = exercise_name.lower().replace('-', '_').replace(' ', '_')
        
        if exercise_name_clean not in self.exercise_rules:
            # Generic form analysis
            return self._generic_form_analysis(landmarks, angles)
        
        rules = self.exercise_rules[exercise_name_clean]
        form_scores = {}
        
        # Run exercise-specific checkpoints
        for checkpoint_name, checkpoint_func in rules["checkpoints"].items():
            try:
                score = checkpoint_func(landmarks, angles)
                form_scores[checkpoint_name] = max(0, min(100, score))
            except Exception as e:
                print(f"Error in checkpoint {checkpoint_name}: {e}")
                form_scores[checkpoint_name] = 50  # Default score
        
        return form_scores
    
    def _check_pushup_alignment(self, landmarks: Dict, angles: Dict) -> float:
        """Check body alignment for push-ups"""
        try:
            # Check if body forms a straight line
            shoulder_y = (landmarks['left_shoulder'][1] + landmarks['right_shoulder'][1]) / 2
            hip_y = (landmarks['left_hip'][1] + landmarks['right_hip'][1]) / 2
            ankle_y = (landmarks['left_ankle'][1] + landmarks['right_ankle'][1]) / 2
            
            # Calculate deviation from straight line
            total_height = abs(shoulder_y - ankle_y)
            hip_deviation = abs(hip_y - (shoulder_y + ankle_y) / 2)
            
            if total_height > 0:
                alignment_score = 100 - (hip_deviation / total_height * 200)
                return max(0, alignment_score)
            
            return 50
        except:
            return 50
    
    def _check_pushup_elbows(self, landmarks: Dict, angles: Dict) -> float:
        """Check elbow position for push-ups"""
        try:
            left_elbow = angles.get('left_elbow', 90)
            right_elbow = angles.get('right_elbow', 90)
            
            # Ideal elbow angle during push-up is around 45-90 degrees
            ideal_range = (45, 90)
            
            def score_angle(angle):
                if ideal_range[0] <= angle <= ideal_range[1]:
                    return 100
                else:
                    deviation = min(abs(angle - ideal_range[0]), abs(angle - ideal_range[1]))
                    return max(0, 100 - deviation * 2)
            
            left_score = score_angle(left_elbow)
            right_score = score_angle(right_elbow)
            
            return (left_score + right_score) / 2
        except:
            return 50
    
    def _check_pushup_rom(self, landmarks: Dict, angles: Dict) -> float:
        """Check range of motion for push-ups"""
        try:
            # This would need to be calculated across multiple frames
            # For now, return a basic score based on elbow angles
            left_elbow = angles.get('left_elbow', 90)
            right_elbow = angles.get('right_elbow', 90)
            
            avg_elbow = (left_elbow + right_elbow) / 2
            
            # Good ROM means elbows bend to around 45-60 degrees
            if 45 <= avg_elbow <= 60:
                return 100
            elif 30 <= avg_elbow <= 75:
                return 80
            else:
                return 60
        except:
            return 50
    
    def _check_squat_knees(self, landmarks: Dict, angles: Dict) -> float:
        """Check knee tracking for squats"""
        try:
            # Check if knees track over toes (no valgus collapse)
            left_knee_x = landmarks['left_knee'][0]
            left_ankle_x = landmarks['left_ankle'][0]
            right_knee_x = landmarks['right_knee'][0]
            right_ankle_x = landmarks['right_ankle'][0]
            
            # Calculate knee-ankle alignment
            left_alignment = abs(left_knee_x - left_ankle_x)
            right_alignment = abs(right_knee_x - right_ankle_x)
            
            # Good alignment means knees are close to being over ankles
            max_deviation = 0.1  # 10% of body width
            
            left_score = max(0, 100 - (left_alignment / max_deviation * 100))
            right_score = max(0, 100 - (right_alignment / max_deviation * 100))
            
            return (left_score + right_score) / 2
        except:
            return 50
    
    def _check_squat_depth(self, landmarks: Dict, angles: Dict) -> float:
        """Check squat depth"""
        try:
            left_knee = angles.get('left_knee', 90)
            right_knee = angles.get('right_knee', 90)
            
            avg_knee_angle = (left_knee + right_knee) / 2
            
            # Good squat depth: knee angle around 90 degrees or less
            if avg_knee_angle <= 90:
                return 100
            elif avg_knee_angle <= 110:
                return 80
            elif avg_knee_angle <= 130:
                return 60
            else:
                return 40
        except:
            return 50
    
    def _check_squat_back(self, landmarks: Dict, angles: Dict) -> float:
        """Check back position for squats"""
        try:
            # Check torso angle
            shoulder_y = (landmarks['left_shoulder'][1] + landmarks['right_shoulder'][1]) / 2
            hip_y = (landmarks['left_hip'][1] + landmarks['right_hip'][1]) / 2
            
            # Calculate torso lean
            torso_lean = abs(landmarks['left_shoulder'][0] - landmarks['left_hip'][0])
            
            # Moderate forward lean is acceptable, excessive lean is not
            if torso_lean < 0.1:
                return 100
            elif torso_lean < 0.2:
                return 80
            else:
                return 60
        except:
            return 50
    
    def _check_plank_alignment(self, landmarks: Dict, angles: Dict) -> float:
        """Check plank alignment"""
        try:
            # Similar to push-up alignment but stricter
            shoulder_y = (landmarks['left_shoulder'][1] + landmarks['right_shoulder'][1]) / 2
            hip_y = (landmarks['left_hip'][1] + landmarks['right_hip'][1]) / 2
            ankle_y = (landmarks['left_ankle'][1] + landmarks['right_ankle'][1]) / 2
            
            # Check for straight line
            total_height = abs(shoulder_y - ankle_y)
            hip_deviation = abs(hip_y - (shoulder_y + ankle_y) / 2)
            
            if total_height > 0:
                alignment_score = 100 - (hip_deviation / total_height * 300)  # Stricter than push-up
                return max(0, alignment_score)
            
            return 50
        except:
            return 50
    
    def _check_plank_hips(self, landmarks: Dict, angles: Dict) -> float:
        """Check hip position for plank"""
        try:
            left_hip = angles.get('left_hip', 180)
            right_hip = angles.get('right_hip', 180)
            
            avg_hip_angle = (left_hip + right_hip) / 2
            
            # Ideal hip angle for plank is around 180 degrees (straight)
            deviation = abs(180 - avg_hip_angle)
            score = max(0, 100 - deviation * 2)
            
            return score
        except:
            return 50
    
    def _check_plank_shoulders(self, landmarks: Dict, angles: Dict) -> float:
        """Check shoulder stability for plank"""
        try:
            # Check if shoulders are directly over elbows/wrists
            left_shoulder_x = landmarks['left_shoulder'][0]
            left_elbow_x = landmarks['left_elbow'][0]
            right_shoulder_x = landmarks['right_shoulder'][0]
            right_elbow_x = landmarks['right_elbow'][0]
            
            left_alignment = abs(left_shoulder_x - left_elbow_x)
            right_alignment = abs(right_shoulder_x - right_elbow_x)
            
            max_deviation = 0.05  # 5% deviation allowed
            
            left_score = max(0, 100 - (left_alignment / max_deviation * 100))
            right_score = max(0, 100 - (right_alignment / max_deviation * 100))
            
            return (left_score + right_score) / 2
        except:
            return 50
    
    def _generic_form_analysis(self, landmarks: Dict, angles: Dict) -> Dict[str, float]:
        """Generic form analysis for unknown exercises"""
        return {
            "posture": 75,
            "symmetry": 80,
            "stability": 70
        }
    
    def _analyze_movement_pattern(self, frames_data: List[Dict], exercise_name: str) -> Dict[str, Any]:
        """Analyze movement pattern across all frames"""
        
        if not frames_data:
            return {
                "rep_count": 0,
                "timing": {},
                "average_scores": {},
                "quality_metrics": {}
            }
        
        # Calculate average form scores
        all_scores = {}
        for frame in frames_data:
            for checkpoint, score in frame["form_scores"].items():
                if checkpoint not in all_scores:
                    all_scores[checkpoint] = []
                all_scores[checkpoint].append(score)
        
        average_scores = {
            checkpoint: sum(scores) / len(scores)
            for checkpoint, scores in all_scores.items()
        }
        
        # Count repetitions (simplified - based on movement patterns)
        rep_count = self._count_repetitions(frames_data, exercise_name)
        
        # Analyze timing
        timing_analysis = self._analyze_timing(frames_data, rep_count)
        
        # Quality metrics
        quality_metrics = self._calculate_quality_metrics(frames_data)
        
        return {
            "rep_count": rep_count,
            "timing": timing_analysis,
            "average_scores": average_scores,
            "quality_metrics": quality_metrics
        }
    
    def _count_repetitions(self, frames_data: List[Dict], exercise_name: str) -> int:
        """Count repetitions based on movement patterns"""
        
        if len(frames_data) < 10:  # Need minimum frames
            return 0
        
        # Use key angle changes to detect reps
        if 'push' in exercise_name.lower():
            # Use elbow angles for push-ups
            angles = []
            for frame in frames_data:
                left_elbow = frame["angles"].get('left_elbow', 90)
                right_elbow = frame["angles"].get('right_elbow', 90)
                angles.append((left_elbow + right_elbow) / 2)
        
        elif 'squat' in exercise_name.lower():
            # Use knee angles for squats
            angles = []
            for frame in frames_data:
                left_knee = frame["angles"].get('left_knee', 90)
                right_knee = frame["angles"].get('right_knee', 90)
                angles.append((left_knee + right_knee) / 2)
        
        else:
            # Generic rep counting
            return max(1, len(frames_data) // 30)  # Estimate based on video length
        
        # Find peaks and valleys in angle data
        reps = self._find_movement_cycles(angles)
        return max(1, reps)
    
    def _find_movement_cycles(self, angles: List[float]) -> int:
        """Find movement cycles in angle data"""
        if len(angles) < 10:
            return 1
        
        # Smooth the data
        smoothed = []
        window = 3
        for i in range(len(angles)):
            start = max(0, i - window)
            end = min(len(angles), i + window + 1)
            smoothed.append(sum(angles[start:end]) / (end - start))
        
        # Find local minima (bottom of movement)
        minima = []
        for i in range(1, len(smoothed) - 1):
            if smoothed[i] < smoothed[i-1] and smoothed[i] < smoothed[i+1]:
                minima.append(i)
        
        # Filter minima that are too close together
        filtered_minima = []
        min_distance = len(smoothed) // 10  # Minimum frames between reps
        
        for minimum in minima:
            if not filtered_minima or minimum - filtered_minima[-1] >= min_distance:
                filtered_minima.append(minimum)
        
        return len(filtered_minima)
    
    def _analyze_timing(self, frames_data: List[Dict], rep_count: int) -> Dict[str, Any]:
        """Analyze timing of movements"""
        total_time = frames_data[-1]["timestamp"] - frames_data[0]["timestamp"]
        
        return {
            "total_duration": total_time,
            "average_rep_time": total_time / max(1, rep_count),
            "tempo": "controlled" if total_time / max(1, rep_count) > 2 else "fast"
        }
    
    def _calculate_quality_metrics(self, frames_data: List[Dict]) -> Dict[str, Any]:
        """Calculate overall movement quality metrics"""
        
        # Calculate consistency (standard deviation of form scores)
        all_scores = []
        for frame in frames_data:
            frame_avg = sum(frame["form_scores"].values()) / len(frame["form_scores"])
            all_scores.append(frame_avg)
        
        if len(all_scores) > 1:
            consistency = 100 - (np.std(all_scores) * 2)  # Lower std = higher consistency
        else:
            consistency = 100
        
        # Calculate smoothness (how smooth the movement is)
        smoothness = self._calculate_smoothness(frames_data)
        
        return {
            "consistency": max(0, min(100, consistency)),
            "smoothness": smoothness,
            "overall_quality": (consistency + smoothness) / 2
        }
    
    def _calculate_smoothness(self, frames_data: List[Dict]) -> float:
        """Calculate movement smoothness"""
        if len(frames_data) < 3:
            return 100
        
        # Calculate velocity changes in key joints
        velocities = []
        
        for i in range(1, len(frames_data)):
            prev_frame = frames_data[i-1]
            curr_frame = frames_data[i]
            
            # Calculate position changes
            position_changes = []
            for landmark in ['left_elbow', 'right_elbow', 'left_knee', 'right_knee']:
                if landmark in prev_frame["landmarks"] and landmark in curr_frame["landmarks"]:
                    prev_pos = prev_frame["landmarks"][landmark]
                    curr_pos = curr_frame["landmarks"][landmark]
                    
                    change = np.sqrt(
                        (curr_pos[0] - prev_pos[0])**2 + 
                        (curr_pos[1] - prev_pos[1])**2
                    )
                    position_changes.append(change)
            
            if position_changes:
                velocities.append(sum(position_changes) / len(position_changes))
        
        if len(velocities) > 1:
            # Smoothness is inversely related to velocity variance
            velocity_variance = np.var(velocities)
            smoothness = max(0, 100 - velocity_variance * 1000)
        else:
            smoothness = 100
        
        return smoothness
    
    def _generate_feedback(self, analysis_results: Dict, exercise_name: str) -> Dict[str, Any]:
        """Generate comprehensive feedback based on analysis"""
        
        form_scores = analysis_results["form_scores"]
        overall_score = sum(form_scores.values()) / len(form_scores) if form_scores else 50
        
        # Generate detailed feedback
        detailed_feedback = []
        improvements = []
        
        for checkpoint, score in form_scores.items():
            if score >= 90:
                detailed_feedback.append({
                    "checkpoint": checkpoint,
                    "score": score,
                    "feedback": f"Excellent {checkpoint.replace('_', ' ')}!",
                    "status": "excellent"
                })
            elif score >= 75:
                detailed_feedback.append({
                    "checkpoint": checkpoint,
                    "score": score,
                    "feedback": f"Good {checkpoint.replace('_', ' ')}, minor adjustments needed.",
                    "status": "good"
                })
            elif score >= 60:
                detailed_feedback.append({
                    "checkpoint": checkpoint,
                    "score": score,
                    "feedback": f"Fair {checkpoint.replace('_', ' ')}, focus on improvement.",
                    "status": "fair"
                })
            else:
                detailed_feedback.append({
                    "checkpoint": checkpoint,
                    "score": score,
                    "feedback": f"Poor {checkpoint.replace('_', ' ')}, needs significant work.",
                    "status": "poor"
                })
                improvements.append(f"Work on {checkpoint.replace('_', ' ')}")
        
        # Determine risk level
        if overall_score >= 80:
            risk_level = "low"
        elif overall_score >= 60:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        # Add general improvements
        if analysis_results["movement_quality"]["consistency"] < 70:
            improvements.append("Focus on consistent movement patterns")
        
        if analysis_results["movement_quality"]["smoothness"] < 70:
            improvements.append("Work on smoother, more controlled movements")
        
        return {
            "overall_score": round(overall_score, 1),
            "detailed_feedback": detailed_feedback,
            "improvements": improvements,
            "risk_level": risk_level
        }