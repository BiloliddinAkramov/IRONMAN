import React, { createContext, useContext, useEffect, useState } from 'react';
import { nativeAudio, AudioPlayerState } from '../../lib/audio/nativeAudio';
import { PlaylistTrack } from '../../types';

interface AudioContextType {
  playerState: AudioPlayerState;
  tracks: PlaylistTrack[];
  fitnessTracks: PlaylistTrack[]; // Keep alias for backwards compatibility
  addTracks: (files: FileList | File[]) => Promise<void>;
  removeTrack: (trackId: string) => void;
  reorderTracks: (startIndex: number, endIndex: number) => void;
  playTrack: (track: PlaylistTrack) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const LOCAL_STORAGE_PLAYLIST = 'ironman_fitness_playlist';

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isShuffle: false,
    repeatMode: 'off',
    activePlaylistType: 'fitness',
  });

  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);

  // Subscribe to native audio events
  useEffect(() => {
    const unsubscribe = nativeAudio.subscribe((newState) => {
      setPlayerState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Load playlist metadata from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PLAYLIST);
      if (raw) {
        setTracks(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Failed to load audio playlist from storage:', e);
    }
  }, []);

  const savePlaylist = (newTracks: PlaylistTrack[]) => {
    const cleanTracks = newTracks.map(({ file_blob, ...rest }) => rest);
    localStorage.setItem(LOCAL_STORAGE_PLAYLIST, JSON.stringify(cleanTracks));
  };

  const addTracks = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newTracks: PlaylistTrack[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const track: PlaylistTrack = {
        id: 'track-' + Date.now() + '-' + i,
        playlist_id: 'fitness',
        title: cleanName,
        artist: 'Mahalliy fayl',
        file_name: file.name,
        local_uri: URL.createObjectURL(file),
        duration_seconds: 0,
        track_order: 0,
        created_at: new Date().toISOString(),
        file_blob: file,
      };
      newTracks.push(track);
    }

    const updated = [...tracks, ...newTracks].map((t, idx) => ({ ...t, track_order: idx }));
    setTracks(updated);
    savePlaylist(updated);
  };

  const removeTrack = (trackId: string) => {
    const updated = tracks.filter((t) => t.id !== trackId);
    setTracks(updated);
    savePlaylist(updated);
    if (playerState.currentTrack?.id === trackId) {
      nativeAudio.stop();
    }
  };

  const reorderTracks = (startIndex: number, endIndex: number) => {
    const list = [...tracks];
    const [removed] = list.splice(startIndex, 1);
    list.splice(endIndex, 0, removed);
    const updated = list.map((t, idx) => ({ ...t, track_order: idx }));
    setTracks(updated);
    savePlaylist(updated);
  };

  const playTrack = (track: PlaylistTrack) => {
    nativeAudio.playTrack(track, tracks, 'fitness');
  };

  return (
    <AudioContext.Provider
      value={{
        playerState,
        tracks,
        fitnessTracks: tracks, // for backwards compatibility
        addTracks,
        removeTrack,
        reorderTracks,
        playTrack,
        play: () => nativeAudio.play(),
        pause: () => nativeAudio.pause(),
        stop: () => nativeAudio.stop(),
        next: () => nativeAudio.next(),
        previous: () => nativeAudio.previous(),
        seek: (s) => nativeAudio.seek(s),
        setVolume: (v) => nativeAudio.setVolume(v),
        toggleShuffle: () => nativeAudio.toggleShuffle(),
        cycleRepeat: () => nativeAudio.cycleRepeatMode(),
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
