"use client";
import {useEffect,useRef,useState} from "react";
import Settings from "../components/Settings";
import TranscriptViewer from "../components/TranscriptViewer";
import type {TranscriptResult,Word,Segment} from "../lib/types";

function ytId(url:string){try{const u=new URL(url);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1).split("/")[0];return u.searchParams.get("v")}catch{return null}}

export default function Home(){
 const [key,setKey]=useState(""); const [settings,setSettings]=useState(false); const [tab,setTab]=useState<"youtube"|"mp3">("youtube"); const [url,setUrl]=useState(""); const [file,setFile]=useState<File|null>(null); const [status,setStatus]=useState(""); const [error,setError]=useState(""); const [data,setData]=useState<TranscriptResult|null>(null); const [logs,setLogs]=useState<string[]>([]); const iframe=useRef<HTMLIFrameElement>(null);
 useEffect(()=>setKey(localStorage.getItem("aai_key")||""),[]);
 const saveKey=(v:string)=>{setKey(v);if(v)localStorage.setItem("aai_key",v);else localStorage.removeItem("aai_key")};
 const log=(msg:string)=>setLogs(x=>[...x,`[${new Date().toLocaleTimeString()}] ${msg}`]);
 async function transcribe(){
  setError("");setData(null);setLogs([]);if(!key){setSettings(true);return}
  try{
   let audioUrl="";
   if(tab==="youtube"){
    const id=ytId(url);if(!id)throw Error("Masukkan link YouTube yang valid.");log("✓ YouTube URL terdeteksi");setStatus("Mengambil audio…");log("→ Meminta audio stream ke extractor…");
    const r=await fetch("/api/youtube-audio",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url})});const d=await r.json();if(!r.ok)throw Error(d.error||"YouTube extraction failed");audioUrl=d.audio_url;log("✓ Audio stream siap");
   }else{
    if(!file)throw Error("Pilih file MP3 terlebih dahulu.");setStatus("Uploading MP3…");log(`→ Uploading ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)…`);
    const bytes=await file.arrayBuffer();const r=await fetch("/api/upload",{method:"POST",headers:{"x-assemblyai-key":key,"content-type":"application/octet-stream"},body:bytes});const d=await r.json();if(!r.ok)throw Error(d.error||"Upload failed");audioUrl=d.upload_url;log("✓ Audio berhasil di-upload");
   }
   setStatus("Mengirim ke AssemblyAI…");log("→ Membuat transcription job di AssemblyAI…");
   const s=await fetch("/api/transcribe",{method:"POST",headers:{"x-assemblyai-key":key,"content-type":"application/json"},body:JSON.stringify({audio_url:audioUrl})});const sd=await s.json();if(!s.ok)throw Error(sd.error||"AssemblyAI request failed");log(`✓ Job dibuat: ${sd.id}`);
   let done=false;while(!done){await new Promise(r=>setTimeout(r,2500));const p=await fetch(`/api/status?id=${encodeURIComponent(sd.id)}`,{headers:{"x-assemblyai-key":key}});const d=await p.json();if(!p.ok)throw Error(d.error||"Status request failed");setStatus(d.status==="completed"?"Selesai!":`Transcribing… ${d.status}`);if(d.status==="completed"){
      const words:Word[]=d.words||[];let segments:Segment[]=(d.sentences||[]).map((x:any)=>({text:x.text,start:x.start,end:x.end,words:x.words}));if(!segments.length)segments=[{text:d.text||"",start:0,end:(d.audio_duration||0)*1000,words}];setData({id:d.id,text:d.text||"",words,segments,duration:d.audio_duration});log(`✓ Selesai — ${words.length} words`);done=true;
    }else if(d.status==="error")throw Error(d.error||"Transcription failed");else log(`… status: ${d.status}`);
   }
  }catch(e){const msg=e instanceof Error?e.message:"Something went wrong";setError(msg);log(`✕ ${msg}`);setStatus("")}
 }
 function seek(ms:number){const id=ytId(url);if(tab==="youtube"&&id)iframe.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func:"seekTo",args:[ms/1000,true]}),"*")}
 const id=ytId(url);
 return <main className="min-h-screen"><header className="mx-auto max-w-6xl px-5 py-5 flex items-center justify-between"><div className="font-bold text-xl">YT Transcript <span className="text-zinc-500">AI</span></div><button onClick={()=>setSettings(true)} className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm">⚙ Settings</button></header>
 <section className="mx-auto max-w-4xl px-5 pt-12 pb-10 text-center"><div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">Powered by AssemblyAI</div><h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight">YouTube & MP3<br/><span className="text-zinc-400">to Transcript.</span></h1><p className="mx-auto mt-5 max-w-2xl text-zinc-400">Transcribe audio with word-level timestamps and jump directly to the right moment in your YouTube video.</p>
 <div className="glass mt-10 rounded-3xl p-4 sm:p-6 text-left"><div className="flex gap-2 mb-5"><button onClick={()=>setTab("youtube")} className={`px-4 py-2 rounded-xl text-sm ${tab==="youtube"?"bg-white text-black":"bg-white/5 text-zinc-300"}`}>YouTube</button><button onClick={()=>setTab("mp3")} className={`px-4 py-2 rounded-xl text-sm ${tab==="mp3"?"bg-white text-black":"bg-white/5 text-zinc-300"}`}>MP3</button></div>{tab==="youtube"?<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-4 outline-none"/>:<label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center"><input type="file" accept="audio/mpeg,.mp3,audio/*" className="hidden" onChange={e=>setFile(e.target.files?.[0]||null)}/><div className="text-zinc-300">{file?file.name:"Tap to choose an MP3/audio file"}</div><div className="text-xs text-zinc-500 mt-2">File dikirim langsung untuk diproses AssemblyAI</div></label>}<button onClick={transcribe} disabled={!!status} className="mt-4 w-full rounded-2xl bg-white text-black py-4 font-semibold disabled:opacity-60">{status||"Transcribe"}</button>{error&&<div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{error}</div>}
 {logs.length>0&&<details open className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3"><summary className="cursor-pointer text-sm text-zinc-300">Activity log ({logs.length})</summary><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-6 text-zinc-500">{logs.join("\n")}</pre></details>}</div></section>
 {data&&<section className="mx-auto max-w-6xl px-5 pb-16">{tab==="youtube"&&id&&<div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black"><iframe ref={iframe} title="YouTube player" className="w-full h-full" src={`https://www.youtube.com/embed/${id}?enablejsapi=1&origin=${typeof window!=="undefined"?encodeURIComponent(window.location.origin):""}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/></div>}<TranscriptViewer data={data} onSeek={seek}/><div className="mt-4 text-xs text-zinc-500">Word timestamps berasal dari AssemblyAI. Timestamp dikembalikan dalam milidetik dan dipakai untuk seek ke posisi video.</div></section>}{settings&&<Settings value={key} onSave={saveKey} onClose={()=>setSettings(false)}/>}</main>
}
