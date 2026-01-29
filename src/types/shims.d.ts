// Minimal shims for modules lacking type declarations
declare module 'fluent-ffmpeg' {
  interface FfmpegCommand {
    output(path: string): FfmpegCommand;
    outputOptions(opts: string[] | string): FfmpegCommand;
    addOption(flag: string, value?: string): FfmpegCommand;
    audioChannels(n: number): FfmpegCommand;
    audioFrequency(n: number): FfmpegCommand;
    audioCodec(codec: string): FfmpegCommand;
    format(fmt: string): FfmpegCommand;
    on(event: 'end' | 'error', cb: (...args: any[]) => void): FfmpegCommand;
    run(): void;
  }
  interface FfmpegStaticApi extends FfmpegCommand {
    setFfmpegPath(p: string): void;
    setFfprobePath(p: string): void;
    ffprobe(path: string, cb: (err: any, metadata: any) => void): void;
  }
  const ffmpeg: FfmpegStaticApi;
  export default ffmpeg;
}

declare module 'ffmpeg-static' {
  const ffmpegPath: string;
  export default ffmpegPath;
}

declare module 'ffprobe-static' {
  const ffprobe: { path: string } | string;
  export default ffprobe;
}






































































































