import { PlaylistTrack } from '../../types';

export type RepeatMode = 'off' | 'all' | 'one';

export interface AudioPlayerState {
  currentTrack: PlaylistTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  activePlaylistType: 'fitness' | 'study';
}

type StateListener = (state: AudioPlayerState) => void;

class NativeAudioManager {
  private audioElement: HTMLAudioElement;
  private listeners: Set<StateListener> = new Set();
  private tracks: PlaylistTrack[] = [];
  private currentTrackIndex = -1;
  private state: AudioPlayerState = {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isShuffle: false,
    repeatMode: 'off',
    activePlaylistType: 'fitness',
  };

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = 'metadata';
    this.audioElement.volume = this.state.volume;

    this.setupListeners();
    this.setupMediaSession();
  }

  private setupListeners() {
    this.audioElement.addEventListener('timeupdate', () => {
      this.state.currentTime = this.audioElement.currentTime;
      this.notify();
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      this.state.duration = this.audioElement.duration || 0;
      this.notify();
    });

    this.audioElement.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audioElement.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.updateMediaSessionState();
      this.notify();
    });

    this.audioElement.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.updateMediaSessionState();
      this.notify();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback error:', e);
      this.state.isPlaying = false;
      this.notify();
    });
  }

  private setupMediaSession() {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.seek(details.seekTime);
        }
      });
    }
  }

  private updateMediaSessionState() {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = this.state.isPlaying ? 'playing' : 'paused';
    }
  }

  private updateMediaSessionMetadata(track: PlaylistTrack) {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'IRONMAN Playlist',
        album: 'IRONMAN Musiqa',
      });
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public setQueue(tracks: PlaylistTrack[], playlistType: 'fitness' | 'study') {
    this.tracks = tracks;
    this.state.activePlaylistType = playlistType;
    if (tracks.length === 0) {
      this.stop();
      this.state.currentTrack = null;
      this.currentTrackIndex = -1;
      this.notify();
    }
  }

  public playTrack(track: PlaylistTrack, tracks: PlaylistTrack[], playlistType: 'fitness' | 'study') {
    this.setQueue(tracks, playlistType);
    const index = tracks.findIndex((t) => t.id === track.id);
    if (index !== -1) {
      this.currentTrackIndex = index;
      this.loadAndPlay(track);
    }
  }

  private loadAndPlay(track: PlaylistTrack) {
    this.state.currentTrack = track;
    this.updateMediaSessionMetadata(track);

    let src = '';
    if (track.file_blob) {
      src = URL.createObjectURL(track.file_blob);
    } else if (track.local_uri) {
      src = track.local_uri;
    }

    if (src) {
      this.audioElement.src = src;
      this.audioElement.play().catch((err) => {
        console.warn('Playback error, user gesture may be required:', err);
      });
    } else {
      console.warn('No playable source found for track:', track.title);
    }
    this.notify();
  }

  public play() {
    if (this.audioElement.src) {
      this.audioElement.play().catch(console.warn);
    } else if (this.tracks.length > 0) {
      this.currentTrackIndex = 0;
      this.loadAndPlay(this.tracks[0]);
    }
  }

  public pause() {
    this.audioElement.pause();
  }

  public stop() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    this.notify();
  }

  public seek(seconds: number) {
    if (this.audioElement.duration) {
      const clamped = Math.max(0, Math.min(seconds, this.audioElement.duration));
      this.audioElement.currentTime = clamped;
      this.state.currentTime = clamped;
      this.notify();
    }
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(vol, 1));
    this.audioElement.volume = clamped;
    this.state.volume = clamped;
    this.notify();
  }

  public next() {
    if (this.tracks.length === 0) return;

    if (this.state.isShuffle) {
      const nextIndex = Math.floor(Math.random() * this.tracks.length);
      this.currentTrackIndex = nextIndex;
    } else {
      if (this.currentTrackIndex < this.tracks.length - 1) {
        this.currentTrackIndex += 1;
      } else {
        if (this.state.repeatMode === 'all') {
          this.currentTrackIndex = 0;
        } else {
          this.stop();
          return;
        }
      }
    }

    const nextTrack = this.tracks[this.currentTrackIndex];
    if (nextTrack) {
      this.loadAndPlay(nextTrack);
    }
  }

  public previous() {
    if (this.tracks.length === 0) return;

    if (this.audioElement.currentTime > 3) {
      this.audioElement.currentTime = 0;
      return;
    }

    if (this.currentTrackIndex > 0) {
      this.currentTrackIndex -= 1;
    } else {
      this.currentTrackIndex = this.tracks.length - 1;
    }

    const prevTrack = this.tracks[this.currentTrackIndex];
    if (prevTrack) {
      this.loadAndPlay(prevTrack);
    }
  }

  public toggleShuffle() {
    this.state.isShuffle = !this.state.isShuffle;
    this.notify();
  }

  public cycleRepeatMode() {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const nextIdx = (modes.indexOf(this.state.repeatMode) + 1) % modes.length;
    this.state.repeatMode = modes[nextIdx];
    this.notify();
  }

  private handleTrackEnded() {
    if (this.state.repeatMode === 'one' && this.state.currentTrack) {
      this.audioElement.currentTime = 0;
      this.audioElement.play().catch(console.warn);
      return;
    }
    this.next();
  }
}

export const nativeAudio = new NativeAudioManager();
