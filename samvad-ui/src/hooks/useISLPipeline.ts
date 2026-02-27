import { useState } from 'react'
import { islApi } from '../api/client'
import type { ISLResult, PipelineStatus } from '../types'

export function useISLPipeline() {
    const [status, setStatus] = useState<PipelineStatus>({ stage: 'idle', message: 'Ready', progress: 0 })
    const [result, setResult] = useState<ISLResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const processText = async (text: string, language: string) => {
        setLoading(true)
        setError(null)
        setResult(null)
        setStatus({ stage: 'transcreating', message: 'Adapting cultural context...', progress: 30 })
        try {
            const res = await islApi.textToISL(text, language)
            setResult(res.data)
            setStatus({ stage: 'complete', message: 'Done!', progress: 100 })
        } catch (e: any) {
            const msg = e.response?.data?.detail || 'Something went wrong. Is the backend running?'
            setError(msg)
            setStatus({ stage: 'error', message: 'Pipeline failed', progress: 0 })
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setStatus({ stage: 'idle', message: 'Ready', progress: 0 })
        setResult(null)
        setError(null)
        setLoading(false)
    }

    return { status, result, error, loading, processText, reset }
}
