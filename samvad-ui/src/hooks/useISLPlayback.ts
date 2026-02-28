import { useState, useCallback } from 'react';
import type { ClipItem } from '../services/islService';

interface PlaybackState {
    isPlaying: boolean;
    currentIndex: number;
    currentWord: string;
}

export function useISLPlayback(
    videoRef: React.RefObject<HTMLVideoElement>
) {
    const [state, setState] = useState<PlaybackState>({
        isPlaying: false,
        currentIndex: -1,
        currentWord: '',
    });

    const playClips = useCallback(
        (clips: ClipItem[], speed: number) => {
            if (!videoRef.current || clips.length === 0) return;

            const video = videoRef.current;

            function loadNext(index: number) {
                if (index >= clips.length) {
                    setState({ isPlaying: false, currentIndex: -1, currentWord: '' });
                    return;
                }
                const clip = clips[index];
                video.src = clip.url;
                video.playbackRate = speed;
                setState({ isPlaying: true, currentIndex: index, currentWord: clip.word });
                video.play().catch(console.error);
                video.onended = () => loadNext(index + 1);
            }

            loadNext(0);
        },
        []
    );

    const stop = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.src = '';
        }
        setState({ isPlaying: false, currentIndex: -1, currentWord: '' });
    }, []);

    return { ...state, playClips, stop };
}
