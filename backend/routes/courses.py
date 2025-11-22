from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Course, User, Enrollment
from datetime import datetime
from sqlalchemy import and_

courses_bp = Blueprint('courses', __name__)

@courses_bp.route('', methods=['GET'])
def get_courses():
    """Get all courses (public endpoint)"""
    courses = Course.query.order_by(Course.start_time.asc()).all()
    return jsonify([course.to_dict() for course in courses]), 200

@courses_bp.route('/<int:course_id>', methods=['GET'])
def get_course(course_id):
    """Get a specific course by ID (public endpoint for shareable links)"""
    course = Course.query.get_or_404(course_id)
    return jsonify(course.to_dict()), 200

@courses_bp.route('', methods=['POST'])
@jwt_required()
def create_course():
    """Create a new course (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('start_time') or not data.get('end_time'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    if start_time >= end_time:
        return jsonify({'error': 'End time must be after start time'}), 400
    
    course = Course(
        title=data['title'],
        description=data.get('description', ''),
        instructor_id=user_id,
        start_time=start_time,
        end_time=end_time,
        location=data.get('location', ''),
        capacity=data.get('capacity', 30)
    )
    
    db.session.add(course)
    db.session.commit()
    
    return jsonify(course.to_dict()), 201

@courses_bp.route('/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    """Update a course (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    course = Course.query.get_or_404(course_id)
    data = request.get_json()
    
    if 'title' in data:
        course.title = data['title']
    if 'description' in data:
        course.description = data['description']
    if 'start_time' in data:
        course.start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
    if 'end_time' in data:
        course.end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
    if 'location' in data:
        course.location = data['location']
    if 'capacity' in data:
        course.capacity = data['capacity']
    
    db.session.commit()
    
    return jsonify(course.to_dict()), 200

@courses_bp.route('/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    """Delete a course (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    
    return jsonify({'message': 'Course deleted'}), 200

