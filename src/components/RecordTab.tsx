import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProcessingStep = 'idle' | 'recording' | 'transcribing' | 'sending' | 'parsing' | 'done' | 'error';

const stepLabels: Record<ProcessingStep, { icon: React.ReactNode; label: string }> = {
  idle: { icon: <Mic className="w-5 h-5" />, label: "Tap to start recording" },
  recording: { icon: <div className="w-5 h-5 rounded-full bg-destructive animate-pulse-record" />, label: "Recording..." },
  transcribing: { icon: <Loader2 className="w-5 h-5 animate-spin" />, label: "Transcribing..." },
  sending: { icon: <Loader2 className="w-5 h-5 animate-spin" />, label: "Sending to AI..." },
  parsing: { icon: <Loader2 className="w-5 h-5 animate-spin" />, label: "Parsing..." },
  done: { icon: <CheckCircle2 className="w-5 h-5 text-success" />, label: "Items ready in Pending Room" },
  error: { icon: <AlertCircle className="w-5 h-5 text-destructive" />, label: "Something went wrong" },
};

interface RecordTabProps {
  onItemsParsed: () => void;
}

export default function RecordTab({ onItemsParsed }: RecordTabProps) {
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [transcript, setTranscript] = useState("");
  const [itemCount, setItemCount] = useState(0);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== 'no-speech') {
        toast.error("Recording error: " + event.error);
        setStep('error');
      }
    };

    recognition.onend = () => {
      if (step === 'recording') {
        // Auto-stopped, process the transcript
        if (finalTranscript.trim()) {
          processTranscript(finalTranscript.trim());
        } else {
          setStep('idle');
          toast.error("No speech detected");
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStep('recording');
    setTranscript("");
  }, [step]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      setStep('transcribing');
      recognitionRef.current.stop();
      recognitionRef.current = null;
      // onend handler will trigger processTranscript
    }
  }, []);

  const processTranscript = async (text: string) => {
    try {
      // Save to master_log
      setStep('sending');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); setStep('error'); return; }

      const { data: logEntry, error: logError } = await supabase
        .from('master_log')
        .insert({ raw_text: text, source: 'voice', user_id: user.id })
        .select()
        .single();

      if (logError) throw logError;

      // Call AI parsing edge function
      setStep('parsing');
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-transcript', {
        body: { transcript: text, masterLogId: logEntry.id }
      });

      if (parseError) throw parseError;

      const items = parseResult?.items || [];
      setItemCount(items.length);

      // Update master_log
      await supabase
        .from('master_log')
        .update({ processed_by: 'gemini', inbox_refs: items.map((i: any) => i.inbox_id) })
        .eq('id', logEntry.id);

      setStep('done');
      toast.success(`${items.length} item(s) ready in Pending Room`);
      onItemsParsed();
    } catch (err: any) {
      console.error("Processing error:", err);
      toast.error(err.message || "Failed to process transcript");
      setStep('error');
    }
  };

  const handleToggle = () => {
    if (step === 'recording') {
      stopRecording();
    } else if (step === 'idle' || step === 'done' || step === 'error') {
      startRecording();
    }
  };

  const isProcessing = ['transcribing', 'sending', 'parsing'].includes(step);
  const currentStep = stepLabels[step];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      <div className="text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-2">Voice Capture</h2>
        <p className="text-muted-foreground text-sm mb-8">
          Speak naturally — AI will parse your tasks, decisions, and calendar events.
        </p>

        {/* Record Button */}
        <button
          onClick={handleToggle}
          disabled={isProcessing}
          className={`
            w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 transition-all
            ${step === 'recording' 
              ? 'bg-destructive/20 border-4 border-destructive shadow-lg shadow-destructive/20' 
              : isProcessing 
                ? 'bg-muted border-4 border-border cursor-not-allowed'
                : 'bg-primary/10 border-4 border-primary hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20'
            }
          `}
        >
          {step === 'recording' ? (
            <MicOff className="w-12 h-12 text-destructive" />
          ) : isProcessing ? (
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
          ) : (
            <Mic className="w-12 h-12 text-primary" />
          )}
        </button>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {currentStep.icon}
          <span className="text-sm font-medium">
            {step === 'done' ? `${itemCount} ${currentStep.label}` : currentStep.label}
          </span>
        </div>

        {/* Processing Steps */}
        {(isProcessing || step === 'done') && (
          <Card className="p-4 text-left animate-slide-up">
            <div className="space-y-2">
              {(['transcribing', 'sending', 'parsing', 'done'] as ProcessingStep[]).map((s, i) => {
                const isActive = s === step;
                const isDone = ['transcribing', 'sending', 'parsing', 'done'].indexOf(step) > i;
                return (
                  <div key={s} className="flex items-center gap-2 text-sm">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-border" />
                    )}
                    <span className={isDone ? "text-success" : isActive ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {stepLabels[s].label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Transcript Preview */}
        {transcript && (
          <Card className="mt-4 p-4 text-left animate-slide-up">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Transcript</p>
            <p className="text-sm">{transcript}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
