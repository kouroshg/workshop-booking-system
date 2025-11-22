import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Clock } from 'lucide-react'

interface Course {
  id: number
  title: string
  description: string
  instructor_name: string
  start_time: string
  end_time: string
  location: string
  capacity: number
  enrolled_count: number
  checked_in_count: number
}

const StudentDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchCourses()
    fetchEnrollments()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses')
      setCourses(response.data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollments = async () => {
    try {
      const response = await api.get('/enrollments')
      const enrolledIds = new Set(response.data.map((e: any) => e.course_id))
      setEnrolledCourseIds(enrolledIds)
    } catch (error) {
      console.error('Failed to fetch enrollments:', error)
    }
  }

  const handleEnroll = async (courseId: number) => {
    try {
      await api.post('/enrollments', { course_id: courseId })
      setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]))
      alert('Successfully enrolled!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to enroll')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading courses...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Available Workshops</h1>
        <p className="text-muted-foreground">Browse and enroll in workshops</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const isEnrolled = enrolledCourseIds.has(course.id)
          const isFull = course.enrolled_count >= course.capacity
          const startDate = new Date(course.start_time)
          const endDate = new Date(course.end_time)

          return (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(startDate, 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </div>
                  {course.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {course.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {course.enrolled_count} / {course.capacity} enrolled
                  </div>
                  <div className="text-sm">
                    Instructor: <span className="font-medium">{course.instructor_name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Link to={`/course/${course.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                  {isEnrolled ? (
                    <Badge variant="secondary">Enrolled</Badge>
                  ) : isFull ? (
                    <Badge variant="destructive">Full</Badge>
                  ) : (
                    <Button size="sm" onClick={() => handleEnroll(course.id)}>
                      Enroll
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses available at the moment.</p>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard

