'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'
import { CalendarDays, FileImage, FileText, Upload, Camera, ExternalLink, Trash2 } from 'lucide-react'

export default function PatientHealthRecordsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [name, setName] = useState('')
  const [healthCondition, setHealthCondition] = useState('')
  const [prescribedTablets, setPrescribedTablets] = useState('')
  const [file, setFile] = useState<{ name: string; type: string; data: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadReports = () => {
    apiClient.get('/reports')
      .then(response => setReports(response.data))
      .catch(error => setMessage(error.response?.data?.error ?? 'Could not load health records'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    loadReports()
  }, [])

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (selected.size > 10 * 1024 * 1024) {
      setMessage('Please choose a file smaller than 10 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setFile({ name: selected.name, type: selected.type || 'application/octet-stream', data: String(reader.result) })
    reader.readAsDataURL(selected)
  }

  const saveReport = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) { setMessage('Please attach a report, document, or photo.'); return }
    setSaving(true)
    setMessage('')
    try {
      await apiClient.post('/reports', { name: name || file.name, fileType: file.type, fileData: file.data, healthCondition, prescribedTablets })
      setName('')
      setHealthCondition('')
      setPrescribedTablets('')
      setFile(null)
      loadReports()
      setMessage('✅ Health record added successfully.')
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.error ?? 'Could not save this record'}`)
    } finally {
      setSaving(false)
    }
  }

  const removeReport = async (id: string) => {
    try {
      await apiClient.delete(`/reports/${id}`)
      setReports(current => current.filter(report => report._id !== id))
    } catch (error: any) {
      setMessage(error.response?.data?.error ?? 'Could not remove this record')
    }
  }

  const openFile = async (reportId: string) => {
    try {
      const res = await apiClient.get(`/reports/${reportId}/file`)
      if (res.data?.fileData) {
        window.open(res.data.fileData, '_blank')
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error ?? 'Could not open file')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-7">
          <p className="text-sm font-semibold text-indigo-600">Personal Health Record</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Reports & Prescriptions</h1>
          <p className="text-gray-500 mt-2">Upload medical PDFs, Word documents, images, or click a photo with your camera.</p>
        </div>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
          <form onSubmit={saveReport} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Add a Health Record</h2>
            <input value={name} onChange={event => setName(event.target.value)} placeholder="Record name (e.g. Blood Test, Prescription)" className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-indigo-400 text-sm" />
            <textarea value={healthCondition} onChange={event => setHealthCondition(event.target.value)} placeholder="Health condition or symptoms" rows={2} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-indigo-400 text-sm resize-none" />
            <textarea value={prescribedTablets} onChange={event => setPrescribedTablets(event.target.value)} placeholder="Tablets currently prescribed (if applicable)" rows={2} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-indigo-400 text-sm resize-none" />

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700">Attach Document or Photo</label>

              <div className="grid grid-cols-2 gap-3">
                {/* PDF / Word / Image upload button */}
                <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl p-4 text-xs font-bold text-indigo-600 cursor-pointer transition text-center">
                  <Upload size={20} />
                  <span>Choose File</span>
                  <span className="text-[10px] text-gray-400 font-normal">PDF, Word, PNG, JPG</span>
                  <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFile} className="hidden" />
                </label>

                {/* Camera Photo capture button */}
                <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-purple-200 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50 rounded-2xl p-4 text-xs font-bold text-purple-600 cursor-pointer transition text-center">
                  <Camera size={20} />
                  <span>Take Photo</span>
                  <span className="text-[10px] text-gray-400 font-normal">Camera Capture</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-2xl text-xs text-indigo-900 border border-indigo-100">
                  <span className="font-semibold truncate max-w-[200px]">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} className="text-red-500 font-bold hover:underline">Remove</button>
                </div>
              )}
            </div>

            {message && <p className={`text-xs px-4 py-3 rounded-xl ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{message}</p>}
            <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-md">{saving ? 'Saving...' : 'Save Health Record'}</button>
          </form>

          <section>
            <h2 className="font-bold text-gray-900 mb-3 text-lg">Saved Records</h2>
            {loading ? (
              <div className="text-gray-400 py-10 text-center">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-10 text-center text-gray-400 text-sm">
                Your uploaded records will appear here.
              </div>
            ) : (
              <div className="grid gap-3">
                {reports.map(report => (
                  <article key={report._id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-3 min-w-0">
                        <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-2xl h-fit shrink-0">
                          {report.fileType?.startsWith('image/') ? <FileImage size={22} /> : <FileText size={22} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate text-base">{report.name}</h3>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <CalendarDays size={13} /> Uploaded {new Date(report.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openFile(report._id)}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 transition"
                        >
                          <ExternalLink size={13} />
                          Open
                        </button>
                        <button
                          onClick={() => removeReport(report._id)}
                          aria-label={`Remove ${report.name}`}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-xl hover:bg-red-50 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {report.healthCondition && <p className="text-sm text-gray-600 mt-4"><span className="font-semibold text-gray-800">Condition:</span> {report.healthCondition}</p>}
                    {report.prescribedTablets && <p className="text-sm text-gray-600 mt-1"><span className="font-semibold text-gray-800">Tablets:</span> {report.prescribedTablets}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
