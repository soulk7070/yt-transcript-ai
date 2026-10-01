import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function POST(req:NextRequest){
  try{
    const key=req.headers.get("x-assemblyai-key");
    if(!key)return NextResponse.json({error:"AssemblyAI API key is required."},{status:401});
    const body=await req.json();
    const audio_url=body.audio_url;
    if(!audio_url)return NextResponse.json({error:"audio_url is required."},{status:400});
    const r=await fetch("https://api.assemblyai.com/v2/transcript",{method:"POST",headers:{authorization:key,"content-type":"application/json"},body:JSON.stringify({audio_url,speech_models:["universal-3-5-pro","universal-2"],language_detection:true})});
    const data=await r.json();
    if(!r.ok)return NextResponse.json({error:data?.error||"AssemblyAI request failed."},{status:r.status});
    return NextResponse.json({id:data.id,status:data.status});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Request failed"},{status:500})}
}
