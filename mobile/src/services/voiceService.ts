import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nlpService } from './nlpService';

const WHISPER_API_KEY = 'WHISPER_API_KEY';

// Dynamic import to handle missing native module
let Audio: typeof import('expo-av').Audio | null = null;

async function loadAudio() {
  try {
    const expoAv = await import('expo-av');
    Audio = expoAv.Audio;
  } catch (error) {
    console.warn('expo-av not available (requires dev build)');
    Audio = null;
  }
}

// Initialize on module load
loadAudio();

export interface VoiceTranscription {
  text: string;
  confidence: number;
  parsedTask?: ReturnType<typeof nlpService.parseQuickAdd>;
}

class VoiceService {
  private recording: any = null;
  private apiKey: string | null = null;

  async initialize(): Promise<void> {
    try {
      this.apiKey = await AsyncStorage.getItem(WHISPER_API_KEY);
    } catch (error) {
      console.error('Error loading voice service settings:', error);
    }
  }

  async setApiKey(apiKey: string): Promise<void> {
    this.apiKey = apiKey;
    await AsyncStorage.setItem(WHISPER_API_KEY, apiKey);
  }

  isAvailable(): boolean {
    return Audio !== null;
  }

  async requestPermissions(): Promise<boolean> {
    if (!Audio) {
      console.warn('Audio not available');
      return false;
    }
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      return granted;
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  async startRecording(): Promise<boolean> {
    if (!Audio) {
      console.warn('Audio not available (requires dev build)');
      return false;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Audio permission not granted');
        return false;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: 2, // MPEG_4
          audioEncoder: 3, // AAC
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: 127, // HIGH
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });
      await recording.startAsync();

      this.recording = recording;
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<string | null> {
    if (!Audio) return null;

    try {
      if (!this.recording) {
        console.warn('No active recording');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      this.recording = null;
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.recording = null;
      return null;
    }
  }

  async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  }

  isRecording(): boolean {
    return this.recording !== null;
  }

  async transcribeAudio(audioUri: string): Promise<VoiceTranscription | null> {
    try {
      // If no API key, use mock transcription for demo
      if (!this.apiKey) {
        console.warn('No Whisper API key configured, using mock transcription');
        return this.mockTranscription();
      }

      // Read the file
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        console.error('Audio file does not exist');
        return null;
      }

      // Create form data for Whisper API
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'fr');
      formData.append('response_format', 'json');

      // Call OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Whisper API error:', error);
        return null;
      }

      const result = await response.json();
      const text = result.text.trim();

      // Parse the transcribed text using NLP service
      const parsedTask = nlpService.parseQuickAdd(text);

      return {
        text,
        confidence: 0.95, // Whisper doesn't return confidence, assume high
        parsedTask,
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return null;
    }
  }

  private mockTranscription(): VoiceTranscription {
    // Mock transcription for testing without API key
    const mockTexts = [
      'Rendez-vous dentiste demain à 14h',
      'Acheter du pain ce soir',
      'Rappeler Marie pour le projet urgent',
      'Réunion équipe lundi 10h',
    ];
    const text = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    const parsedTask = nlpService.parseQuickAdd(text);

    return {
      text,
      confidence: 0.9,
      parsedTask,
    };
  }

  async recordAndTranscribe(): Promise<VoiceTranscription | null> {
    const started = await this.startRecording();
    if (!started) return null;

    // This should be called externally when the user stops recording
    // For now, return null as this is just the setup
    return null;
  }
}

export const voiceService = new VoiceService();
