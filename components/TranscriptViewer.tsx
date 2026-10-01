"use client";
import {useMemo,useRef,useState} from "react";
import type {TranscriptResult,Segment} from "../lib/types";

const fmt=(ms:number)=>{const s=Math.max(0,Math.floor(ms/1000)),m=Math.floor(s/60),h=Math.floor(m/60);const ss=String(s%60).padStart(2,"0"),mm=String(m%60).padStart(2,"0");return h?`${h}:${mm}:${ss}`:`${mm}:${ss}`};

function buildTxt(data:TranscriptResult){return data.segments.map(s=>`[${fmt(s.start)}] ${s.text}`).join("\n");}
function buildSrt(data:TranscriptResult){return data.segments.map((s,i)=>`${i+1}\n${fmtSrt(s.start)} --> ${fmtSrt(s.end)}\n${s.text}\n`).join("\n");}
function fmtSrt(ms:number){const t=Math.max(0,Math.round(ms)),h=Math.floor(t/3600000),m=Math.floor((t%3600000)/60000),s=Math.floor((t%60000)/1000),x=t%1000;return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(x).padStart(3,"0")}`;}
function download(name:string,content:string,mime:string){const blob=new Blob([content],{type:mime});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}

export default function TranscriptViewer({data,onSeek}:{data:TranscriptResult,onSeek:(ms:number)=>void}){
 const [q,setQ]=useState(""); const [copied,setCopied]=useState(false); const [active,setActive]=useState(-1); const refs=useRef<(HTMLButtonElement|null)[]>([]);
 const segs=useMemo<Segment[]>(()=>data.segments.length?data.segments:data.words.map(w=>({text:w.text,start:w.start,end:w.end,words:[w]})),[data]);
 const filtered=segs.map((s,i)=>({...s,i})).filter(s=>s.text.toLowerCase().includes(q.toLowerCase()));
 async function copy(){await navigator.clipboard.writeText(buildTxt(data));setCopied(true);setTimeout(()=>setCopied(false),1500);}
 function seek(ms:number,i:number){setActive(i);refs.current[i]?.scrollIntoView({behavior:"smooth",block:"center"});onSeek(ms);}
 return <div className="mt-6">
   <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-semibold">Transcript</h2><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search transcript…" className="w-full sm:w-52 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"/></div>
   <div className="flex flex-wrap gap-2 mb-3"><button onClick={copy} className="rounded-xl bg-white text-black px-3 py-2 text-sm font-medium">{copied?"Copied ✓":"Copy"}</button><button onClick={()=>download("transcript.txt",buildTxt(data),"text/plain;charset=utf-8")} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm">Download TXT</button><button onClick={()=>download("transcript.srt",buildSrt(data),"application/x-subrip;charset=utf-8")} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm">Download SRT</button></div>
   <div className="max-h-[55vh] overflow-auto rounded-2xl border border-white/8 bg-black/20 p-3 space-y-1">{filtered.map(s=><button key={s.i} ref={el=>{refs.current[s.i]=el}} onClick={()=>seek(s.start,s.i)} className={`w-full text-left rounded-xl p-3 transition ${active===s.i?"bg-white/10 ring-1 ring-white/10":"hover:bg-white/5"}`}><span className="mr-3 text-xs tabular-nums text-zinc-400">{fmt(s.start)}</span><span className="text-zinc-100">{s.text}</span></button>)}{!filtered.length&&<div className="p-8 text-center text-zinc-500">No matches.</div>}</div>
   <div className="mt-3 text-xs text-zinc-500">{segs.length} segments · {data.words.length} words · word timestamps in milliseconds</div>
 </div>;
}
