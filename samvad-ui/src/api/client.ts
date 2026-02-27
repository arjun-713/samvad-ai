import axios from 'axios'
import type { ISLResult, ProcessedVideo, Language } from '../types'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 60000,
})

export const islApi = {
    textToISL: (text: string, language: string = 'hi-IN') =>
        api.post<ISLResult>('/api/text-to-isl', { text, language }),

    processVideo: (file: File, onProgress?: (pct: number) => void) => {
        const formData = new FormData()
        formData.append('video', file)
        return api.post<ProcessedVideo>('/api/process-video', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000,
            onUploadProgress: (e) => {
                if (onProgress && e.total) onProgress(Math.round(e.loaded / e.total * 100))
            }
        })
    },

    getLanguages: () => api.get<Language[]>('/api/languages'),

    health: () => api.get('/api/health'),
}

export default api
