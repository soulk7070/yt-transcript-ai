import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function GET(req:NextRequest){
  try{const key=req.headers.get("x-assemblyai-key");const id=new URL(req.url).searchParams.get("id");if(!key||!id)return NextResponse.json({error:"Missing key or id."},{status:400});const r=await fetch(`https://api.assemblyai.com/v2/transcript/${encodeURIComponent(id)}`,{headers:{authorization:key}});const d=await r.json();if(!r.ok)return NextResponse.json({error:d?.error||"Status request failed."},{status:r.status});return NextResponse.json(d)}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Status request failed"},{status:500})}
}
