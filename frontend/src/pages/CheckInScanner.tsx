import { useState } from 'react'
import api from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { CheckCircle, XCircle, User, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface CheckInResult {
  enrollment: {
    id: number
    student_name: string
    student_email: string
    course_title: string
    checked_in: boolean
    checked_in_at: string | null
  }
  message: string
}

const CheckInScanner = () => {
  const [qrData, setQrData] = useState('')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScan = async () => {
    if (!qrData.trim()) {
      setError('Please enter QR code data')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await api.post('/checkin/verify', { qr_code_data: qrData })
      setResult(response.data)
      setQrData('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify QR code')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Check-In Scanner</h1>
        <p className="text-muted-foreground">Scan or enter QR code data to check in students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QR Code Scanner</CardTitle>
          <CardDescription>Enter the QR code data from the student's enrollment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-data">QR Code Data</Label>
            <Input
              id="qr-data"
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Paste QR code data here"
              disabled={loading}
            />
          </div>
          <Button onClick={handleScan} disabled={loading || !qrData.trim()} className="w-full">
            {loading ? 'Processing...' : 'Check In'}
          </Button>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.enrollment.checked_in ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Check-In Successful
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-yellow-600" />
                      Already Checked In
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{result.enrollment.student_name}</div>
                      <div className="text-sm text-muted-foreground">{result.enrollment.student_email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{result.enrollment.course_title}</span>
                  </div>
                  {result.enrollment.checked_in_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Checked in at {format(new Date(result.enrollment.checked_in_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  )}
                </div>
                <Badge variant={result.enrollment.checked_in ? 'default' : 'secondary'} className="w-full justify-center py-2">
                  {result.enrollment.checked_in ? 'Checked In' : 'Already Checked In'}
                </Badge>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CheckInScanner

