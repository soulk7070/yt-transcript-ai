import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function POST(req:NextRequest){
  try{
    const key=req.headers.get("x-assemblyai-key");
    if(!key)return NextResponse.json({error:"AssemblyAI API key is required."},{status:401});
    const bytes=await req.arrayBuffer();
    if(!bytes.byteLength)return NextResponse.json({error:"Empty file."},{status:400});
    const r=await fetch("https://api.assemblyai.com/v2/upload",{method:"POST",headers:{authorization:key,"content-type":"application/octet-stream"},body:bytes});
    const data=await r.json();
    if(!r.ok)return NextResponse.json({error:data?.error||"Upload failed."},{status:r.status});
    return NextResponse.json(data);
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Upload failed"},{status:500})}
}
