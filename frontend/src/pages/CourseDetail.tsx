import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

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

interface Enrollment {
  id: number
  course_id: number
  checked_in: boolean
  qr_code_data: string
}

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrImage, setQrImage] = useState<string>('')

  useEffect(() => {
    if (id) {
      fetchCourse()
      fetchEnrollment()
    }
  }, [id])

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`)
      setCourse(response.data)
    } catch (error) {
      console.error('Failed to fetch course:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollment = async () => {
    try {
      const response = await api.get('/enrollments')
      const myEnrollment = response.data.find((e: any) => e.course_id === parseInt(id!))
      if (myEnrollment) {
        setEnrollment(myEnrollment)
        // Fetch QR code
        try {
          const qrResponse = await api.get(`/enrollments/${myEnrollment.id}/qr`)
          setQrImage(qrResponse.data.qr_code_image)
        } catch (error) {
          console.error('Failed to fetch QR code:', error)
        }
      }
    } catch (error) {
      console.error('Failed to fetch enrollment:', error)
    }
  }

  const handleEnroll = async () => {
    if (!id) return
    setEnrolling(true)
    try {
      const response = await api.post('/enrollments', { course_id: parseInt(id) })
      setEnrollment(response.data.enrollment)
      setQrImage(response.data.qr_code_image)
      setShowQR(true)
      await fetchCourse()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to enroll')
    } finally {
      setEnrolling(false)
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  if (loading) {
    return <div className="text-center py-8">Loading course details...</div>
  }

  if (!course) {
    return <div className="text-center py-8">Course not found</div>
  }

  const startDate = new Date(course.start_time)
  const endDate = new Date(course.end_time)
  const isEnrolled = !!enrollment
  const isFull = course.enrolled_count >= course.capacity

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-muted-foreground">by {course.instructor_name}</p>
          </div>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{course.description || 'No description provided.'}</p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <div className="font-medium">{format(startDate, 'EEEE, MMMM d, yyyy')}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </div>
                </div>
              </div>
              {course.location && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm text-muted-foreground">{course.location}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <div className="font-medium">Enrollment</div>
                  <div className="text-sm text-muted-foreground">
                    {course.enrolled_count} of {course.capacity} students enrolled
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Enrollment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEnrolled ? (
                <>
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    You are enrolled
                  </Badge>
                  {enrollment?.checked_in && (
                    <Badge variant="default" className="w-full justify-center py-2">
                      Checked In
                    </Badge>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => setShowQR(true)}
                    disabled={!enrollment?.qr_code_data}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Show QR Code
                  </Button>
                </>
              ) : (
                <>
                  {isFull ? (
                    <Badge variant="destructive" className="w-full justify-center py-2">
                      Course is Full
                    </Badge>
                  ) : (
                    <Button className="w-full" onClick={handleEnroll} disabled={enrolling}>
                      {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Check-in QR Code</DialogTitle>
            <DialogDescription>
              Show this QR code at the workshop venue to check in
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            {enrollment?.qr_code_data ? (
              <>
                {qrImage ? (
                  <img
                    src={`data:image/png;base64,${qrImage}`}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                ) : (
                  <QRCodeSVG value={enrollment.qr_code_data} size={256} />
                )}
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Present this QR code at the workshop for check-in
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">QR code not available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CourseDetail

