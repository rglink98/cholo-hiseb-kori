import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  FilePlus2, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  Link,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Printer,
  Mic,
  MicOff,
  Trash2,
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { User, Income, Expense, Post, Dues } from '../types';
import { initAuth, googleSignIn, logoutGoogle, getAccessToken } from '../googleAuth';
import { User as FirebaseUser } from 'firebase/auth';

interface DocsScreenProps {
  currentUser: User;
  incomes: Income[];
  expenses: Expense[];
  posts: Post[];
  dues: Dues[];
}

interface GoogleDocFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  webViewLink?: string;
}

const DocsScreen: React.FC<DocsScreenProps> = ({
  currentUser,
  incomes,
  expenses,
  posts,
  dues,
}) => {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [docsList, setDocsList] = useState<GoogleDocFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Create / Select variables
  const [selectedDoc, setSelectedDoc] = useState<GoogleDocFile | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [docContent, setDocContent] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [customText, setCustomText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'none' | 'meeting_minutes' | 'financial_report' | 'member_list'>('none');

  // Deletion states
  const [docToDelete, setDocToDelete] = useState<GoogleDocFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Voice Input (Speech to Text) states
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [isEditingFullDoc, setIsEditingFullDoc] = useState(false);
  const [isSavingFullDoc, setIsSavingFullDoc] = useState(false);
  const speechTargetRef = React.useRef<'custom' | 'main'>('custom');

  const handleStartVoiceDictationMain = () => {
    setIsEditingFullDoc(true);
    setTimeout(() => {
      toggleSpeechRecognition('main');
    }, 150);
  };

  // Text-to-Speech (TTS) Doc Narration states
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [isTtsPaused, setIsTtsPaused] = useState(false);
  const [ttsRate, setTtsRate] = useState(1); // Speech rate speed
  const [ttsPitch, setTtsPitch] = useState(1); // Speech voice pitch
  const [ttsLang, setTtsLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  // Cancel any speaking on unmount and setup voice listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const updateVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        // Filter for Bengali and English
        const filtered = allVoices.filter(v => v.lang.startsWith('bn') || v.lang.startsWith('en'));
        setSupportedVoices(filtered);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStartTts = () => {
    if (!docContent.trim()) {
      setErrorMsg('পড়ার জন্য ডকুমেন্টটিতে কোনো লেখা পাওয়া যায়নি।');
      return;
    }

    try {
      if (!window.speechSynthesis) {
        setErrorMsg('দুঃখিত, আপনার ব্রাউজারটি টেক্সট-টু-স্পিচ (TTS) অডিও সমর্থন করে না।');
        return;
      }

      // Stop any existing speaking before restarting
      window.speechSynthesis.cancel();

      // Automatically suggest language based on content
      const containsBangla = /[\u0980-\u09FF]/.test(docContent);
      const resolvedLang = containsBangla ? 'bn-BD' : 'en-US';
      setTtsLang(resolvedLang);

      // Clean up markdown/unwanted meta symbols to make reading natural
      const cleanedText = docContent
        .replace(/[*#_`\[\]()]/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = resolvedLang;
      utterance.rate = ttsRate;
      utterance.pitch = ttsPitch;

      // Find compatible voice
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = null;
      if (selectedVoiceName) {
        matchedVoice = voices.find(v => v.name === selectedVoiceName) || null;
      }
      
      if (!matchedVoice) {
        if (resolvedLang === 'bn-BD') {
          matchedVoice = voices.find(v => v.lang.startsWith('bn-') || v.lang.startsWith('bn_')) || null;
        } else {
          matchedVoice = voices.find(v => v.lang.startsWith('en-') || v.lang.startsWith('en_')) || null;
        }
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setIsTtsSpeaking(true);
        setIsTtsPaused(false);
      };

      utterance.onend = () => {
        setIsTtsSpeaking(false);
        setIsTtsPaused(false);
      };

      utterance.onerror = (e) => {
        console.error('SpeechSynthesis Utterance error:', e);
        setIsTtsSpeaking(false);
        setIsTtsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('TTS Activation Error:', err);
      setErrorMsg('অডিও তৈরিতে একটি ইন্টারনাল ইরর দেখা দিয়েছে।');
    }
  };

  const handlePauseResumeTts = () => {
    if (!window.speechSynthesis) return;
    if (isTtsSpeaking) {
      if (isTtsPaused) {
        window.speechSynthesis.resume();
        setIsTtsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsTtsPaused(true);
      }
    }
  };

  const handleStopTts = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsTtsSpeaking(false);
    setIsTtsPaused(false);
  };

  // Handle start / stop dictation
  const toggleSpeechRecognition = (target: 'custom' | 'main' = 'custom') => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setErrorMsg('দুঃখিত, আপনার ব্রাউজারটি ভয়েস ডিক্টেশন সমর্থন করে না। অনুগ্রহ করে গুগল ক্রোম ব্রাউজার ব্যবহার করুন।');
      return;
    }

    if (isListening) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsListening(false);
      return;
    }

    speechTargetRef.current = target;

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          if (speechTargetRef.current === 'main') {
            setDocContent(prev => {
              const separator = prev.trim() ? ' ' : '';
              return prev + separator + finalTranscript.trim();
            });
          } else {
            setCustomText(prev => {
              const separator = prev.trim() ? ' ' : '';
              return prev + separator + finalTranscript.trim();
            });
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('মাইক্রোফোন ব্যবহারের অনুমতি নেই!');
          setErrorMsg('মাইক্রোফোন এক্সেস রিজেক্ট করা হয়েছে। ডিক্টেশন চালু করতে আপনার ব্রাউজারের সেটিংস চেক করুন।');
        } else {
          setSpeechError(`ভুল হয়েছে: ${event.error}`);
        }
        setIsListening(false);
        recognition.stop();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setRecognitionInstance(recognition);
    } catch (err) {
      console.error(err);
      setErrorMsg('ভয়েস ডিক্টেশন সার্ভিস চালু করা যায়নি।');
      setIsListening(false);
    }
  };

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [recognitionInstance]);

  // Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        fetchDocs(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setSuccessMsg('ফায়ারবেস মাধ্যমে গুগল অ্যাকাউন্ট যুক্ত করা হয়েছে!');
        fetchDocs(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        setErrorMsg('গুগল কানেক্ট করার সময় পপ-আপ উইন্ডোটি বন্ধ হয়ে গেছে বা ব্লক হয়েছে। অনুগ্রহ করে ওপরের ডানদিকের "Open in New Tab" বাটনে ক্লিক করে নতুন ট্যাবে ট্রাই করুন এবং পপ-আপ এক্সেস অনুমতি দিন।');
      } else {
        setErrorMsg(`গুগল লগইন ব্যর্থ হয়েছে: ${err?.message || 'অনুগ্রহ করে আবার চেষ্টা করুন।'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setAccessToken(null);
      setDocsList([]);
      setSelectedDoc(null);
      setSuccessMsg('গুগল ডিসকানেক্ট করা হয়েছে।');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDocs = async (token: string | null) => {
    const activeToken = token || accessToken;
    if (!activeToken) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Query Google Drive for Docs files only
      const response = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document'&orderBy=createdTime desc&pageSize=15&fields=files(id,name,mimeType,createdTime,webViewLink)",
        {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('ড্রাইভ ফাইল লোড করতে সমস্যা হয়েছে');
      }

      const data = await response.json();
      const files = data.files || [];
      const uniqueFiles = files.filter((file: any, index: number, self: any[]) => 
        self.findIndex((f) => f.id === file.id) === index
      );
      setDocsList(uniqueFiles);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('গুগল ডকস তালিকা লোড করা যায়নি। পুনরায় টোকেন প্রয়োজন হতে পারে।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEmptyDoc = async () => {
    if (!accessToken) return;
    if (!newDocTitle.trim()) {
      setErrorMsg('ডকুমেন্ট এর একটি টাইটেল দিন');
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);
    try {
      const response = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newDocTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('ডকুমেন্ট তৈরিতে ত্রুটি');
      }

      const newDoc = await response.json();
      const docId = newDoc.documentId;
      setSuccessMsg(`"${newDocTitle}" সফলভাবে তৈরি হয়েছে!`);
      setNewDocTitle('');
      fetchDocs(accessToken);

      let initialContent = 'নতুন ফাঁকা ডকস ফাইল প্রস্তুত।';

      if (selectedTemplate !== 'none') {
        let templateText = '';
        if (selectedTemplate === 'meeting_minutes') {
          templateText = `===========================================\n RGO ORGANIZATION - সভার কার্যবিবরণী (Meeting Minutes)\n===========================================\nসভার তারিখ: ${new Date().toLocaleDateString('bn-BD')}\nসভার সময়: [সময় লিখুন]\nস্থান: [স্থান লিখুন]\n\n১. উপস্থিত সদস্যবৃন্দ:\n-------------------------------------------\n১. ${currentUser.username} (${currentUser.role === 'admin' ? 'এডমিন' : 'ইউজার'})\n২. \n৩. \n৪. \n\n২. আলোচ্য বিষয়সমূহ (Agenda):\n-------------------------------------------\n* বিগত সভার কার্যবিবরণী পাঠ ও অনুমোদন।\n* নতুন সদস্য অন্তর্ভুক্তি ও চাঁদা আদায় পরিস্থিতি।\n* আগামী মাসের সম্ভাব্য ব্যয় ও পরিকল্পনা।\n* অন্যান্য / বিবিধ।\n\n৩. সিদ্ধান্তসমূহ (Decisions):\n-------------------------------------------\n- সিদ্ধান্ত ১: \n- সিদ্ধান্ত ২: \n- সিদ্ধান্ত ৩: \n\n৪. পরবর্তী সভার সূচি:\n-------------------------------------------\nতারিখ: ______________ | সময়: ______________\n\n===========================================\nসভার কার্যবিবরণী লিপিবদ্ধকারী: ${currentUser.username}\n===========================================`;
        } else if (selectedTemplate === 'financial_report') {
          const totalIn = incomes.reduce((sum, item) => sum + item.amount, 0);
          const totalOut = expenses.reduce((sum, item) => sum + item.amount, 0);
          const remaining = totalIn - totalOut;
          const totalDue = dues.reduce((sum, item) => sum + item.amount, 0);

          templateText = `===========================================\n RGO ORGANIZATION - আর্থিক খসড়া রিপোর্ট (Draft Expense/Budget)\n===========================================\nরিপোর্ট তৈরির তারিখ: ${new Date().toLocaleString('bn-BD')}\nরিপোর্ট প্রস্তুতকারক: ${currentUser.username}\n\n১. সর্বশেষ আর্থিক স্থিতি (ড্যাশবোর্ড তথ্য):\n-------------------------------------------\n* মোট অর্জিত আয়: ${totalIn.toLocaleString()} ৳\n* মোট সম্পন্ন ব্যয়: ${totalOut.toLocaleString()} ৳\n* বর্তমান নেট উদ্বৃত্ত: ${remaining.toLocaleString()} ৳\n* মোট বকেয়া চাঁদা/দাবি: ${totalDue.toLocaleString()} ৳\n\n২. প্রস্তাবিত বাজেট এবং লক্ষ্যমাত্রা:\n-------------------------------------------\n- খসড়া বাজেট বিবরণ: ____________________\n- লক্ষ্যমাত্রা পরিমাণ: ৳ ______________\n\n৩. বিবিধ মন্তব্য / ভবিষ্যৎ দিকনির্দেশনা:\n-------------------------------------------\n- \n- \n\n===========================================\nযাচাইকরণ স্বাক্ষর: _________________\n===========================================`;
        } else if (selectedTemplate === 'member_list') {
          templateText = `===========================================\n RGO ORGANIZATION - সদস্য হাজিরা ও তালিকা ছক\n===========================================\nহাজিরা খাত তৈরির তারিখ: ${new Date().toLocaleDateString('bn-BD')}\nরেকর্ডকারী: ${currentUser.username}\n\nক্রমিক | সদস্যের নাম | মোবাইল নম্বর | সভার হাজিরা স্ট্যাটাস | মন্তব্য\n-----------------------------------------------------------------------------------\n০১. | \n০২. | \n০৩. | \n০৪. | \n০৫. | \n০৬. | \n০৭. | \n\nগুরুত্বপূর্ণ নোট:\n-------------------------------------------\n* সকল সদস্যদের সময়মতো আরজিও সভায় সশরীর হাজির হতে হবে।\n* অনুপস্থিত সদস্যদের ক্ষেত্রে যৌক্তিক কারণ উল্লেখ করতে হবে।\n\n===========================================\nঅনুমোদনকারীর স্বাক্ষর: ____________________\n===========================================`;
        }

        if (templateText) {
          try {
            const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                requests: [
                  {
                    insertText: {
                      text: templateText,
                      location: { index: 1 }
                    }
                  }
                ]
              }),
            });
            if (updateResponse.ok) {
              initialContent = templateText;
            }
          } catch (updateErr) {
            console.error('Error inserting template text:', updateErr);
          }
        }
      }

      // Select new doc representation
      const createdFile: GoogleDocFile = {
        id: docId,
        name: newDoc.title,
        mimeType: 'application/vnd.google-apps.document',
        createdTime: new Date().toISOString(),
        webViewLink: `https://docs.google.com/document/d/${docId}/edit`,
      };
      setSelectedDoc(createdFile);
      setDocContent(initialContent);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('ডকুমেন্ট তৈরি করা যায়নি।');
    } finally {
      setIsCreating(false);
    }
  };

  // Generate customized Bengali Report content with actual App stats
  const generateFinancialSummary = () => {
    const totalIn = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalOut = expenses.reduce((sum, item) => sum + item.amount, 0);
    const remaining = totalIn - totalOut;
    const totalDue = dues.reduce((sum, item) => sum + item.amount, 0);

    let docText = `===========================================
RGO ORGANIZATION - অফিসিয়াল আর্থিক রিপোর্ট ও স্ট্যাটিস্টিকস
রিপোর্ট তৈরির তারিখ: ${new Date().toLocaleString('bn-BD')}
প্রস্তুতকারক: ${currentUser.username} (${currentUser.role === 'admin' ? 'এডমিন' : 'ইউজার'})
===========================================

১. আর্থিক সারাংশ (Financial Summary):
-------------------------------------------
* মোট আয়: ${totalIn.toLocaleString()} ৳
* মোট ব্যয়: ${totalOut.toLocaleString()} ৳
* বর্তমান নগদ তহবিল (Net Cash): ${remaining.toLocaleString()} ৳
* মোট বকেয়া প্রাপ্যতা (Total Dues): ${totalDue.toLocaleString()} ৳

২. সর্বশেষ ৩টি আয়ের উৎসসমূহ:
-------------------------------------------`;

    incomes.slice(0, 3).forEach((inc, index) => {
      docText += `\n[আয় #${index + 1}] খতিয়ান/আইটেম: ${inc.item} | পরিমাণ: ${inc.amount} ৳ | দাতা: ${inc.name} | তারিখ: ${new Date(inc.date).toLocaleDateString('bn-BD')}`;
    });

    if (incomes.length === 0) docText += '\n(কোনো আয়ের এন্ট্রি নেই)';

    docText += `\n\n৩. সর্বশেষ ৩টি ব্যয়ের তালিকা:
-------------------------------------------`;

    expenses.slice(0, 3).forEach((exp, index) => {
      docText += `\n[ব্যয় #${index + 1}] খাত: ${exp.item} | পরিমাণ: ${exp.amount} ৳ | প্রাপক: ${exp.payeeName} | তারিখ: ${new Date(exp.date).toLocaleDateString('bn-BD')}`;
    });

    if (expenses.length === 0) docText += '\n(কোনো ব্যয়ের এন্ট্রি নেই)';

    docText += `\n\n৪. বকেয়া আদায়ের বিবরণী:
--------------------------------------------`;

    dues.slice(0, 3).forEach((due, index) => {
      docText += `\n[বকেয়া #${index + 1}] সদস্য: ${due.debtorName} | আইটেম: ${due.item} | পরিমাণ: ${due.amount} ৳ | পরিশোধের শেষ তারিখ: ${new Date(due.dueDate).toLocaleDateString('bn-BD')}`;
    });

    if (dues.length === 0) docText += '\n(কোনো বকেয়া বিবরণী নেই)';

    docText += `\n\n৫. মোট পোস্ট সংক্রান্ত ডাটা:
--------------------------------------------
* সর্বমোট পাবলিশকৃত পোস্টের রেকর্ড: ${posts.length} টি।

===========================================
রিপোর্ট সমাপ্ত। এই ফাইলটি গুগল ডকস সার্ভারে সরাসরি সংরক্ষিত হলো।
===========================================`;

    return docText;
  };

  const handleExportStatsToDoc = async () => {
    if (!accessToken) return;
    
    const confirmExport = window.confirm('আপনি কি RGO অ্যাপ্লিকেশনের মোট আয়ের বিবরণী ও তথ্য সমুহ দিয়ে একটি নতুন গুগল ডকস ফাইল জেনারেট করতে চান?');
    if (!confirmExport) return;

    setIsCreating(true);
    setErrorMsg(null);
    const reportTitle = `RGO সংস্থার আর্থিক প্রতিবেদন - ${new Date().toLocaleDateString('bn-BD')}`;
    const contentText = generateFinancialSummary();

    try {
      // Step A: Create Document Template
      const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: reportTitle,
        }),
      });

      if (!createResponse.ok) throw new Error('ডকুমেন্ট তৈরিতে ত্রুটি');
      const docData = await createResponse.json();
      const docId = docData.documentId;

      // Step B: Write actual formatted Bengali tables contents into Doc
      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                text: contentText,
                location: { index: 1 }
              }
            }
          ]
        }),
      });

      if (!updateResponse.ok) throw new Error('ডকুমেন্ট ডাটা আপডেট করা যায়নি');

      setSuccessMsg(`আর্থিক প্রতিবেদন সফলভাবে গুগল ডকস এ রপ্তানি হয়েছে!`);
      fetchDocs(accessToken);

      // Select new file
      const createdFile: GoogleDocFile = {
        id: docId,
        name: reportTitle,
        mimeType: 'application/vnd.google-apps.document',
        createdTime: new Date().toISOString(),
        webViewLink: `https://docs.google.com/document/d/${docId}/edit`,
      };
      setSelectedDoc(createdFile);
      setDocContent(contentText);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('রিপোর্ট রপ্তানি করতে সমস্যা হয়েছে।');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAppendText = async () => {
    if (!accessToken || !selectedDoc) return;
    if (!customText.trim()) {
      setErrorMsg('সংযুক্ত করার জন্য কিছু লেখা লিখুন');
      return;
    }

    setIsUpdating(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`https://docs.googleapis.com/v1/documents/${selectedDoc.id}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                text: `\n\n[সংযুক্তি - ${new Date().toLocaleString('bn-BD')}]:\n${customText}`,
                location: { index: 1 } // Appends right below the title/start or insert format
              }
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error('ডকুমেন্ট আপডেট করা যায়নি');
      }

      setSuccessMsg('ডকুমেন্টটি সফলভাবে আপডেট করা হয়েছে!');
      setCustomText('');
      
      // Update local text preview
      setDocContent(prev => `[সংযুক্তি - ${new Date().toLocaleString('bn-BD')}]:\n${customText}\n\n` + prev);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('ডকুমেন্ট আপডেট ব্যর্থ হয়েছে।');
    } finally {
      setIsUpdating(false);
    }
  };

  const loadDocDetail = async (doc: GoogleDocFile) => {
    if (!accessToken) return;
    setSelectedDoc(doc);
    setIsLoading(true);
    setDocContent('');
    setErrorMsg(null);

    try {
      let extractedText = '';
      let success = false;

      try {
        const response = await fetch(`https://docs.googleapis.com/v1/documents/${doc.id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Extract structural text simply to show a quick preview
          if (data.body && data.body.content) {
            data.body.content.forEach((elem: any) => {
              if (elem.paragraph && elem.paragraph.elements) {
                elem.paragraph.elements.forEach((el: any) => {
                  if (el.textRun && el.textRun.content) {
                    extractedText += el.textRun.content;
                  }
                });
              }
            });
          }
          success = true;
        } else {
          console.warn('Google Docs API read failed, status code:', response.status);
        }
      } catch (innerDocErr) {
        console.error('Inner Google Docs API error:', innerDocErr);
      }

      // Fallback: If Google Docs API fetching failed, try Google Drive API Export endpoint
      if (!success) {
        console.log('Trying Google Drive API export fallback...');
        const driveResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=text/plain`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (driveResponse.ok) {
          extractedText = await driveResponse.text();
          success = true;
        } else {
          console.error('Google Drive API export fallback raw status:', driveResponse.status);
        }
      }

      if (!success) {
        throw new Error('ডকুমেন্ট রিড করতে সমস্যা হয়েছে');
      }

      setDocContent(extractedText || '(ডকুমেন্টটি সম্পূর্ণ ফাঁকা রয়েছে)');
    } catch (err: any) {
      console.error('Error loading document details:', err);
      setErrorMsg('ডকুমেন্ট রিড করতে সমস্যা হয়েছে। অনুগ্রহ করে নিশ্চিত করুন যে প্রয়োজনীয় পারমিশন দেওয়া আছে।');
      setDocContent('ডকুমেন্টের বিস্তারিত বিবরণী সরাসরি এখানে লোড করা যায়নি (ড্রাইভে দেখুন)।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!accessToken) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('গুগল ড্রাইভ থেকে ফাইল ডিলিট বা রিমুভ করা যায়নি।');
      }

      setSuccessMsg('ডকুমেন্টটি সফলভাবে মুছে ফেলা হয়েছে!');
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
        setDocContent('');
      }
      setDocToDelete(null);
      fetchDocs(accessToken);
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setErrorMsg('ডকুমেন্টটি মুছে ফেলা যায়নি। অনুগ্রহ করে প্রয়োজনীয় পারমিশন দেওয়া আছে কি না নিশ্চিত করুন।');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveFullDoc = async () => {
    if (!accessToken || !selectedDoc) return;
    setIsSavingFullDoc(true);
    setErrorMsg(null);
    try {
      // Step A: Fetch latest structure to get exact endIndex
      const getResponse = await fetch(`https://docs.googleapis.com/v1/documents/${selectedDoc.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!getResponse.ok) {
        throw new Error('ডকুমেন্ট এর বর্তমান সাইজ সনাক্ত করা যায়নি।');
      }

      const docData = await getResponse.json();
      const lastElement = docData.body?.content?.[docData.body.content.length - 1];
      const endIndex = lastElement?.endIndex || 2;

      let updateSuccess = false;
      let lastErrorMessage = '';

      // Try full deletion and insert first
      if (endIndex > 2) {
        try {
          const deleteRequests = [
            {
              deleteContentRange: {
                range: {
                  startIndex: 1,
                  endIndex: endIndex - 1,
                },
              },
            },
            {
              insertText: {
                text: docContent || ' ',
                location: { index: 1 },
              },
            }
          ];

          const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${selectedDoc.id}:batchUpdate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requests: deleteRequests }),
          });

          if (updateResponse.ok) {
            updateSuccess = true;
          } else {
            const errData = await updateResponse.json().catch(() => ({}));
            lastErrorMessage = errData.error?.message || 'রিলিজ রেঞ্জ লিমিট অতিক্রম করেছে বা রাইট পারমিশন নেই';
          }
        } catch (deleteError: any) {
          lastErrorMessage = deleteError.message || '';
        }
      } else {
        // Document is empty, just insert
        try {
          const insertRequests = [
            {
              insertText: {
                text: docContent || ' ',
                location: { index: 1 },
              },
            }
          ];
          const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${selectedDoc.id}:batchUpdate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requests: insertRequests }),
          });
          if (updateResponse.ok) {
            updateSuccess = true;
          } else {
            const errData = await updateResponse.json().catch(() => ({}));
            lastErrorMessage = errData.error?.message || 'ইনসার্ট ব্যর্থ হয়েছে';
          }
        } catch (insertError: any) {
          lastErrorMessage = insertError.message || '';
        }
      }

      // Fallback 1: If deletion failed (due to table/header/list lock), attempt to insert at index 1 without deleting
      if (!updateSuccess) {
        try {
          const insertRequests = [
            {
              insertText: {
                text: `${docContent || ' '}\n\n[আগের টেক্সট নিচে রয়েছে...]\n-------------------------------------------\n`,
                location: { index: 1 },
              },
            }
          ];
          const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${selectedDoc.id}:batchUpdate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requests: insertRequests }),
          });

          if (updateResponse.ok) {
            updateSuccess = true;
            setSuccessMsg('ডকুমেন্টটির ভেতরের জটিল স্ট্রাকচার (যেমন টেবিল/লিস্ট) লক থাকায় ডিলিট করা যায়নি, তবে লেখাটি ডকুমেন্টের শুরুতে সফলভাবে যুক্ত করা হয়েছে!');
          } else {
            const errData = await updateResponse.json().catch(() => ({}));
            lastErrorMessage = errData.error?.message || lastErrorMessage;
          }
        } catch (insertError: any) {
          lastErrorMessage = insertError.message || lastErrorMessage;
        }
      }

      if (!updateSuccess) {
        throw new Error(lastErrorMessage || 'ডকুমেন্ট সরাসরি রাইট বা আপডেট করা যায়নি।');
      }

      if (!successMsg || !successMsg.includes('ডকুমেন্টটির ভেতরের জটিল স্ট্রাকচার')) {
        setSuccessMsg('সম্পূর্ণ ডকুমেন্টটি সফলভাবে সংরক্ষণ করা হয়েছে!');
      }
      setIsEditingFullDoc(false);
    } catch (err: any) {
      console.error('Error saving full doc content:', err);
      setErrorMsg(`ডকুমেন্ট সেভ করা যায়নি: ${err.message || 'অনুগ্রহ করে অ্যাক্সেস পারমিশন চেক করে পুনরায় চেষ্টা করুন।'}`);
    } finally {
      setIsSavingFullDoc(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-2 pb-16 animate-fadeIn text-gray-800 dark:text-gray-100">
      {/* Messages */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-2xl border border-green-100 dark:border-green-800 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span className="font-semibold text-sm">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700 font-bold">✕</button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-2xl border border-red-100 dark:border-red-800 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-semibold text-sm">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
          </motion.div>
        )}

        {docToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDocToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl relative max-w-sm w-full border border-gray-100 dark:border-gray-700 space-y-6 z-10 text-center animate-fadeIn"
            >
              <div className="mx-auto w-14 h-14 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center">
                <ShieldAlert size={28} />
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  আপনি কি নিশ্চিত?
                </h3>
                <p className="text-xs text-gray-550 dark:text-gray-400 leading-relaxed px-2">
                  আপনি আরজিও সংস্থার ডক ফাইল <strong>"{docToDelete.name}"</strong> চিরতরে মুছে ফেলতে চলেছেন। এই ফাইলটি আপনার গুগল ড্রাইভ থেকেও সম্পূর্ণরূপে ডিলেট হয়ে যাবে এবং এটি পুনরুদ্ধার করা যাবে না।
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDocToDelete(null)}
                  className="flex-1 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-250 hover:text-gray-700 dark:hover:bg-gray-650 rounded-xl cursor-pointer transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDeleteDoc(docToDelete.id)}
                  className="flex-1 py-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer shadow-md shadow-red-200 dark:shadow-none transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      মুছে ফেলা হচ্ছে...
                    </>
                  ) : (
                    'হ্যাঁ, মুছে ফেলুন'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Link Status Top Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-3.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-2xl">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold dark:text-white">গুগল ডকস ওয়ার্কস্পেস (Google Docs)</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                RGO সংস্থার রিপোর্ট সমূহ তৈরি করুন, আর্থিক বিবরণের সরাসরি গুগল ডকস ফাইলে এক্সপোর্ট দিন।
              </p>
            </div>
          </div>

          <div>
            {!googleUser ? (
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-md active:scale-95 transition-all text-sm cursor-pointer"
              >
                <Link size={18} />
                গুগল ক্লাউড অ্যাকাউন্ট লিংক করুন
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-600">
                  <img
                    referrerPolicy="no-referrer"
                    src={googleUser.photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                    alt={googleUser.displayName || 'Google Account'}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {googleUser.displayName || googleUser.email}
                  </span>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  className="px-4 py-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-900/50 rounded-xl font-bold hover:bg-red-100 transition-colors"
                >
                  ডিসকানেক্ট
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!googleUser ? (
        // Unauthenticated Welcome Layout
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-sm border border-gray-100 dark:border-gray-700 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-4">
            <div className="mx-auto w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-[2rem] flex items-center justify-center">
              <FileText size={40} />
            </div>
            <h2 className="text-xl font-bold dark:text-white">নিরাপদ ডকস ইন্টিগ্রেশন</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Google Workspace (Drive & Google Docs) এ এক্সেস পেতে আপনার গুগল অ্যাকাউন্ট লিংক করা প্রয়োজন। এটি আপনার অনুমোদন স্বাপেক্ষে এবং যেকোনো সময় আপনি এটি ডিসকানেক্ট করতে পারেন।
            </p>
            <div className="pt-2">
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none active:scale-[0.98] transition-all"
              >
                গুগল দিয়ে শুরু করুন
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 max-w-4xl mx-auto text-left border-t border-gray-100 dark:border-gray-700">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 space-y-1">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">১. স্বয়ংক্রিয় রিপোর্ট</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">RGO অ্যাপের মোট জমা ও খরচের খতিয়ান দিয়ে সুন্দর বাংলা রিপোর্ট জেনারেট করুন এক ক্লিপে।</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 space-y-1">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">২. ডকস ফাইল আপডেট</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">বিদ্যমান যেকোনো ডক ফাইলে নোট, মন্তব্য বা সভার এজেন্ডা অ্যাপের ভেতর থেকেই সরাসরি যুক্ত করুন।</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 space-y-1">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">৩. রিয়েল-টাইম এডিটর</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">গুগল ডকস ফাইলের লাইভ প্রিভিউ দেখতে ও সরাসরি এডিট করতে পারবেন ব্রাউজার ট্যাব না হারিয়েই।</p>
            </div>
          </div>
        </div>
      ) : (
        // Main Authenticated Workspace Layout
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL: Docs List & Creation */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Action: Export stats */}
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10">
                <Sparkles size={160} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="bg-white/10 w-fit p-2.5 rounded-xl">
                  <Printer size={22} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">হিসাবের সরাসরি এক্সপোর্ট</h3>
                  <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                    অ্যাপের রিয়েল-টাইম আয়-ব্যয় এবং সমস্ত ড্যাশবোর্ড ডাটা সমন্বয় করে গুগল ডকসে ফর্ম্যাটেড পিডিএফ উপযোগী প্রতিবেদন জেনারেট করুন।
                  </p>
                </div>
                <button
                  onClick={handleExportStatsToDoc}
                  disabled={isCreating}
                  className="w-full py-3 bg-white text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
                >
                  {isCreating ? 'রিপোর্ট তৈরি হচ্ছে...' : 'মাসিক আর্থিক রিপোর্ট তৈরি করুন'}
                </button>
              </div>
            </div>

            {/* Docs Management Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  গুগল ডকফাইল সমূহ (সর্বশেষ ১৫টি)
                </span>
                <button 
                  onClick={() => fetchDocs(accessToken)} 
                  disabled={isLoading}
                  className="p-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 text-gray-600 dark:text-gray-300 rounded-lg transition-all"
                >
                  <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Create Empty Doc Section */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">নতুন ডকুমেন্ট তৈরি করুন</span>
                  <p className="text-[10px] text-gray-400">একটি ডক টেমপ্লেট নির্বাচন করুন (ঐচ্ছিক):</p>
                </div>

                {/* Template Selection Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'ফাঁকা ডক', icon: Layers, desc: 'সম্পূর্ণ ফাঁকা ডকুমেন্ট' },
                    { id: 'meeting_minutes', label: 'কার্যবিবরণী', icon: FilePlus2, desc: 'সভার আলোচ্য সূচি ও এজেন্ডা' },
                    { id: 'financial_report', label: 'আর্থিক বিবরণী', icon: Activity, desc: 'আয়-ব্যয় ও প্রস্তাবিত বাজেট' },
                    { id: 'member_list', label: 'সদস্য হাজিরা', icon: CheckCircle, desc: 'উপস্থিত সদস্য ও হাজিরার ছক' }
                  ].map((t) => {
                    const isSelected = selectedTemplate === t.id;
                    const TmpIcon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplate(t.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-400 dark:bg-blue-900/30'
                            : 'border-gray-100 dark:border-gray-750 bg-gray-50/50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <TmpIcon size={14} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
                          <span className={`text-[11px] font-bold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-650 dark:text-gray-300'}`}>
                            {t.label}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 leading-normal truncate">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ডকুমেন্টের নাম..."
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="flex-grow text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCreateEmptyDoc}
                    disabled={isCreating || !newDocTitle.trim()}
                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Loader */}
              {isLoading && docsList.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <RefreshCw className="animate-spin text-blue-500" size={24} />
                  <span className="text-xs">গুগল ড্রাইভ থেকে ফাইল খোঁজা হচ্ছে...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto no-scrollbar">
                  {docsList.length > 0 ? (
                    docsList.map((doc) => {
                      const isSelected = selectedDoc?.id === doc.id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => loadDocDetail(doc)}
                          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer border transition-all group ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'
                              : 'border-transparent bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-600'}`}>
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-xs truncate dark:text-white">{doc.name}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(doc.createdTime).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocToDelete(doc);
                            }}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 md:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all shrink-0 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      কোনো গুগল ডকস ফাইল পাওয়া যায়নি।
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Live preview, read detail, edit contents */}
          <div className="lg:col-span-8 space-y-6">
            {selectedDoc ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                
                {/* Selected header info */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-xl">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h2 className="font-bold dark:text-white text-base">{selectedDoc.name}</h2>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        আইডি: {selectedDoc.id}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedDoc.webViewLink || `https://docs.google.com/document/d/${selectedDoc.id}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold"
                    >
                      গুগল ডকসে যান
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                {/* Main Tab System: Read Preview / Edit Document */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Append / update operations */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">নোট বা রেজোলিউশন যুক্ত করুন</span>
                      {/* Language Selectors */}
                      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSpeechLanguage('bn-BD');
                            if (isListening && recognitionInstance) {
                              recognitionInstance.stop();
                            }
                          }}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            speechLanguage === 'bn-BD'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                        >
                          বাংলা 🇧🇩
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSpeechLanguage('en-US');
                            if (isListening && recognitionInstance) {
                              recognitionInstance.stop();
                            }
                          }}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            speechLanguage === 'en-US'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                        >
                          EN 🇺🇸
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">
                      RGO সভার রেজোলিউশন বা কোনো সিদ্ধান্ত সরাসরি এই ফাইলের শুরুতে সংযুক্ত করতে নিচে লিখুন অথবা ভয়েস টাইপিং আইকন ব্যবহার করে মুখে বলুন।
                    </p>
                    
                    <div className="relative">
                      <textarea
                        rows={7}
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder={
                          isListening 
                            ? (speechLanguage === 'bn-BD' ? 'আমি সাউন্ড শুনছি... মুখে স্পষ্টভাবে বলুন।' : 'Listening... Speak clearly now.')
                            : 'এখানে টাইপ করুন অথবা পাশে থাকা মাইক্রোফোন বাটন প্রেস করে মুখে বলুন...'
                        }
                        className="w-full text-xs p-4 pr-12 rounded-2xl bg-gray-50 dark:bg-gray-700/60 border border-gray-100 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                      />
                      
                      {/* Floating Mic Trigger Button */}
                      <button
                        type="button"
                        onClick={() => toggleSpeechRecognition('custom')}
                        className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg active:scale-95 transition-all outline-none cursor-pointer ${
                          isListening 
                            ? 'bg-red-500 text-white animate-pulse shadow-red-200 dark:shadow-none' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                        title={isListening ? 'রেকর্ডিং বন্ধ করুন' : 'ভয়েস টাইপিং শুরু করুন'}
                      >
                        {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                      </button>

                      {/* Quick Erase Button, shown only if customText exists */}
                      {customText.trim() && (
                        <button
                          type="button"
                          onClick={() => setCustomText('')}
                          className="absolute top-3 right-3 text-[10px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 px-2 py-1 rounded"
                        >
                          মুছুন
                        </button>
                      )}
                    </div>

                    {/* Live Dictation Status banner with ping indicators */}
                    <AnimatePresence>
                      {isListening && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="flex items-center gap-2 justify-between bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-2.5 px-4 rounded-xl text-xs border border-red-100 dark:border-red-900/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="font-semibold text-[11px]">
                              {speechLanguage === 'bn-BD' ? 'লাইভ ভয়েস টাইপিং সচল রয়েছে...' : 'Live Speech-to-Text dictation active...'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (recognitionInstance) recognitionInstance.stop();
                              setIsListening(false);
                            }}
                            className="text-[10px] bg-red-100 dark:bg-red-900/50 hover:bg-red-200 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-md font-bold cursor-pointer"
                          >
                            থামুন
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={handleAppendText}
                      disabled={isUpdating || !customText.trim()}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isUpdating ? 'সংযুক্ত হচ্ছে...' : 'ডক ফাইলে লেখা যুক্ত করুন'}
                    </button>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 mt-2">
                      <div className="flex items-start gap-2 text-gray-500">
                        <Info size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span className="text-[10px] leading-relaxed">
                          গুগল ডকস এডিট করার জন্য আপনার অ্যাকাউন্টে ওই ফাইলের "রাইটার/এডিটর" রোল থাকতে হবে। আপনার নিজের তৈরি ডকসে সম্পূর্ণ এডিট এক্সেস ডিফল্টভাবে থাকে।
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document preview block */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block animate-fadeIn">ডকুমেন্ট এডিটর ও লাইভ প্রিভিউ</span>
                        <div className="flex items-center gap-2">
                          {!isEditingFullDoc ? (
                            <button
                              type="button"
                              onClick={handleStartVoiceDictationMain}
                              className="px-2.5 py-1 text-[10px] font-bold bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-lg transition-all flex items-center gap-1 cursor-pointer animate-pulse"
                              title="মাইক্রোফোন দিয়ে সরাসরি ডক এডিট করুন"
                            >
                              <Mic size={11} />
                              ভয়েস ডিক্টেশন
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSpeechLanguage('bn-BD');
                                  if (isListening && recognitionInstance) {
                                    recognitionInstance.stop();
                                  }
                                }}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                                  speechLanguage === 'bn-BD'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                                }`}
                              >
                                বাংলা 🇧🇩
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSpeechLanguage('en-US');
                                  if (isListening && recognitionInstance) {
                                    recognitionInstance.stop();
                                  }
                                }}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                                  speechLanguage === 'en-US'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                                }`}
                              >
                                EN 🇺🇸
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingFullDoc(!isEditingFullDoc);
                              if (isListening && speechTargetRef.current === 'main') {
                                if (recognitionInstance) recognitionInstance.stop();
                                setIsListening(false);
                              }
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all cursor-pointer"
                          >
                            {isEditingFullDoc ? 'প্রিভিউ মোড' : 'সরাসরি এডিট করুন'}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        {isEditingFullDoc 
                          ? 'নিচে থাকা টেক্সট এরিয়াতে সরাসরি লিখুন অথবা মাইক্রোফোন দিয়ে ডিক্টেশন দিন:'
                          : 'ডকুমেন্টে ইতিমধ্যে থাকা লেখার মেটাডাটা ও মূল টেক্সট রিডার:'}
                      </p>
                      
                      <div className="relative">
                        {isEditingFullDoc ? (
                          <textarea
                            rows={8}
                            value={docContent}
                            onChange={(e) => setDocContent(e.target.value)}
                            placeholder={
                              isListening && speechTargetRef.current === 'main'
                                ? (speechLanguage === 'bn-BD' ? 'আমি সাউন্ড শুনছি... মুখে স্পষ্টভাবে বলুন।' : 'Listening... Speak clearly now.')
                                : 'ডকুমেন্টের মূল লেখা এখানে এডিট বা ডিক্টেশন দিন...'
                            }
                            className="w-full text-xs p-4 pr-12 rounded-2xl bg-gray-50 dark:bg-gray-700/60 border border-gray-150 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-mono text-gray-800 dark:text-gray-100"
                          />
                        ) : (
                          <div className="space-y-4 animate-fadeIn">
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-150 dark:border-gray-700 max-h-[220px] overflow-y-auto no-scrollbar">
                              {isLoading ? (
                                <div className="py-8 text-center text-xs text-gray-400">লোডিং...</div>
                              ) : (
                                <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-w-full text-gray-600 dark:text-gray-300">
                                  {docContent}
                                </pre>
                              )}
                            </div>

                            {/* Text to Speech Doc Player Component */}
                            {docContent.trim() && !isLoading && (
                              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/25 border border-blue-100/60 dark:border-blue-900/40 rounded-2xl space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <Headphones size={14} className="text-blue-500 shrink-0" />
                                    <span className="text-[10px] font-black text-blue-650 dark:text-blue-400 uppercase tracking-widest">
                                      ডকুমেন্ট অডিও রিডার (TTS)
                                    </span>
                                  </div>
                                  
                                  {isTtsSpeaking && (
                                    <span className="flex items-center gap-1 text-[9px] text-green-605 dark:text-green-400 font-black bg-green-50 dark:bg-green-950/40 px-2.5 py-0.5 rounded-full animate-pulse">
                                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                      {isTtsPaused ? 'পজ নেওয়া রয়েছে' : 'ভয়েসে পড়া হচ্ছে...'}
                                    </span>
                                  )}
                                </div>

                                {/* Dynamic Animated voice equalizer bars */}
                                {isTtsSpeaking && !isTtsPaused && (
                                  <div className="flex items-end justify-center gap-1 h-8 py-1.5 bg-white/70 dark:bg-slate-900/50 rounded-xl border border-blue-50/40 dark:border-slate-800">
                                    {[...Array(18)].map((_, i) => (
                                      <div
                                        key={i}
                                        style={{
                                          height: `${Math.floor(Math.random() * 16) + 4}px`,
                                        }}
                                        className="w-1 bg-blue-500 rounded-full animate-pulse"
                                      />
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                  {/* Control buttons */}
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={handleStartTts}
                                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-755 transition-all flex items-center gap-1.5 cursor-pointer select-none shadow hover:shadow-md"
                                      title="শুনুন"
                                    >
                                      <Play size={12} fill="currentColor" /> শুনুন
                                    </button>

                                    {isTtsSpeaking && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={handlePauseResumeTts}
                                          className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                          <Pause size={12} /> {isTtsPaused ? 'চালু করুন' : 'বিরতি নিন'}
                                        </button>
                                        
                                        <button
                                          type="button"
                                          onClick={handleStopTts}
                                          className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/30 dark:hover:bg-red-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                          <Square size={12} fill="currentColor" /> বন্ধ
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {/* Speech speed selector */}
                                  <div className="flex gap-2 flex-wrap items-center">
                                    <div className="flex items-center gap-2 bg-gray-100/60 dark:bg-gray-800/60 p-1.5 px-2.5 rounded-xl border border-gray-150/50 dark:border-gray-700/80">
                                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-wide">স্পিড:</span>
                                      <div className="flex gap-1">
                                        {[0.8, 1.0, 1.25, 1.5].map(rate => (
                                          <button
                                            type="button"
                                            key={rate}
                                            onClick={() => {
                                              setTtsRate(rate);
                                              // Automatically trigger rerun with new rate if actively speaking to maintain seamless reading!
                                              if (isTtsSpeaking && !isTtsPaused) {
                                                setTimeout(() => handleStartTts(), 80);
                                              }
                                            }}
                                            className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded transition-all cursor-pointer ${
                                              ttsRate === rate
                                                ? 'bg-blue-600 text-white shadow'
                                                : 'text-gray-500 hover:text-gray-850 dark:hover:text-gray-150'
                                            }`}
                                          >
                                            {rate}x
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Speech Voice Selection */}
                                    {supportedVoices.length > 0 && (
                                      <div className="flex items-center gap-1.5 bg-gray-100/60 dark:bg-gray-800/60 p-1.5 px-2.5 rounded-xl border border-gray-150/50 dark:border-gray-700/80 max-w-[150px]">
                                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-wide shrink-0">কণ্ঠ:</span>
                                        <select
                                          value={selectedVoiceName}
                                          onChange={(e) => {
                                            setSelectedVoiceName(e.target.value);
                                            if (isTtsSpeaking && !isTtsPaused) {
                                              setTimeout(() => handleStartTts(), 80);
                                            }
                                          }}
                                          className="text-[9px] bg-transparent border-none text-gray-700 dark:text-gray-200 outline-none font-bold truncate cursor-pointer max-w-full"
                                        >
                                          <option value="">স্বয়ংক্রিয় (Auto)</option>
                                          {supportedVoices.map(v => (
                                            <option key={v.name} value={v.name}>{v.name.replace(/Google/i, 'G')}</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}

                                    {/* Speech Pitch Selection */}
                                    <div className="flex items-center gap-2 bg-gray-100/60 dark:bg-gray-800/60 p-1.5 px-2.5 rounded-xl border border-gray-150/50 dark:border-gray-700/80">
                                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-wide">কণ্ঠস্বর (পিচ):</span>
                                      <div className="flex gap-1">
                                        {[0.8, 1.0, 1.2].map(pitch => (
                                          <button
                                            type="button"
                                            key={pitch}
                                            onClick={() => {
                                              setTtsPitch(pitch);
                                              if (isTtsSpeaking && !isTtsPaused) {
                                                setTimeout(() => handleStartTts(), 80);
                                              }
                                            }}
                                            className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                                              ttsPitch === pitch
                                                ? 'bg-blue-600 text-white shadow'
                                                : 'text-gray-500 hover:text-gray-850 dark:hover:text-gray-150'
                                            }`}
                                          >
                                            {pitch === 0.8 ? 'ভারী' : pitch === 1.2 ? 'চিকন' : 'স্বাভাবিক'}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {isEditingFullDoc && (
                          <>
                            {/* Floating Mic Trigger Button for Main Content */}
                            <button
                              type="button"
                              onClick={() => toggleSpeechRecognition('main')}
                              className={`absolute bottom-4 right-4 p-2.5 rounded-full shadow-lg active:scale-95 transition-all outline-none cursor-pointer ${
                                isListening && speechTargetRef.current === 'main'
                                  ? 'bg-red-500 text-white animate-pulse shadow-red-200 dark:shadow-none' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                              }`}
                              title={isListening && speechTargetRef.current === 'main' ? 'রেকর্ডিং বন্ধ করুন' : 'ভয়েস ডিক্টেশন শুরু করুন (বাংলা/English)'}
                            >
                              {isListening && speechTargetRef.current === 'main' ? <Mic size={16} /> : <MicOff size={16} />}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Live Dictation Status banner for Main editor */}
                      <AnimatePresence>
                        {isListening && speechTargetRef.current === 'main' && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="mt-2 flex items-center gap-2 justify-between bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-2.5 px-4 rounded-xl text-xs border border-red-100 dark:border-red-900/30"
                          >
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                              <span className="font-semibold text-[11px]">
                                {speechLanguage === 'bn-BD' 
                                  ? 'ডকুমেন্টে সরাসরি ভয়েস টাইপিং সচল রয়েছে...' 
                                  : 'Direct speech-to-document dictation active...'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (recognitionInstance) recognitionInstance.stop();
                                setIsListening(false);
                              }}
                              className="text-[10px] bg-red-100 dark:bg-red-900/50 hover:bg-red-200 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-md font-bold cursor-pointer"
                            >
                              থামুন
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {isEditingFullDoc && (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingFullDoc(false);
                              if (isListening && speechTargetRef.current === 'main') {
                                if (recognitionInstance) recognitionInstance.stop();
                                setIsListening(false);
                              }
                            }}
                            className="px-4 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-all cursor-pointer"
                          >
                            বাতিল
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveFullDoc}
                            disabled={isSavingFullDoc}
                            className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            {isSavingFullDoc ? (
                              <>
                                <RefreshCw className="animate-spin" size={13} />
                                সংরক্ষণ হচ্ছে...
                              </>
                            ) : (
                              'ডকুমেন্টে সংরক্ষণ করুন'
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl p-4 border border-yellow-100 dark:border-yellow-900/40">
                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                          <ShieldAlert size={14} />
                          মনে রাখুন (Security Warning)
                        </span>
                        <p className="text-[10px] text-yellow-600 dark:text-yellow-500 leading-relaxed mt-1">
                          আপনার গুগল ডকস ডাটায় পরিবর্তন আনার পূর্বে সতর্ক থাকুন। কোনো সংযুক্তি বা সরাসরি পরিবর্তন পুনরায় আগের অবস্থায় ফিরিয়ে আনা এখান থেকে সম্ভব নয়, তা করতে মূল গুগল ডকস লিংকে যান।
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Standard Workspace Iframe preview */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-4">গুগল ডকস রিয়েল-টাইম লাইভ উইজেট</span>
                  <div className="w-full h-[380px] bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 relative">
                    <iframe
                      src={`https://docs.google.com/document/d/${selectedDoc.id}/edit?embedded=true&rm=minimal`}
                      title="Google Doc Real-time View"
                      className="w-full h-full border-none"
                      allow="autoplay"
                    />
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center gap-4 py-20">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-full text-gray-400 mb-2">
                  <FileText size={36} />
                </div>
                <h3 className="font-bold text-base dark:text-white">কোনো ডকুমেন্ট সিলেক্ট করা নেই</h3>
                <p className="text-gray-400 text-xs max-w-sm leading-relaxed">
                  বামদিকের তালিকা থেকে যেকোনো ডকুমেন্টে ক্লিক করুন প্রিভিউ দেখার ও সভার রিপোর্ট সংযোগ করার জন্য, অথবা হিসাব এক্সপোর্ট দিয়ে নতুন একটি প্রতিবেদন ফাইল জেনারেট করুন।
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default DocsScreen;
