import { spawn } from "child_process"

export async function checkFFmpegAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", ["-version"])

    ffmpeg.on("error", () => {
      resolve(false)
    })

    ffmpeg.on("close", (code) => {
      resolve(code === 0)
    })
  })
}

export async function convertWebmToMp3(inputBuffer: Buffer): Promise<Buffer> {
  const isFFmpegAvailable = await checkFFmpegAvailability()
  if (!isFFmpegAvailable) {
    throw new Error(
      "FFmpeg is not installed. Please install FFmpeg to use SiliconFlow API.",
    )
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      "pipe:0", // Read from stdin
      "-f",
      "mp3", // Output format
      "-acodec",
      "libmp3lame", // MP3 codec
      "-ab",
      "128k", // Bitrate
      "-ar",
      "44100", // Sample rate
      "-ac",
      "2", // Channels
      "pipe:1", // Write to stdout
    ])

    const chunks: Buffer[] = []

    ffmpeg.stdout.on("data", (chunk) => {
      chunks.push(chunk)
    })

    ffmpeg.stderr.on("data", (data) => {
      console.error(`FFmpeg stderr: ${data}`)
    })

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks))
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`))
      }
    })

    ffmpeg.stdin.write(inputBuffer)
    ffmpeg.stdin.end()
  })
}
