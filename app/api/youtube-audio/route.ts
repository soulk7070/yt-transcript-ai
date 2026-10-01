import {NextRequest,NextResponse} from "next/server";
function validYouTube(url:string){try{const u=new URL(url);return ["youtube.com","www.youtube.com","m.youtube.com","youtu.be","www.youtube-nocookie.com"].includes(u.hostname)}catch{return false}}
export async function POST(req:NextRequest){
  try{
    const {url}=await req.json();
    if(!url||!validYouTube(url))return NextResponse.json({error:"Please enter a valid YouTube URL."},{status:400});
    const base=process.env.YOUTUBE_EXTRACTOR_URL;
    if(!base)return NextResponse.json({error:"YouTube extractor is not configured. Set YOUTUBE_EXTRACTOR_URL in Vercel."},{status:503});
    const r=await fetch(`${base.replace(/\/$/,"")}/extract`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url}),signal:AbortSignal.timeout(55000)});
    const d=await r.json();
    if(!r.ok)return NextResponse.json({error:d?.detail||d?.error||"YouTube extraction failed."},{status:r.status});
    return NextResponse.json({audio_url:d.audio_url});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"YouTube extraction failed. yt-dlp is required on the server."},{status:500})}
}
