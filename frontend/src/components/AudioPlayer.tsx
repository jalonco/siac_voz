import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface AudioPlayerProps {
    url: string;
}

export function AudioPlayer({ url }: AudioPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState('00:00');
    const [duration, setDuration] = useState('00:00');

    useEffect(() => {
        if (!containerRef.current) return;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#3b82f6', // blue-500
            progressColor: '#06b6d4', // cyan-500
            cursorColor: '#22d3ee', // cyan-400
            barWidth: 2,
            barGap: 3,
            barRadius: 3,
            height: 60,
            normalize: true,
            backend: 'MediaElement',
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.load(url);

        wavesurfer.on('ready', () => {
            setLoading(false);
            setDuration(formatTime(wavesurfer.getDuration()));
        });

        wavesurfer.on('audioprocess', () => {
            setCurrentTime(formatTime(wavesurfer.getCurrentTime()));
        });

        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('finish', () => setIsPlaying(false));

        return () => {
            wavesurfer.destroy();
        };
    }, [url]);

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 bg-slate-900/80">
            <h3 className="font-semibold text-lg mb-4 text-white">Reproductor Interactivo</h3>

            <div className="flex items-center gap-4">
                <button
                    onClick={togglePlay}
                    disabled={loading}
                    className={clsx(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
                        loading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                    ) : (
                        <Play className="w-5 h-5 fill-current ml-1" />
                    )}
                </button>

                <div className="flex-1 space-y-2">
                    <div ref={containerRef} className="w-full" />

                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                        <span>{currentTime}</span>
                        <span>{duration}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
