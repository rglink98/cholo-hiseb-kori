import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Upload, 
  Trash2, 
  Calendar, 
  User, 
  Music, 
  Volume2, 
  VolumeX, 
  Volume,
  Clock,
  Briefcase,
  Download,
  AlertCircle,
  FolderOpen,
  Folder,
  FolderPlus,
  Scissors,
  RefreshCw,
  Bookmark,
  ChevronDown,
  Search,
  Sparkles,
  FileText,
  Headphones,
  Square
} from 'lucide-react';
import { AudioClip, User as UserType } from '../types';

interface AudioClipsScreenProps {
  currentUser: UserType;
  audioClips: AudioClip[];
  onAddAudioClip: (clip: Omit<AudioClip, 'id' | 'date' | 'enteredBy'>) => void;
  onDeleteAudioClip: (id: string) => void;
  onUpdateAudioClip: (clip: AudioClip) => void;
  isAdmin: boolean;
}

const getVoiceGenderChar = (name: string): string => {
  const lowercaseName = name.toLowerCase();
  const femaleKeywords = [
    'zira', 'hazel', 'susan', 'heera', 'kore', 'ichika', 'haruka', 'nanami', 'midori', 'huihui', 'yaoyao', 
    'heami', 'elsa', 'helena', 'moira', 'clara', 'ayumi', 'sayaka', 'tessa', 'noora', 'linda', 'karen', 
    'samantha', 'veena', 'sangeeta', 'ananya', 'female', 'woman', 'girl', 'lady', 'sherri', 'swara'
  ];
  const maleKeywords = ['david', 'ravi', 'george', 'mark', 'prakash', 'male', 'man', 'boy', 'guy'];
  
  if (femaleKeywords.some(keyword => lowercaseName.includes(keyword))) {
    return '👩 [নারী কণ্ঠ / Female]';
  } else if (maleKeywords.some(keyword => lowercaseName.includes(keyword))) {
    return '👨 [পুরুষ কণ্ঠ / Male]';
  }
  return '🎙️ [সাধারণ সিস্টেম কণ্ঠ]';
};

