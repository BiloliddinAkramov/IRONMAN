import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import { ChallengeProvider } from '../features/challenges/ChallengeContext';
import { TaskProvider } from '../features/tasks/TaskContext';
import { AudioProvider } from '../features/audio/AudioContext';
import { TimerProvider } from '../features/timer/TimerContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChallengeProvider>
          <TaskProvider>
            <TimerProvider>
              <AudioProvider>{children}</AudioProvider>
            </TimerProvider>
          </TaskProvider>
        </ChallengeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
