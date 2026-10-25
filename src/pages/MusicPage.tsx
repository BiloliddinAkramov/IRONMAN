import React, { useRef } from 'react';
import { useAudio } from '../features/audio/AudioContext';
import { Button } from '../components/ui/Button';
import {
  Music2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Trash2,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  Info,
  Dumbbell,
} from 'lucide-react';

export const MusicPage: React.FC = () => {
  const {
    playerState,
    tracks,
    addTracks,
    removeTrack,
    reorderTracks,
    playTrack,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
  } = useAudio();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await addTracks(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-50/80 via-white to-blue-50/40 rounded-2xl sm:rounded-3xl border border-cyan-200/90 border-l-[5px] border-l-cyan-600 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
              <Dumbbell className="w-4 h-4" />
              <span>TRENING VA INTIZOM MUSIQASI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Mahalliy Musiqa Pleyeri
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mashg‘ulotlar va motivatsiya uchun o‘z treklaringizni yuklab oling va tinglang.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="audio/*"
              className="hidden"
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderOpen className="w-4 h-4 mr-1.5" />
              Qurilmadan audio yuklash
            </Button>
          </div>
        </div>
      </div>

      {/* Main Player Console */}
      <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-sm border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-400">
              Musiqa Ijrosi
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
              {playerState.currentTrack ? playerState.currentTrack.title : 'Trek tanlanmagan'}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {playerState.currentTrack ? playerState.currentTrack.file_name : 'Pleylistdan trekni tanlang'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
            <span>{formatSeconds(playerState.currentTime)}</span>
            <span>/</span>
            <span>{formatSeconds(playerState.duration)}</span>
          </div>
        </div>

        {/* Seek Bar */}
        <div>
          <input
            type="range"
            min="0"
            max={playerState.duration || 100}
            value={playerState.currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* Shuffle / Repeat */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                playerState.isShuffle
                  ? 'text-blue-400 bg-blue-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Aralashtirish (Shuffle)"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={cycleRepeat}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                playerState.repeatMode !== 'off'
                  ? 'text-blue-400 bg-blue-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={`Takrorlash: ${playerState.repeatMode}`}
            >
              {playerState.repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Primary Transport (Prev, Play/Pause, Next) */}
          <div className="flex items-center gap-3">
            <button
              onClick={previous}
              className="p-2 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Oldingi trek"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => (playerState.isPlaying ? pause() : play())}
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-md cursor-pointer"
              aria-label={playerState.isPlaying ? 'Pauza' : 'Ijro'}
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={next}
              className="p-2 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Keyingi trek"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 w-32">
            <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={playerState.volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Playlist Items */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Pleylistdagi treklari ({tracks.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Trek ustiga bosing va tinglang
          </span>
        </div>

        {tracks.length === 0 ? (
          <div className="p-8 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
            Hozircha pleylistda treklar yo‘q.{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Qurilmadan audio yuklash
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tracks.map((track, idx) => {
              const isPlayingThis =
                playerState.currentTrack?.id === track.id && playerState.isPlaying;
              const isSelected = playerState.currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  className={`py-2.5 px-3 rounded-lg flex items-center justify-between gap-3 text-xs transition-colors ${
                    isSelected ? 'bg-blue-50/70 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => playTrack(track)}
                  >
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isPlayingThis ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold truncate">{track.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{track.file_name}</p>
                    </div>
                  </div>

                  {/* Actions: Reorder and delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      disabled={idx === 0}
                      onClick={() => reorderTracks(idx, idx - 1)}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded cursor-pointer"
                      title="Yuqoriga"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === tracks.length - 1}
                      onClick={() => reorderTracks(idx, idx + 1)}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded cursor-pointer"
                      title="Pastga"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeTrack(track.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded ml-1 cursor-pointer"
                      title="Pleylistdan o‘chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Platform & Background Playback Explanation Card */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Fon rejimida ijro (Android APK vs Veb)</span>
        </div>
        <p className="leading-relaxed text-[11px] text-slate-500">
          <strong>Android APK</strong> ilovasida fon xizmati (Foreground Service & MediaSession) ekran qulflanganda ham musiqa to‘xtamasdan yangrashini ta’minlaydi.
        </p>
        <p className="leading-relaxed text-[11px] text-slate-500">
          <strong>Desktop brauzerda</strong> MediaSession API orqali klaviatura va tizim paneli orqali boshqarishingiz mumkin.
        </p>
      </div>
    </div>
  );
};