const AudioClipsScreen: React.FC<AudioClipsScreenProps> = ({ 
  currentUser, 
  audioClips, 
  onAddAudioClip, 
  onDeleteAudioClip, 
  onUpdateAudioClip,
  isAdmin 
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'record' | 'upload' | 'tts'>('list');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Drag and drop / file upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadBase64, setUploadBase64] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadDuration, setUploadDuration] = useState(0);

  // States for Audio Trimming
  const [decodedBuffer, setDecodedBuffer] = useState<AudioBuffer | null>(null);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [sourceDuration, setSourceDuration] = useState<number>(0);
  const [isTrimming, setIsTrimming] = useState<boolean>(false);
  const [trimPlaying, setTrimPlaying] = useState<boolean>(false);
  const [activeTrimSource, setActiveTrimSource] = useState<'record' | 'upload' | null>(null);
  const [showTrimmerPanel, setShowTrimmerPanel] = useState<boolean>(false);
  const trimAudioPlayIntervalRef = useRef<number | null>(null);

  // States for Organization (Folders)
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<string>('সকল অডিও');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [showAddCategoryInput, setShowAddCategoryInput] = useState<boolean>(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('ভয়েস মেমো');
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<string>('অন্যান্য');

  // Text-to-Speech (TTS) creation states
  const [ttsInputText, setTtsInputText] = useState<string>('');
  const [ttsTitleInput, setTtsTitleInput] = useState<string>('');
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  const [ttsCategory, setTtsCategory] = useState<string>('ভয়েস মেমো');
  const [ttsVoices, setTtsVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedTtsVoiceName, setSelectedTtsVoiceName] = useState<string>('');
  const [ttsIsSpeaking, setTtsIsSpeaking] = useState<boolean>(false);
  const [ttsIsPaused, setTtsIsPaused] = useState<boolean>(false);
  
  // Advanced filter & search states for TTS voices
  const [ttsVoiceLanguageFilter, setTtsVoiceLanguageFilter] = useState<'bn_en' | 'all'>('bn_en');
  const [voiceSearchQuery, setVoiceSearchQuery] = useState<string>('');

  // Listeners for cleanup
  useEffect(() => {
    return () => {
      if (trimAudioPlayIntervalRef.current) {
        clearInterval(trimAudioPlayIntervalRef.current);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load SpeechSynthesis voices for TTS Creation with Async Fallbacks
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const updateVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        setTtsVoices(allVoices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      // Fallback interval to guarantee voice list population in slow asynchronous browser instances
      const intervalId = setInterval(() => {
        const allVoices = window.speechSynthesis.getVoices();
        if (allVoices && allVoices.length > 0) {
          setTtsVoices(allVoices);
          clearInterval(intervalId);
        }
      }, 300);

      return () => clearInterval(intervalId);
    }
  }, []);

  // Filter and prioritize SpeechSynthesisVoices dynamically
  const filteredVoicesList = useMemo(() => {
    return ttsVoices.filter(voice => {
      // 1. Language constraint filter
      if (ttsVoiceLanguageFilter === 'bn_en') {
        const langCode = voice.lang.toLowerCase();
        const isBnEn = langCode.startsWith('bn') || langCode.startsWith('en');
        if (!isBnEn) return false;
      }
      
      // 2. Search query filter
      if (voiceSearchQuery.trim()) {
        const query = voiceSearchQuery.toLowerCase();
        const nameMatch = voice.name.toLowerCase().includes(query);
        const langMatch = voice.lang.toLowerCase().includes(query);
        return nameMatch || langMatch;
      }
      
      return true;
    });
  }, [ttsVoices, ttsVoiceLanguageFilter, voiceSearchQuery]);

  // Audio player state for the specific preview in recording tab
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // References for MediaRecorder and timers
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Web Audio Visualizer references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active playing audio tracking for list cards
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [clipProgress, setClipProgress] = useState<{ [id: string]: number }>({});
  const [clipDurations, setClipDurations] = useState<{ [id: string]: number }>({});
  const [clipCurrentTime, setClipCurrentTime] = useState<{ [id: string]: number }>({});
  const activeAudioPlayers = useRef<{ [id: string]: HTMLAudioElement }>({});

  const stopVisualizer = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const startSimulatedVisualizer = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const drawSimulated = () => {
      animationFrameIdRef.current = requestAnimationFrame(drawSimulated);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const bars = 44;
      const spacing = 3;
      const barWidth = (canvas.width / bars);
      
      for (let i = 0; i < bars; i++) {
        let rawHeight = 0;
        if (!isPaused) {
          rawHeight = Math.sin(Date.now() * 0.004 + i * 0.18) * 22 + 
                      Math.cos(Date.now() * 0.008 - i * 0.28) * 16 + 
                      Math.sin(Date.now() * 0.012 + i * 0.4) * 8 + 38;
        } else {
          rawHeight = Math.sin(Date.now() * 0.0015 + i * 0.2) * 2 + 5;
        }
        
        const barHeight = Math.max(4, rawHeight * 0.7);
        ctx.fillStyle = isPaused 
          ? 'rgba(156, 163, 175, 0.4)' 
          : `rgba(59, 130, 246, ${0.45 + (barHeight / 145)})`;

        const y = (canvas.height - barHeight) / 2;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(i * barWidth, y, Math.max(2, barWidth - spacing), barHeight, 3);
        } else {
          ctx.rect(i * barWidth, y, Math.max(2, barWidth - spacing), barHeight);
        }
        ctx.fill();
      }
    };
    drawSimulated();
  };

  useEffect(() => {
    if (isRecording && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!isPaused && streamRef.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.75;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(streamRef.current);
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const drawRealTime = () => {
            if (!analyserRef.current || !canvasRef.current) return;
            animationFrameIdRef.current = requestAnimationFrame(drawRealTime);

            analyserRef.current.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const spacing = 3;
            const barWidth = (canvas.width / bufferLength);
            
            for (let i = 0; i < bufferLength; i++) {
              let value = dataArray[i];
              if (value < 10) value = 0;
              
              const percent = value / 255;
              let barHeight = percent * canvas.height * 0.95;
              
              if (barHeight < 6) {
                barHeight = 5 + Math.sin(Date.now() * 0.006 + i * 0.3) * 3;
              }

              ctx.fillStyle = `rgba(59, 130, 246, ${0.45 + percent * 0.55})`;
              const y = (canvas.height - barHeight) / 2;

              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(i * barWidth, y, Math.max(2.5, barWidth - spacing), barHeight, 3);
              } else {
                ctx.rect(i * barWidth, y, Math.max(2.5, barWidth - spacing), barHeight);
              }
              ctx.fill();
            }
          };

          drawRealTime();
        } catch (err) {
          console.warn("Web Audio Visualizer initial connection failed, switching to premium simulated fallback.", err);
          startSimulatedVisualizer(canvas, ctx);
        }
      } else {
        startSimulatedVisualizer(canvas, ctx);
      }
    } else {
      stopVisualizer();
    }

    return () => {
      stopVisualizer();
    };
  }, [isRecording, isPaused]);

  // Clean messages timers
  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  // Clean audio elements and recorders on unmount
  useEffect(() => {
    return () => {
      stopStreamsAndTimers();
      // Stop all playing audios
      Object.values(activeAudioPlayers.current).forEach(player => {
        player.pause();
      });
    };
  }, []);

  const stopStreamsAndTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    stopVisualizer();
  };

  // Recording controllers
  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    setRecordedBlobUrl(null);
    setRecordedBase64(null);

    const constraints = { audio: true, video: false };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback for Safari/iOS which might not support webm
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const blobUrl = URL.createObjectURL(audioBlob);
        setRecordedBlobUrl(blobUrl);

        // Convert blob to Base64 data URI for offline storage
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(250); // Get data blobs every 250ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Audio recording access error:', err);
      setErrorMsg('মাইক্রোফোন অ্যাক্সেস করা যায়নি। অনুগ্রহ করে পারমিশন চেক করুন।');
    };
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (!isPaused) {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        timerRef.current = window.setInterval(() => {
          setRecordDuration(prev => prev + 1);
        }, 1000);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopStreamsAndTimers();
      // Set default title
      setTitleInput(`অডিও রেকর্ড - ${new Date().toLocaleDateString('bn-BD', { hour: 'numeric', minute: 'numeric' })}`);
    }
  };

  const discardRecording = () => {
    stopStreamsAndTimers();
    setIsRecording(false);
    setIsPaused(false);
    setRecordDuration(0);
    setRecordedBlobUrl(null);
    setRecordedBase64(null);
    setTitleInput('');
  };

  // Convert files to Base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Upload actions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processSelectedFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('audio/')) {
      setErrorMsg('অনুগ্রহ করে শুধুমাত্র অডিও ফাইল নির্বাচন করুন (.mp3 , .wav, .m4a ইত্যাদি)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('ফাইলের আকার সীমাতিক্রান্ত! সর্বোচ্চ ৮ মেগাবাইট ফাইল আপলোড করুন।');
      return;
    }

    setUploadFile(file);
    // Use file name as default title (without extension)
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setUploadTitle(nameWithoutExt);

    try {
      const base64 = await fileToBase64(file);
      setUploadBase64(base64);

      // Dynamically decode duration of uploaded audio snippet
      if (typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const buffer = await file.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(buffer);
          setUploadDuration(Math.round(decoded.duration));
        }
      }
    } catch (err) {
      console.warn('Could not auto-detect uploaded file exact duration, using fallback 0.', err);
      // Just keep upload duration 0 if format not decodable natively
      setUploadDuration(0);
    }
  };

  const saveRecordedAudio = () => {
    if (!recordedBase64 || !titleInput.trim()) {
      setErrorMsg('রেকর্ডিং টাইটেল খালি রাখা যাবে না।');
      return;
    }

    onAddAudioClip({
      title: titleInput.trim(),
      audioUrl: recordedBase64,
      duration: recordDuration,
      category: selectedCategory
    });

    setSuccessMsg('অডিও রেকর্ডটি সফলভাবে সংরক্ষণ করা হয়েছে!');
    setTitleInput('');
    setRecordedBlobUrl(null);
    setRecordedBase64(null);
    setRecordDuration(0);
    setActiveTab('list');
  };

  const saveUploadedAudio = () => {
    if (!uploadBase64 || !uploadTitle.trim()) {
      setErrorMsg('আপলোড করা অডিওটির টাইটেল লিখুন।');
      return;
    }

    onAddAudioClip({
      title: uploadTitle.trim(),
      audioUrl: uploadBase64,
      duration: uploadDuration || 0,
      category: selectedUploadCategory
    });

    setSuccessMsg('অডিও ফাইলটি সফলভাবে আপলোড এবং সংরক্ষিত হয়েছে!');
    setUploadFile(null);
    setUploadTitle('');
    setUploadBase64(null);
    setUploadDuration(0);
    setActiveTab('list');
  };

  // Helper to convert an AudioBuffer slice to WAV Blob
  const bufferToWav = (buffer: AudioBuffer, startSec: number, endSec: number) => {
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.min(buffer.length, Math.floor(endSec * sampleRate));
    const durationSamples = Math.max(0, endSample - startSample);
    const blockAlign = numChannels * 2;
    const byteRate = sampleRate * blockAlign;
    const dataSize = durationSamples * blockAlign;
    const bufferLength = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    const writeString = (v: DataView, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        v.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + dataSize, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw PCM) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate */
    view.setUint32(28, byteRate, true);
    /* block align */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, dataSize, true);

    // Write Interleaved PCM samples
    let offset = 44;
    const channelData: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }

    for (let i = 0; i < durationSamples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        let sample = channelData[channel][startSample + i];
        if (sample < -1) sample = -1;
        if (sample > 1) sample = 1;
        const val = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, val, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const prepareTrimmerForSource = async (sourceType: 'record' | 'upload') => {
    let sourceUrl = '';
    if (sourceType === 'record' && recordedBlobUrl) {
      sourceUrl = recordedBlobUrl;
    } else if (sourceType === 'upload' && uploadBase64) {
      sourceUrl = uploadBase64;
    }

    if (!sourceUrl) {
      setErrorMsg('কাটার জন্য কোনো অডিও সোর্স পাওয়া যায়নি।');
      return;
    }

    setIsTrimming(true);
    setActiveTrimSource(sourceType);
    setShowTrimmerPanel(true);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const response = await fetch(sourceUrl);
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      setDecodedBuffer(decoded);
      setSourceDuration(decoded.duration);
      setTrimStart(0);
      setTrimEnd(decoded.duration);
    } catch (err) {
      console.error('Error decoding audio for trimmer:', err);
      setErrorMsg('ডিভাইস বা ব্রাউজার মেমোরিতে অডিওটি ডিকোড করা যায়নি।');
      setShowTrimmerPanel(false);
    } finally {
      setIsTrimming(false);
    }
  };

  const handleActivateTrimmerForSavedClip = async (clip: AudioClip) => {
    if (!clip.audioUrl) {
      setErrorMsg('টিটিএস অডিও সরাসরি অফলাইনে ট্রিম করা সম্ভব নয়।');
      return;
    }
    setUploadBase64(clip.audioUrl);
    await prepareTrimmerForSource('upload');
  };

  const handleToggleTrimPreview = () => {
    let sourceUrl = '';
    if (activeTrimSource === 'record' && recordedBlobUrl) {
      sourceUrl = recordedBlobUrl;
    } else if (activeTrimSource === 'upload' && uploadBase64) {
      sourceUrl = uploadBase64;
    }

    if (!sourceUrl) return;

    if (trimPlaying) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setTrimPlaying(false);
      if (trimAudioPlayIntervalRef.current) {
        clearInterval(trimAudioPlayIntervalRef.current);
      }
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const aud = new Audio(sourceUrl);
      previewAudioRef.current = aud;
      aud.currentTime = trimStart;
      aud.play().then(() => {
        setTrimPlaying(true);
        trimAudioPlayIntervalRef.current = window.setInterval(() => {
          if (aud.currentTime >= trimEnd) {
            aud.pause();
            setTrimPlaying(false);
            if (trimAudioPlayIntervalRef.current) {
              clearInterval(trimAudioPlayIntervalRef.current);
            }
          }
        }, 50);
      }).catch(err => {
        console.error(err);
      });

      aud.onended = () => {
        setTrimPlaying(false);
        if (trimAudioPlayIntervalRef.current) {
          clearInterval(trimAudioPlayIntervalRef.current);
        }
      };
    }
  };

  const handleExecuteTrimCrop = async () => {
    if (!decodedBuffer) return;
    setIsTrimming(true);
    try {
      const trimmedWavBlob = bufferToWav(decodedBuffer, trimStart, trimEnd);
      const trimmedBlobUrl = URL.createObjectURL(trimmedWavBlob);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        if (activeTrimSource === 'record') {
          setRecordedBlobUrl(trimmedBlobUrl);
          setRecordedBase64(base64Data);
          setRecordDuration(Math.round(trimEnd - trimStart));
          if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
          }
        } else {
          setUploadBase64(base64Data);
          setUploadDuration(Math.round(trimEnd - trimStart));
          const fileToCreate = new File([trimmedWavBlob], `trimmed_${uploadFile?.name || 'audio.wav'}`, { type: 'audio/wav' });
          setUploadFile(fileToCreate);
        }
        setSuccessMsg('অডিওটি ওয়ান-ক্লিকে সফলভাবে ট্রিম ও কাট করা হয়েছে! নিচের প্লেয়ারে রিফ্রেশ দেখতে পাবেন।');
        setShowTrimmerPanel(false);
        setDecodedBuffer(null);
      };
      reader.readAsDataURL(trimmedWavBlob);
    } catch (err) {
      console.error(err);
      setErrorMsg('অডিওটি ক্রপ করতে समस्या হয়েছে।');
    } finally {
      setIsTrimming(false);
    }
  };

  // Preview Playback Controller for newly recorded audio before saving
  const handleTogglePreviewPlay = () => {
    if (!recordedBlobUrl) return;
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(recordedBlobUrl);
      previewAudioRef.current.onended = () => {
        setPreviewPlaying(false);
      };
    }

    if (previewPlaying) {
      previewAudioRef.current.pause();
      setPreviewPlaying(false);
    } else {
      previewAudioRef.current.play();
      setPreviewPlaying(true);
    }
  };

  // Render individual list audio controls
  const togglePlayClip = (clip: AudioClip) => {
    const isPlayingThis = playingClipId === clip.id;

    // Pause any other active standard players first
    Object.keys(activeAudioPlayers.current).forEach(id => {
      if (id !== clip.id) {
        activeAudioPlayers.current[id].pause();
      }
    });

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (clip.isTts) {
      if (isPlayingThis) {
        setPlayingClipId(null);
        setClipProgress(prev => ({ ...prev, [clip.id]: 0 }));
        setClipCurrentTime(prev => ({ ...prev, [clip.id]: 0 }));
      } else {
        if (!window.speechSynthesis) {
          setErrorMsg('আপনার ব্রাউজারটি ভয়েস সিন্থেসিস সমর্থন করে না।');
          return;
        }

        const utterance = new SpeechSynthesisUtterance(clip.ttsText || '');
        utterance.rate = clip.ttsRate || 1.0;
        utterance.pitch = clip.ttsPitch || 1.0;

        // Apply selected TTS voice model
        if (clip.ttsVoiceName) {
          const sysVoices = window.speechSynthesis.getVoices();
          const matched = sysVoices.find(v => v.name === clip.ttsVoiceName);
          if (matched) utterance.voice = matched;
        }

        const words = (clip.ttsText || '').trim().split(/\s+/);
        const totalDuration = clip.duration || Math.max(2, (words.length / (2.2 * (clip.ttsRate || 1.0))));
        setClipDurations(prev => ({ ...prev, [clip.id]: totalDuration }));

        let startTime = Date.now();
        let intervalId: any = null;

        utterance.onstart = () => {
          setPlayingClipId(clip.id);
          startTime = Date.now();
          intervalId = window.setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed >= totalDuration) {
              clearInterval(intervalId);
            } else {
              setClipProgress(prev => ({ ...prev, [clip.id]: (elapsed / totalDuration) * 100 }));
              setClipCurrentTime(prev => ({ ...prev, [clip.id]: elapsed }));
            }
          }, 100);
        };

        const stopSpeakingTts = () => {
          if (intervalId) clearInterval(intervalId);
          setPlayingClipId(null);
          setClipProgress(prev => ({ ...prev, [clip.id]: 0 }));
          setClipCurrentTime(prev => ({ ...prev, [clip.id]: 0 }));
        };

        utterance.onend = stopSpeakingTts;
        utterance.onerror = stopSpeakingTts;

        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    // Standard HTML5 Audio elements
    if (isPlayingThis) {
      // Pause
      if (activeAudioPlayers.current[clip.id]) {
        activeAudioPlayers.current[clip.id].pause();
      }
      setPlayingClipId(null);
    } else {
      // Create element if not exists
      if (!activeAudioPlayers.current[clip.id]) {
        const audio = new Audio(clip.audioUrl);
        activeAudioPlayers.current[clip.id] = audio;

        audio.onloadedmetadata = () => {
          setClipDurations(prev => ({ ...prev, [clip.id]: audio.duration }));
        };

        audio.ontimeupdate = () => {
          const progress = (audio.currentTime / audio.duration) * 100 || 0;
          setClipProgress(prev => ({ ...prev, [clip.id]: progress }));
          setClipCurrentTime(prev => ({ ...prev, [clip.id]: audio.currentTime }));
        };

        audio.onended = () => {
          setPlayingClipId(null);
          setClipProgress(prev => ({ ...prev, [clip.id]: 0 }));
          setClipCurrentTime(prev => ({ ...prev, [clip.id]: 0 }));
        };
      }

      // Play
      activeAudioPlayers.current[clip.id].play()
        .then(() => {
          setPlayingClipId(clip.id);
        })
        .catch(err => {
          console.error('Playback error:', err);
          setErrorMsg('অডিও প্লে করতে কোনো ত্রুটির সৃষ্টি হয়েছে। ফাইলটি হয়তো করাপ্ট।');
        });
    }
  };

  const handleSeekClip = (clipId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value);
    const audio = activeAudioPlayers.current[clipId];
    if (audio && audio.duration) {
      const targetTime = (percentage / 100) * audio.duration;
      audio.currentTime = targetTime;
      setClipProgress(prev => ({ ...prev, [clipId]: percentage }));
      setClipCurrentTime(prev => ({ ...prev, [clipId]: targetTime }));
    }
  };

  const formatDurationStr = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Derive custom and default categories dynamically
  const categoriesList = useMemo(() => {
    const defaultCats = ['সকল অডিও', 'ভয়েস মেমো', 'মিটিং রেকর্ড', 'আর্থিক বিবরণী', 'অন্যান্য'];
    const customCats = audioClips
      .map(clip => clip.category)
      .filter((cat): cat is string => !!cat && !defaultCats.includes(cat));
    return [...defaultCats, ...Array.from(new Set(customCats))];
  }, [audioClips]);

  // Handle addition of custom categories/folders
  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      if (!categoriesList.includes(newCategoryName.trim())) {
        setCurrentCategoryFilter(newCategoryName.trim());
        setSuccessMsg(`আলাদা ফোল্ডার '${newCategoryName.trim()}' সফলভাবে তৈরি হয়েছে!`);
      }
      setNewCategoryName('');
      setShowAddCategoryInput(false);
    }
  };

  // Filter clips based on selected folder / search query
  const filteredClips = useMemo(() => {
    return audioClips.filter(clip => {
      const folderOfClip = clip.category || 'ভয়েস মেমো';
      const matchesCategory = currentCategoryFilter === 'সকল অডিও' || folderOfClip === currentCategoryFilter;
      const titleMatch = clip.title.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = folderOfClip.toLowerCase().includes(searchQuery.toLowerCase());
      const textMatch = clip.isTts && clip.ttsText ? clip.ttsText.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      return matchesCategory && (titleMatch || categoryMatch || textMatch);
    });
  }, [audioClips, currentCategoryFilter, searchQuery]);

  // Clean trigger for speech synthesis preview of written TTS content before saving
  const handleTtsContentPreview = () => {
    if (!ttsInputText.trim()) {
      setErrorMsg('উচ্চারণ করার জন্য কিছু টেক্সট লিখুন।');
      return;
    }
    if (!window.speechSynthesis) {
      setErrorMsg('আপনার ব্রাউজারটি ভয়েস সিন্থেসিস সমর্থন করে না।');
      return;
    }

    if (ttsIsSpeaking) {
      window.speechSynthesis.cancel();
      setTtsIsSpeaking(false);
      setTtsIsPaused(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(ttsInputText);
    utterance.rate = ttsSpeed;
    utterance.pitch = ttsPitch;

    if (selectedTtsVoiceName) {
      const selected = ttsVoices.find(v => v.name === selectedTtsVoiceName);
      if (selected) utterance.voice = selected;
    }

    utterance.onstart = () => {
      setTtsIsSpeaking(true);
      setTtsIsPaused(false);
    };

    utterance.onend = () => {
      setTtsIsSpeaking(false);
      setTtsIsPaused(false);
    };

    utterance.onerror = () => {
      setTtsIsSpeaking(false);
      setTtsIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Pause or Resume synthesized preview of TTS
  const handlePauseResumeTts = () => {
    if (!window.speechSynthesis) return;
    if (ttsIsSpeaking) {
      if (ttsIsPaused) {
        window.speechSynthesis.resume();
        setTtsIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setTtsIsPaused(true);
      }
    }
  };

  // Save dynamically compiled Speech Synthesis to Audio library folder list
  const saveTtsAudioNote = () => {
    if (!ttsInputText.trim() || !ttsTitleInput.trim()) {
      setErrorMsg('টিটিএস নোটের জন্য টাইটেল এবং টেক্সট স্ক্রিপ্ট দুটোই আবশ্যক।');
      return;
    }

    const words = ttsInputText.trim().split(/\s+/);
    const approximateDuration = Math.max(2, Math.round(words.length / (2.2 * ttsSpeed)));

    onAddAudioClip({
      title: ttsTitleInput.trim(),
      audioUrl: '', // Synthesized on the fly
      duration: approximateDuration,
      category: ttsCategory,
      isTts: true,
      ttsText: ttsInputText.trim(),
      ttsRate: ttsSpeed,
      ttsPitch: ttsPitch,
      ttsVoiceName: selectedTtsVoiceName
    });

    setSuccessMsg('টেক্সট টু স্পিচ অডিওটি সফলভাবে মেমো লাইব্রেরিতে সংরক্ষণ করা হয়েছে!');
    setTtsTitleInput('');
    setTtsInputText('');
    setActiveTab('list');
  };

  return (
    <div className="space-y-6 pt-2 pb-12 animate-fadeIn text-gray-800 dark:text-gray-100 font-sans">
      
      {/* Toast Messages */}
      {successMsg && (
        <div className="bg-green-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-green-500 animate-slideUp">
          <span className="text-sm font-semibold">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-white hover:text-green-200">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-red-500 animate-slideUp">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-white hover:text-red-200">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-1.5 bg-gray-200/50 dark:bg-gray-800 rounded-3xl overflow-x-auto no-scrollbar">
        {[
          { id: 'list', label: 'রেকর্ডকৃত অডিও সমূহ', icon: 'fa-list-ul' },
          { id: 'record', label: 'সরাসরি রেকর্ড', icon: 'fa-microphone' },
          { id: 'upload', label: 'অডিও আপলোড', icon: 'fa-cloud-arrow-up' },
          { id: 'tts', label: 'টেক্সট টু স্পিচ (TTS)', icon: 'fa-comment-dots' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setErrorMsg(null);
            }}
            className={`py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-750 shadow-md text-blue-600 dark:text-blue-400 font-black' 
                : 'text-gray-500 hover:text-gray-850 dark:hover:text-gray-250 font-bold'
            }`}
          >
            <i className={`fas ${tab.icon} text-sm`} />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Shared Trimmer Slider Overlay Panel (Reusable between Records and Uploads Tabs) */}
      {showTrimmerPanel && decodedBuffer && (
        <div className="p-6 bg-gradient-to-r from-indigo-50/70 to-blue-50/70 dark:from-slate-900/60 dark:to-slate-900/30 rounded-3xl border border-indigo-100 dark:border-slate-800 space-y-4 animate-scaleIn text-left">
          <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scissors size={18} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider font-sans">
                ইন্টারেক্টিভ অডিও ট্রিমার এবং কাটার টুল ({activeTrimSource === 'record' ? 'লাইভ রেকর্ড' : 'আপলোডেড ফাইল'})
              </h4>
            </div>
            <button 
              onClick={() => {
                setShowTrimmerPanel(false);
                setDecodedBuffer(null);
              }}
              className="text-xs font-bold text-gray-400 hover:text-red-500 cursor-pointer"
            >
              বাতিল করুন (Close)
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block">শুরুর টাইম অবস্থান (Start Point)</span>
                <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatDurationStr(trimStart)} সেকেন্ড</span>
                <input
                  type="range"
                  min="0"
                  max={sourceDuration.toString()}
                  step="0.05"
                  value={trimStart}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTrimStart(val);
                    if (val >= trimEnd) setTrimEnd(Math.min(sourceDuration, val + 0.5));
                  }}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-750 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block">শেষের টাইম অবস্থান (End Point)</span>
                <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatDurationStr(trimEnd)} সেকেন্ড</span>
                <input
                  type="range"
                  min="0"
                  max={sourceDuration.toString()}
                  step="0.05"
                  value={trimEnd}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTrimEnd(val);
                    if (val <= trimStart) setTrimStart(Math.max(0, val - 0.5));
                  }}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-750 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-blue-50/50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleTrimPreview}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer transition-all ${
                    trimPlaying ? 'bg-indigo-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {trimPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="translate-x-0.5" fill="currentColor" />}
                </button>
                <div className="text-left font-sans">
                  <span className="text-[10px] text-slate-400 block font-bold leading-none">কেটে নেওয়ার মোট অবশিষ্টাংশ</span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                    সময়সীমা: {formatDurationStr(trimEnd - trimStart)} সেকেন্ড
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExecuteTrimCrop}
                disabled={isTrimming}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 font-sans"
              >
                {isTrimming ? 'প্রসেস হচ্ছে...' : 'ক্লিপ ক্রপ বা ট্রিম করুন (Crop Area)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER CONTENT BASED ON TABS */}

      {/* 1. LIST VIEW WITH FOLDERS FILTER */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          
          {/* FOLDERS FILTER AND SEARCH INTERFACE */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-750 shadow-sm space-y-4">
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
              
              <div className="flex items-center gap-2 flex-wrap text-left">
                <div className="flex items-center gap-1 text-gray-500 font-bold text-xs shrink-0 pr-1">
                  <FolderOpen size={14} className="text-blue-500" /> ফোল্ডার ফিল্টার:
                </div>
                {categoriesList.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCurrentCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      currentCategoryFilter === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-650'
                    }`}
                  >
                    {cat} ({cat === 'সকল অডিও' ? audioClips.length : audioClips.filter(c => (c.category || 'ভয়েস মেমো') === cat).length})
                  </button>
                ))}

                <button
                  onClick={() => setShowAddCategoryInput(!showAddCategoryInput)}
                  className="p-1 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus size={12} /> নতুন ফোল্ডার
                </button>
              </div>

              <div className="relative w-full xl:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="অডিও টাইটেল বা ফোল্ডার খুঁজুন..."
                  className="w-full text-xs p-3.5 pl-9 bg-gray-50 dark:bg-gray-900/60 rounded-2xl outline-none text-slate-705 dark:text-slate-105 border border-gray-150 dark:border-gray-755 font-bold"
                />
                <Search className="absolute left-3.5 top-3.5 text-gray-400" size={13} />
              </div>
            </div>

            {showAddCategoryInput && (
              <div className="flex gap-2 items-center bg-blue-50/40 dark:bg-blue-950/10 p-3 rounded-2xl border border-blue-100/50 dark:border-slate-800 animate-slideUp text-left">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="ফোল্ডার বা ক্যাটাগরির নাম দিন (যেমন: জরুরি মেমো, প্রজেক্ট ফাইল)"
                  className="flex-1 text-xs p-2.5 bg-white dark:bg-gray-800 rounded-xl outline-none border border-gray-150 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-bold"
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  তৈরি করুন
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-150 dark:border-gray-800 pb-4 text-left">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center">
                <Folder size={18} className="text-blue-500 mr-2" />
                {currentCategoryFilter} ফোল্ডারের অডিও মেমো সমূহ
              </h3>
              <p className="text-xs text-gray-450 mt-1">সবগুলো রেকর্ডকৃত তথ্য, টিটিএস ও অডিও ফাইল এখানে সংরক্ষিত রয়েছে</p>
            </div>
            
            <span className="px-4 py-1.5 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-105/30">
              ফোল্ডারে অডিও ক্লিপ: {filteredClips.length} টি
            </span>
          </div>

          {audioClips.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-750">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 flex items-center justify-center mb-4">
                <Music size={32} />
              </div>
              <h4 className="text-lg font-black text-gray-850 dark:text-white mb-1.5">কোনো অডিও ক্লিপ পাওয়া যায়নি</h4>
              <p className="text-xs text-gray-400 max-w-sm mb-6 px-4">গুরুত্বপূর্ণ নোটিশ, মিটিংয়ের রেকর্ড বা যেকোনো প্রয়োজনীয় ভয়েস নোট সরাসরি রেকর্ড অথবা আগে থেকে সেভ করা ফাইল আপলোড করুন।</p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('record')} 
                  className="px-5 py-2.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Mic size={14} /> সরাসরি রেকর্ড
                </button>
                <button 
                  onClick={() => setActiveTab('upload')} 
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Upload size={14} /> ফাইল আপলোড
                </button>
              </div>
            </div>
          ) : filteredClips.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-750">
              <div className="w-14 h-14 rounded-full bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500 flex items-center justify-center mb-4">
                <Folder size={24} />
              </div>
              <h4 className="text-[15px] font-black text-slate-850 dark:text-slate-100 mb-1">এই ফিল্টারে অডিও খুঁজে পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-400 mb-4 font-bold">অন্য ক্যাটাগরি ফোল্ডার নির্বাচন করুন বা সার্চ কুয়েরি রিসেট করতে বাটনে চাপুন।</p>
              <button
                onClick={() => {
                  setCurrentCategoryFilter('সকল অডিও');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                সবগুলো রিসেট করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {filteredClips.map((clip) => {
                const isPlaying = playingClipId === clip.id;
                const progress = clipProgress[clip.id] || 0;
                const totalDuration = clipDurations[clip.id] || clip.duration || 0;
                const currentTime = clipCurrentTime[clip.id] || 0;

                // Checking modify permissions
                const isOwner = clip.enteredBy === currentUser.username;
                const canDelete = isAdmin || isOwner;

                return (
                  <div 
                    key={clip.id} 
                    className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-750 hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900/60 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Card Header Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 my-auto flex-1 min-w-0">
                          <h4 className="text-[15px] font-black leading-snug text-gray-900 dark:text-white truncate">
                            {clip.title}
                          </h4>
                          
                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-400">
                            <span className="flex items-center gap-1">
                              <User size={10} /> লেখক: {clip.enteredBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={10} /> {new Date(clip.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-black">
                              ফোল্ডার: {clip.category || 'ভয়েস মেমো'}
                            </span>
                            {clip.isTts && (
                              <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-black flex items-center gap-0.5">
                                <Sparkles size={8} /> টিটিএস (TTS)
                              </span>
                            )}
                          </div>
                        </div>

                        {canDelete && (
                          <button
                            onClick={() => {
                              if (confirm('আপনি কি নিশ্চিতভাবেই এই অডিও ক্লিপটি ডিলিট করতে চান?')) {
                                onDeleteAudioClip(clip.id);
                              }
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-900/30 p-2.5 rounded-xl transition-all cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* TTS Text script display panel */}
                      {clip.isTts && clip.ttsText && (
                        <div className="bg-purple-50/20 dark:bg-purple-950/10 p-3 rounded-2xl border border-purple-100/30 text-xs">
                          <p className="font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
                            <FileText size={11} /> টেক্সট স্ক্রিপ্ট:
                          </p>
                          <div className="text-gray-650 dark:text-gray-350 max-h-20 overflow-y-auto font-sans font-medium line-clamp-3 leading-relaxed">
                            {clip.ttsText}
                          </div>
                        </div>
                      )}

                      {/* Customized Modern Audio Player Interface */}
                      <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 flex items-center gap-4 border border-gray-100 dark:border-gray-800">
                        {/* Play / Pause button */}
                        <button
                          onClick={() => togglePlayingStateOfAnyAudio(clip)}
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow active:scale-95 cursor-pointer flex-shrink-0 ${
                            isPlaying
                              ? 'bg-red-500 hover:bg-red-650 text-white animate-pulse'
                              : 'bg-blue-600 hover:bg-blue-750 text-white'
                          }`}
                        >
                          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="translate-x-0.5" fill="currentColor" />}
                        </button>

                        {/* Player Seek and Progress */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="0.1" 
                            value={progress}
                            onChange={(e) => handleSeekClip(clip.id, e)}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                          />
                          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                            <span>{formatDurationStr(currentTime)}</span>
                            <span className="flex items-center gap-1 text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest pl-1">
                              <Clock size={9} /> Length: {formatDurationStr(totalDuration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Options Bar */}
                    <div className="mt-4 pt-3.5 border-t border-gray-50 dark:border-gray-750 flex items-center justify-between text-[11px]">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black flex items-center gap-1 font-sans">
                        <Briefcase size={10} /> RGO MEMO
                      </span>
                      
                      <div className="flex items-center gap-3 font-sans font-bold">
                        {!clip.isTts && (
                          <button
                            onClick={() => handleActivateTrimmerForSavedClip(clip)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer bg-none border-none text-[11px]"
                          >
                            <Scissors size={11} /> অডিও কাটুন
                          </button>
                        )}
                        
                        {clip.audioUrl && (
                          <a
                            href={clip.audioUrl}
                            download={`${clip.title}.webm`}
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Download size={11} /> ডাউনলোড
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. LIVE RECORDER TAB */}
      {activeTab === 'record' && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-750 flex flex-col items-center">
          <div className="max-w-md w-full space-y-8 flex flex-col items-center text-center">
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">সরাসরি অডিও রেকর্ডার</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">ডিভাইসের মাইক্রোফোন ব্যবহার করে সরাসরি কোনো অডিও মেসেজ বা বক্তব্য রেকর্ড করুন</p>
            </div>

            {/* Dynamic visual indicator for record state */}
            <div className="relative py-4 flex items-center justify-center">
              <div className={`absolute w-36 h-36 rounded-full border transition-all duration-500 ${
                isRecording && !isPaused
                  ? 'border-red-500/30 scale-125 animate-ping'
                  : 'border-blue-500/10 scale-95'
              }`} />
              <div className={`absolute w-28 h-28 rounded-full border transition-all duration-300 ${
                isRecording 
                  ? 'border-red-500/50 scale-110'
                  : 'border-blue-500/20'
              }`} />
              
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-xl active:scale-90 relative z-10 cursor-pointer ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-650 shadow-red-500/20' 
                    : 'bg-blue-600 hover:bg-blue-750 shadow-blue-500/20'
                }`}
              >
                {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
              </button>
            </div>

            {/* Canvas-based Waveform Visualizer & Timestamp */}
            <div className="space-y-4 w-full">
              {isRecording ? (
                <div className="w-full bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-inner">
                  <div className="flex items-center justify-between mb-3.5 px-1.5 text-[11px] font-bold text-gray-500">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider text-red-500">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      {isPaused ? 'রেকর্ডিং সাময়িক স্থগিত' : 'লাইভ অডিও সিগন্যাল'}
                    </span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 font-bold bg-gray-150 dark:bg-gray-800/85 px-2 py-0.5 rounded-md">
                      {formatDurationStr(recordDuration)}
                    </span>
                  </div>
                  
                  {/* The Live Waveform Canvas */}
                  <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={72} 
                    className="w-full h-[72px] bg-white dark:bg-slate-950 rounded-2xl block mx-auto border border-gray-150/60 dark:border-slate-900 shadow-sm"
                  />
                  
                  <div className="mt-3 flex items-center justify-center gap-5 text-[10px] text-gray-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Volume2 size={11} className="text-blue-500" /> রিয়েল-টাইম ফ্রিকোয়েন্সি
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mic size={11} className="text-red-500" /> মাইক্রোফোন ডেসিবল গেইন
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-3xl font-mono text-gray-900 dark:text-white font-black block">
                    {formatDurationStr(recordDuration)}
                  </span>
                  <p className="text-xs text-gray-450 font-bold flex items-center justify-center gap-1.5 uppercase tracking-wide">
                    {recordedBlobUrl 
                      ? 'রেকর্ডিং সম্পন্ন হয়েছে। নিচে সেভ করুন।'
                      : 'রেকর্ড শুরু করতে মাইক্রোফোন বাটনে ক্লিক করুন'}
                  </p>
                </div>
              )}
            </div>

            {/* Recording Action Buttons Toolbar */}
            {isRecording && (
              <div className="flex gap-2 w-full max-w-sm">
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isPaused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}
                  {isPaused ? 'পুনরায় শুরু' : 'বিরতি বা পজ'}
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-750 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  সম্পন্ন করুন <i className="fas fa-check-circle"></i>
                </button>
              </div>
            )}

            {/* Preview and Saving Section after completing recording */}
            {recordedBlobUrl && !isRecording && (
              <div className="p-6 bg-gray-50 dark:bg-gray-900/30 rounded-3xl w-full border border-gray-100 dark:border-gray-800 text-left space-y-5 animate-scaleIn">
                <div className="space-y-1 border-b border-gray-150 dark:border-gray-800 pb-3">
                  <span className="text-[10px] font-black tracking-widest text-blue-500 dark:text-blue-400 uppercase block">রেকর্ডিং মেটাডাটা প্রিভিউ</span>
                  <p className="text-xs text-gray-450">নিচে একটি টাইটেল দিন এবং সেভ করার আগে প্লে করে শুনুন:</p>
                </div>

                <div className="space-y-4">
                  {/* Title and control interface */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">রেকর্ড ফাইলের নাম বা টাইটেল</label>
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="w-full text-sm p-4 bg-white dark:bg-gray-800 rounded-xl outline-none border border-gray-150 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-bold transition-all"
                      placeholder="অডিও মেমোর একটি শিরোনাম দিন..."
                    />
                  </div>

                  {/* Temporary audio check play */}
                  <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleTogglePreviewPlay}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer select-none transition-all ${
                        previewPlaying ? 'bg-red-500' : 'bg-blue-600'
                      }`}
                    >
                      {previewPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} className="translate-x-0.5" fill="currentColor" />}
                    </button>
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-gray-500 block">রেকর্ডিং ট্র্যাকার টেস্টার</span>
                      <span className="text-[10px] text-gray-400 font-mono">সময়কাল: {formatDurationStr(recordDuration)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-150 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={discardRecording}
                    className="flex-1 py-3 bg-gray-150 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-150 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    বাতিল বা ডিলিট করুন
                  </button>
                  <button
                    type="button"
                    onClick={saveRecordedAudio}
                    className="flex-2 py-3 bg-green-600 hover:bg-green-750 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm shadow-green-600/10"
                  >
                    লাইব্রেরিতে সেভ করুন <i className="fas fa-save ml-1.5"></i>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 3. UPLOADER TAB */}
      {activeTab === 'upload' && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-750">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="space-y-1.5 text-center">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">বাহ্যিক অডিও ফাইল আপলোড</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">পূর্বে আপনার ডিভাইসে সংরক্ষিত অডিও, রেকর্ড বা মিটিং কল ক্লিপ আপলোড করুন</p>
            </div>

            {/* Drag Drop Area */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 bg-gray-50 dark:bg-gray-900/20 text-center flex flex-col items-center justify-center transition-all relative ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.02]' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100/50'
              }`}
            >
              <input
                type="file"
                id="audio-file-uploader"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Upload size={24} />
              </div>

              <label 
                htmlFor="audio-file-uploader"
                className="cursor-pointer space-y-2 block"
              >
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  <span className="text-blue-600 dark:text-blue-400 hover:underline">একটি ফাইল চয়ন করুন</span> অথবা ড্র্যাগ এবং ড্রপ করুন
                </p>
                <p className="text-[10px] text-gray-400 font-mono">সমর্থিত ফাইল: .mp3, .wav, .m4a, .ogg (সর্বোচ্চ ৮ মেগাবাইট)</p>
              </label>
            </div>

            {/* Show Selected File Details and allow renaming */}
            {uploadFile && (
              <div className="border border-gray-100 dark:border-gray-700 p-5 rounded-2xl space-y-4 animate-fadeIn bg-gray-50 dark:bg-gray-900/10">
                <div className="flex items-center gap-3 border-b border-gray-150 dark:border-gray-800 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Music size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{uploadFile.name}</p>
                    <p className="text-[9px] text-gray-400 font-mono">আকার: {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={() => {
                      setUploadFile(null);
                      setUploadTitle('');
                      setUploadBase64(null);
                    }}
                    className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                  >
                    পরিবর্তন করুন
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block">অডিও ফাইলের শিরোনাম (টাইটেল)</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full text-xs p-4 bg-white dark:bg-gray-800 rounded-xl outline-none border border-gray-150 dark:border-gray-700 focus:border-blue-500 text-gray-800 dark:text-gray-100 font-bold"
                    placeholder="অডিও ফাইলটির জন্য একটি টাইটেল দিন..."
                  />
                </div>

                <button
                  type="button"
                  onClick={saveUploadedAudio}
                  disabled={!uploadBase64}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  আপলোড সম্পূর্ণ করুন <i className="fas fa-check"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TEXT TO SPEECH (TTS) CREATOR TAB */}
      {activeTab === 'tts' && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-750">
          <div className="max-w-xl mx-auto space-y-6 text-left">
            <div className="space-y-1.5 text-center">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <Sparkles className="text-blue-500 animate-pulse" size={24} />
                উন্নত টেক্সট টু স্পিচ (TTS) স্টুডিও
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">যেকোনো বাংলা বা ইংরেজি টেক্সট টাইপ করুন অথবা নিচের টেমপ্লেট ব্যবহার করে সরাসরি উচ্চমানের ভয়েস তৈরি করুন</p>
            </div>

            {/* Quick Trial Templates */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-450 uppercase font-bold tracking-wider block">সহজ ট্রায়াল টেমপ্লেটস:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🇧🇩 নোটিশ নমুনা', text: 'আসসালামু আলাইকুম। অত্যন্ত গুরুত্বপূর্ণ একটি নোটিশ নিয়ে কথা বলছি। দয়া করে প্রত্যেকে নিয়ম মেনে চলুন।', title: 'জরুরি নোটিস' },
                  { label: '🇬🇧 English Memo', text: 'Hello! This is an interactive voice memo recorded using the high-performance RGO Text to Speech engine with custom configurations.', title: 'English Voice Memo' },
                  { label: '⭐ সকালের প্রেরণা', text: 'আজকের দিনটি দারুণ একটি সুযোগ। সফল হওয়ার জন্য প্রতিটি মুহূর্তকে কাজে লাগাতে হবে।', title: 'মর্নিং সেলফ মোটিভেশন' },
                ].map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTtsInputText(tpl.text);
                      setTtsTitleInput(tpl.title);
                    }}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-900 text-[11px] text-gray-600 dark:text-gray-300 rounded-xl transition-all font-bold cursor-pointer border border-gray-100 dark:border-gray-750 flex items-center gap-1"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block font-sans">মেমো টাইটেল</label>
                  <input
                    type="text"
                    value={ttsTitleInput}
                    onChange={(e) => setTtsTitleInput(e.target.value)}
                    className="w-full text-xs p-4 bg-gray-50 dark:bg-gray-900 rounded-xl outline-none border border-gray-150 dark:border-gray-700 focus:border-blue-500 text-gray-800 dark:text-gray-100 font-bold"
                    placeholder="যেমন- সাধারণ জ্ঞান লেকচার ১..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block font-sans">সংরক্ষণ ফোল্ডার</label>
                  <select
                    value={ttsCategory}
                    onChange={(e) => setTtsCategory(e.target.value)}
                    className="w-full text-xs p-4 bg-gray-50 dark:bg-gray-900 rounded-xl outline-none border border-gray-150 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-bold"
                  >
                    {categoriesList.filter(c => c !== 'সকল অডিও').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block font-sans">টেক্সট স্ক্রিপ্ট লিখুন (বাংলা/English)</label>
                <textarea
                  rows={4}
                  value={ttsInputText}
                  onChange={(e) => setTtsInputText(e.target.value)}
                  className="w-full text-xs p-4 bg-gray-50 dark:bg-gray-900 rounded-xl outline-none border border-gray-150 dark:border-gray-700 focus:border-blue-500 text-gray-800 dark:text-gray-100 font-bold leading-relaxed resize-none"
                  placeholder="এখানে আপনার টেক্সটটি টাইপ করুন। বাংলায় ভয়েস শুনতে চাইলে বাংলা কিবোর্ড ও ইংরেজিতে শুনতে ইংরেজি কিবোর্ডে লিখুন..."
                />
              </div>

              {/* Dynamic pitch, voice & speed adjustments */}
              <div className="p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100/80 dark:border-gray-800 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Speed Adjustment */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 uppercase font-black block font-sans">ভয়েস স্পিড বা গতি</span>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{ttsSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={ttsSpeed}
                      onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-750 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex gap-1 justify-between text-[9px] text-gray-400 font-bold">
                      <button type="button" onClick={() => setTtsSpeed(0.8)} className="hover:text-blue-600">ధীর (0.8x)</button>
                      <button type="button" onClick={() => setTtsSpeed(1.0)} className="hover:text-blue-600">স্বাভাবিক (1.0x)</button>
                      <button type="button" onClick={() => setTtsSpeed(1.3)} className="hover:text-blue-600">দ্রুত (1.3x)</button>
                      <button type="button" onClick={() => setTtsSpeed(1.6)} className="hover:text-blue-600">অতি দ্রুত (1.6x)</button>
                    </div>
                  </div>

                  {/* Pitch Adjustment */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 uppercase font-black block font-sans">ভয়েস পিচ বা কম্পাঙ্ক</span>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">{ttsPitch.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={ttsPitch}
                      onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-750 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex gap-1 justify-between text-[9px] text-gray-400 font-bold">
                      <button type="button" onClick={() => setTtsPitch(0.7)} className="hover:text-indigo-600">গম্ভীর (0.7x)</button>
                      <button type="button" onClick={() => setTtsPitch(1.0)} className="hover:text-indigo-600">স্বাভাবিক (1.0x)</button>
                      <button type="button" onClick={() => setTtsPitch(1.3)} className="hover:text-indigo-600">তীক্ষ্ণ (1.3x)</button>
                    </div>
                  </div>
                </div>

                {/* Kids & Female Voice Simulation Preset buttons */}
                <div className="pt-3.5 border-t border-gray-150 dark:border-gray-800 space-y-2.5">
                  <span className="text-[10px] text-gray-400 uppercase font-black block font-sans tracking-wide">
                    বিশেষ কণ্ঠস্বর বা ভয়েস ইফেক্ট প্রিসেট (বাচ্চা ও নারী কণ্ঠ সিমুলেশন)
                  </span>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        setTtsPitch(1.0);
                        setTtsSpeed(1.0);
                        setSuccessMsg('ডিফল্ট স্বাভাবিক কণ্ঠ প্রিসেট লোড হয়েছে।');
                      }}
                      className="px-2.5 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-755 text-[10.5px] text-gray-750 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-bold font-sans transition-all text-center cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      🗣️ ডিফল্ট সাধারণ
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setTtsPitch(1.65);
                        setTtsSpeed(1.15);
                        setSuccessMsg('বাচ্চাদের মিষ্টি কার্টুন কণ্ঠ (Kids Voice Preset) লোড হয়েছে!');
                      }}
                      className="px-2.5 py-2 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 text-[10.5px] text-amber-700 dark:text-amber-300 border border-amber-200/40 rounded-xl font-extrabold font-sans transition-all text-center cursor-pointer shadow-2xs flex items-center justify-center gap-1 animate-pulse"
                    >
                      🧒 বাচ্চাদের কণ্ঠ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTtsPitch(1.35);
                        setTtsSpeed(1.05);
                        setSuccessMsg('মিষ্টি নারী কণ্ঠ প্রিসেট লোড হয়েছে!');
                      }}
                      className="px-2.5 py-2 bg-pink-50 dark:bg-pink-950/20 hover:bg-pink-100/80 dark:hover:bg-pink-900/30 text-[10.5px] text-pink-700 dark:text-pink-300 border border-pink-200/40 rounded-xl font-extrabold font-sans transition-all text-center cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      👩 মিষ্টি নারী কণ্ঠ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTtsPitch(0.75);
                        setTtsSpeed(0.95);
                        setSuccessMsg('গম্ভীর পুরুষ কণ্ঠ প্রিসেট লোড হয়েছে।');
                      }}
                      className="px-2.5 py-2 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/30 text-[10.5px] text-indigo-700 dark:text-indigo-300 border border-indigo-200/40 rounded-xl font-extrabold font-sans transition-all text-center cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      👨 গম্ভীর পুরুষ
                    </button>
                  </div>
                </div>

                {/* Helpful guides on how System Voice selections are handled */}
                <div className="pt-3 border-t border-gray-150 dark:border-gray-800 text-left">
                  <div className="bg-blue-50/15 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-150/20 text-[11px] space-y-1.5 leading-relaxed">
                    <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <AlertCircle size={13} /> কণ্ঠস্বরের লিঙ্গ ও বয়স নির্দেশিকা:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-350 font-sans font-medium">
                      <li><strong>নারী কণ্ঠ (Female Voice):</strong> ব্রাউজার তালিকায় যেসকল ভয়েসের নামের ভেতর <u>Zira, Swara, Heera, Susan, Hazel, Sangeeta, Ayumi</u> অথবা <u>Google বাংলা (female)</u> লেখা আছে, সেগুলো নারী কারিগরি ভয়েস।</li>
                      <li><strong>বাচ্চাদের কণ্ঠ (Kids Voice):</strong> বাচ্চাদের মিষ্টি কণ্ঠের জন্য উপরের ওয়ান-ক্লিক <strong>"বাচ্চাদের কণ্ঠ"</strong> প্রিসেট বাটনে চাপুন। এটি পিচ বাড়িয়ে বাচ্চাদের সুন্দর গলার সুর তৈরি করে ফেলে!</li>
                    </ul>
                  </div>
                </div>

                {/* System Voices Filter Selection Platform */}
                <div className="pt-2 border-t border-gray-150 dark:border-gray-800 space-y-3 text-left">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <span className="text-[10px] text-gray-400 uppercase font-black block font-sans">সিস্টেম ভয়েস চয়ন করুন ({filteredVoicesList.length} টি পাওয়া গেছে)</span>
                    
                    {/* Language Filter Tags */}
                    <div className="flex gap-1 rounded-lg bg-gray-200 dark:bg-gray-900 p-1 font-sans text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setTtsVoiceLanguageFilter('bn_en')}
                        className={`px-2 py-1 rounded transition-all cursor-pointer ${ttsVoiceLanguageFilter === 'bn_en' ? 'bg-white dark:bg-gray-800 shadow-xs text-blue-600 dark:text-blue-400 font-extrabold' : 'text-gray-400 hover:text-gray-200'}`}
                      >
                        শুধু বাংলা ও ইংরেজি
                      </button>
                      <button
                        type="button"
                        onClick={() => setTtsVoiceLanguageFilter('all')}
                        className={`px-2 py-1 rounded transition-all cursor-pointer ${ttsVoiceLanguageFilter === 'all' ? 'bg-white dark:bg-gray-800 shadow-xs text-blue-600 dark:text-blue-400 font-extrabold' : 'text-gray-400 hover:text-gray-200'}`}
                      >
                        সবগুলো ভাষা
                      </button>
                    </div>
                  </div>

                  {/* Voice Keyword Search Box */}
                  <div className="relative">
                    <input
                      type="text"
                      value={voiceSearchQuery}
                      onChange={(e) => setVoiceSearchQuery(e.target.value)}
                      placeholder="ভয়েসের নাম বা ভাষা টাইপ করে খুঁজুন... (যেমন: Google, Microsoft, bn)"
                      className="w-full text-xs p-3 pl-9 bg-white dark:bg-gray-900 rounded-xl outline-none border border-gray-150 dark:border-gray-700 text-gray-750 dark:text-gray-250 font-bold"
                    />
                    <Search size={12} className="absolute left-3 top-3.5 text-gray-400" />
                    {voiceSearchQuery && (
                      <button 
                        type="button" 
                        onClick={() => setVoiceSearchQuery('')}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500 text-xs font-black cursor-pointer"
                      >
                        মুছুন
                      </button>
                    )}
                  </div>

                  {/* Dropdown Select Menu */}
                  {filteredVoicesList.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={selectedTtsVoiceName}
                        onChange={(e) => setSelectedTtsVoiceName(e.target.value)}
                        className="w-full text-xs p-3 bg-white dark:bg-gray-900 rounded-xl outline-none border border-gray-150 dark:border-gray-700 text-gray-750 dark:text-gray-100 font-bold font-sans"
                      >
                        <option value="">ডিফল্ট সিস্টেম ভয়েস (Default)</option>
                        {filteredVoicesList.map((voice, index) => (
                          <option key={`${voice.name}-${voice.lang}-${index}`} value={voice.name}>
                            {voice.name} ({voice.lang}) {getVoiceGenderChar(voice.name)} {voice.localService ? '— [Local অফলাইন]' : '— [Cloud অনলাইন]'}
                          </option>
                        ))}
                      </select>
                      
                      {/* Show currently selected voice badges for feedback */}
                      {(() => {
                        const active = ttsVoices.find(v => v.name === selectedTtsVoiceName);
                        if (active) {
                          return (
                            <div className="bg-blue-50/20 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100/30 text-[10px] space-y-1 font-bold">
                              <p className="text-blue-600 dark:text-blue-400">নির্বাচিত ভয়েস বিবরণ:</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500 dark:text-gray-350">
                                <span>নাম: <strong className="text-gray-700 dark:text-gray-200">{active.name}</strong></span>
                                <span>কণ্ঠের ধরন: <strong className="text-gray-700 dark:text-gray-200">{getVoiceGenderChar(active.name)}</strong></span>
                                <span>ভাষার কন্ট্রি: <strong className="text-gray-700 dark:text-gray-200">{active.lang}</strong></span>
                                <span>স্টোরেজ: <strong className="text-gray-700 dark:text-gray-200">{active.localService ? 'লোকাল স্পীচ ইঞ্জিন' : 'নেটওয়ার্ক সিন্থেসিস'}</strong></span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <p className="text-[10px] text-gray-450 font-bold">কোনো নির্দিষ্ট কন্ঠস্বর পছন্দ করা হয়নি, ব্রাউজার তার নিজস্ব ভাষা সামঞ্জস্য ডিফল্ট ব্যবহার করবে।</p>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50/20 dark:bg-yellow-950/10 rounded-xl border border-yellow-100/20 text-xs text-yellow-600 dark:text-yellow-400 font-bold text-center">
                      <p>আপনার অনুসন্ধান বা ফিল্টার অনুযায়ী কোনো কন্ঠস্বর পাওয়া যায়নি।</p>
                      <button 
                        type="button" 
                        onClick={() => { setTtsVoiceLanguageFilter('all'); setVoiceSearchQuery(''); }}
                        className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 underline font-black block mx-auto hover:text-blue-700"
                      >
                        সব ভাষা ফিল্টারে ফিরে যান
                      </button>
                    </div>
                  )}

                  {/* Manual Voice List Reload button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.speechSynthesis) {
                          const refreshed = window.speechSynthesis.getVoices();
                          setTtsVoices(refreshed);
                          setSuccessMsg('সিস্টেম অডিও ভয়েস লিস্ট সফলভাবে রিফ্রেশ করা হয়েছে!');
                        }
                      }}
                      className="text-[10px] text-blue-650 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold bg-none border-none cursor-pointer"
                    >
                      <RefreshCw size={10} /> ভয়েস তালিকা রিফ্রেশ করুন
                    </button>
                  </div>
                </div>
              </div>

              {/* Glowing Realtime Playback Spectrum Equalizer while Speaking */}
              {ttsIsSpeaking && (
                <div className="bg-gradient-to-r from-blue-50/20 via-indigo-50/20 to-blue-50/20 dark:from-slate-900/40 dark:to-slate-900/40 p-3.5 rounded-2xl border border-blue-105/20 flex flex-col items-center justify-center gap-2 animate-slideUp">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 animate-pulse">কণ্ঠস্বর উচ্চারণ করা হচ্ছে (TTS Speech Active)</span>
                  <div className="flex items-center gap-1 h-8">
                    {[
                      { delay: '0.1s', h: 'h-4' },
                      { delay: '0.3s', h: 'h-7' },
                      { delay: '0.2s', h: 'h-5' },
                      { delay: '0.4s', h: 'h-8' },
                      { delay: '0.15s', h: 'h-3' },
                      { delay: '0.35s', h: 'h-6' },
                      { delay: '0.25s', h: 'h-5' },
                      { delay: '0.45s', h: 'h-8' },
                      { delay: '0.2s', h: 'h-4' },
                      { delay: '0.1s', h: 'h-6' }
                    ].map((bar, index) => (
                      <span
                        key={index}
                        className={`w-1 bg-gradient-to-t from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full animate-bounce ${bar.h}`}
                        style={{
                          animationDelay: bar.delay,
                          animationDuration: '0.6s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons: Preview Pronunciation and Save to Memo Library */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  <button
                    type="button"
                    onClick={handleTtsContentPreview}
                    className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border font-sans ${
                      ttsIsSpeaking 
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/20 border-red-200/40 hover:bg-red-100' 
                        : 'bg-white dark:bg-gray-750 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-750 dark:text-gray-200 shadow-sm'
                    }`}
                  >
                    {ttsIsSpeaking ? (
                      <>
                        <VolumeX size={14} /> উচ্চারণ বন্ধ করুন (Stop)
                      </>
                    ) : (
                      <>
                        <Volume2 size={14} /> উচ্চারণ শুনুন (Preview Audio)
                      </>
                    )}
                  </button>

                  {/* Pause / Resume Speech preview */}
                  {ttsIsSpeaking && (
                    <button
                      type="button"
                      onClick={handlePauseResumeTts}
                      className={`px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                        ttsIsPaused
                          ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-950/20'
                          : 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20'
                      }`}
                      title={ttsIsPaused ? 'প্লে চালু রাখুন' : 'সাময়িক বিরতি'}
                    >
                      {ttsIsPaused ? (
                        <>
                          <Play size={13} fill="currentColor" /> প্লে রাখুন
                        </>
                      ) : (
                        <>
                          <Pause size={13} fill="currentColor" /> বিরতি (Pause)
                        </>
                      )}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={saveTtsAudioNote}
                  className="flex-1 py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 font-sans"
                >
                  মেমো লাইব্রেরিতে সংরক্ষণ করুন <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // Playback state safety toggle for list audios
  function togglePlayingStateOfAnyAudio(clip: AudioClip) {
    togglePlayClip(clip);
  }
};

export default AudioClipsScreen;
