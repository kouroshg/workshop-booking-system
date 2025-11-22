from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Enrollment, Course, User
from datetime import datetime
import secrets
import qrcode
from io import BytesIO
import base64

enrollments_bp = Blueprint('enrollments', __name__)

def generate_qr_code_data(enrollment_id, course_id, student_id):
    """Generate unique QR code data for enrollment"""
    return f"ENROLL:{enrollment_id}:{course_id}:{student_id}:{secrets.token_urlsafe(16)}"

def create_qr_code_image(qr_data):
    """Create QR code image and return as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.read()).decode('utf-8')

@enrollments_bp.route('', methods=['GET'])
@jwt_required()
def get_enrollments():
    """Get enrollments for current user or all enrollments if admin"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role == 'admin':
        enrollments = Enrollment.query.all()
    else:
        enrollments = Enrollment.query.filter_by(student_id=user_id).all()
    
    return jsonify([enrollment.to_dict() for enrollment in enrollments]), 200

@enrollments_bp.route('/course/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_enrollments(course_id):
    """Get all enrollments for a specific course (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    return jsonify([enrollment.to_dict() for enrollment in enrollments]), 200

@enrollments_bp.route('', methods=['POST'])
@jwt_required()
def enroll_in_course():
    """Enroll in a course (student only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role == 'admin':
        return jsonify({'error': 'Admins cannot enroll in courses'}), 403
    
    data = request.get_json()
    course_id = data.get('course_id')
    
    if not course_id:
        return jsonify({'error': 'Course ID required'}), 400
    
    course = Course.query.get_or_404(course_id)
    
    # Check if already enrolled
    existing_enrollment = Enrollment.query.filter_by(
        student_id=user_id,
        course_id=course_id
    ).first()
    
    if existing_enrollment:
        return jsonify({'error': 'Already enrolled in this course'}), 400
    
    # Check if course is full
    if course.is_full():
        return jsonify({'error': 'Course is full'}), 400
    
    # Check for overlapping enrollments
    user_enrollments = Enrollment.query.filter_by(student_id=user_id).all()
    user_courses = [e.course for e in user_enrollments if e.course]
    
    for enrolled_course in user_courses:
        if course.overlaps_with(enrolled_course):
            return jsonify({
                'error': f'This course overlaps with "{enrolled_course.title}" which you are already enrolled in'
            }), 400
    
    # Create enrollment
    enrollment = Enrollment(
        student_id=user_id,
        course_id=course_id
    )
    
    db.session.add(enrollment)
    db.session.flush()  # Get the enrollment ID
    
    # Generate QR code data
    enrollment.qr_code_data = generate_qr_code_data(enrollment.id, course_id, user_id)
    db.session.commit()
    
    # Generate QR code image
    qr_image = create_qr_code_image(enrollment.qr_code_data)
    
    return jsonify({
        'enrollment': enrollment.to_dict(),
        'qr_code_image': qr_image
    }), 201

@enrollments_bp.route('/<int:enrollment_id>/qr', methods=['GET'])
@jwt_required()
def get_enrollment_qr(enrollment_id):
    """Get QR code for an enrollment"""
    user_id = get_jwt_identity()
    enrollment = Enrollment.query.get_or_404(enrollment_id)
    
    # Check if user owns this enrollment or is admin
    if enrollment.student_id != user_id:
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
    
    qr_image = create_qr_code_image(enrollment.qr_code_data)
    
    return jsonify({
        'qr_code_data': enrollment.qr_code_data,
        'qr_code_image': qr_image
    }), 200

@enrollments_bp.route('/<int:enrollment_id>', methods=['DELETE'])
@jwt_required()
def cancel_enrollment(enrollment_id):
    """Cancel an enrollment"""
    user_id = get_jwt_identity()
    enrollment = Enrollment.query.get_or_404(enrollment_id)
    
    # Check if user owns this enrollment or is admin
    if enrollment.student_id != user_id:
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(enrollment)
    db.session.commit()
    
    return jsonify({'message': 'Enrollment cancelled'}), 200

