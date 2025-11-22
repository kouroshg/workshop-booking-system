import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { format } from 'date-fns'
import { Plus, Users, CheckCircle, XCircle, Mail, BarChart3 } from 'lucide-react'

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

interface Analytics {
  course_id: number
  course_title: string
  total_enrolled: number
  checked_in: number
  not_checked_in: number
  capacity: number
  attendance_rate: number
}

const AdminDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [analytics, setAnalytics] = useState<Analytics[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [sendingReminders, setSendingReminders] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    capacity: 30,
  })

  useEffect(() => {
    fetchCourses()
    fetchAnalytics()
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

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics')
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const handleCreateCourse = async () => {
    try {
      // Convert local datetime to ISO format
      const startTime = formData.start_time ? new Date(formData.start_time).toISOString() : ''
      const endTime = formData.end_time ? new Date(formData.end_time).toISOString() : ''
      
      await api.post('/courses', {
        ...formData,
        start_time: startTime,
        end_time: endTime,
      })
      setShowCreateDialog(false)
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        capacity: 30,
      })
      fetchCourses()
      fetchAnalytics()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create course')
    }
  }

  const handleSendReminders = async (courseId: number) => {
    setSendingReminders(courseId)
    try {
      const response = await api.post(`/admin/course/${courseId}/reminders`)
      alert(`Reminders sent: ${response.data.sent_count}, Failed: ${response.data.failed_count}`)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send reminders')
    } finally {
      setSendingReminders(null)
    }
  }

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return
    try {
      await api.delete(`/courses/${courseId}`)
      fetchCourses()
      fetchAnalytics()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete course')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage courses and view analytics</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Analytics Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {analytics.map((stat) => (
            <Card key={stat.course_id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium line-clamp-1">{stat.course_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Enrolled</span>
                    <span className="font-medium">{stat.total_enrolled}/{stat.capacity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Checked In</span>
                    <span className="font-medium text-green-600">{stat.checked_in}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className="font-medium">{stat.attendance_rate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">All Courses</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const startDate = new Date(course.start_time)
            const stat = analytics.find((a) => a.course_id === course.id)

            return (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription>
                    {format(startDate, 'MMM d, yyyy h:mm a')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Enrolled</span>
                      <span>{course.enrolled_count}/{course.capacity}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Checked In</span>
                      <span className="text-green-600">{course.checked_in_count}</span>
                    </div>
                    {stat && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Attendance</span>
                        <span>{stat.attendance_rate.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link to={`/course/${course.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSendReminders(course.id)}
                      disabled={sendingReminders === course.id}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {sendingReminders === course.id ? 'Sending...' : 'Send Reminders'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Fill in the details to create a new workshop course</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Workshop Title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Course description"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Room 101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })}
                  min="1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCourse}>Create Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminDashboard

