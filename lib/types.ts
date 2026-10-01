export type Word={text:string;start:number;end:number;confidence?:number};
export type Segment={text:string;start:number;end:number;words?:Word[]};
export type TranscriptResult={id:string;text:string;words:Word[];segments:Segment[];duration?:number};
