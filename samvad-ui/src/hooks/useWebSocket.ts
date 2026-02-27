import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ISLResult, ReverseModeResult, PipelineStatus } from '../types'

export function useWebSocket() {
    const socketRef = useRef<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [latestISL, setLatestISL] = useState<ISLResult | null>(null)
    const [reverseResult, setReverseResult] = useState<ReverseModeResult | null>(null)
    const [status, setStatus] = useState<PipelineStatus>({ stage: 'idle', message: '', progress: 0 })

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
        })
        socketRef.current = socket

        socket.on('connect', () => setIsConnected(true))
        socket.on('disconnect', () => setIsConnected(false))
        socket.on('isl_result', (data: ISLResult) => setLatestISL(data))
        socket.on('reverse_result', (data: ReverseModeResult) => setReverseResult(data))
        socket.on('pipeline_status', (data: PipelineStatus) => setStatus(data))

        return () => { socket.disconnect() }
    }, [])

    const sendAudioChunk = useCallback((audioBase64: string, sequence: number) => {
        socketRef.current?.emit('audio_chunk', { audio_base64: audioBase64, sequence, timestamp: Date.now() })
    }, [])

    const sendVideoFrame = useCallback((frameBase64: string) => {
        socketRef.current?.emit('video_frame', { frame_base64: frameBase64, timestamp: Date.now() })
    }, [])

    const startLiveStream = useCallback((settings: { language: string }) => {
        socketRef.current?.emit('start_stream', settings)
    }, [])

    const stopLiveStream = useCallback(() => {
        socketRef.current?.emit('stop_stream')
    }, [])

    return {
        isConnected,
        latestISL,
        reverseResult,
        status,
        sendAudioChunk,
        sendVideoFrame,
        startLiveStream,
        stopLiveStream,
    }
}
