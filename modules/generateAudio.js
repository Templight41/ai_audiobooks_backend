const sdk = require("microsoft-cognitiveservices-speech-sdk");

module.exports = async (audioFile, text) => {
  try {
    // Create speech config from the subscription key and region
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.SPEECH_KEY,
      process.env.SPEECH_REGION
    );
    
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;

    // Configure the audio output (set the path to the audio file)
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

    // Set the voice name (you can change the voice here)
    speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural";

    // Create a new speech synthesizer with the given config
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    // Convert the callback-based speakTextAsync to a Promise for async/await
    const synthesizeSpeech = (text) => {
      return new Promise((resolve, reject) => {
        synthesizer.speakTextAsync(
          text,
          (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              console.log("Synthesis finished.");
              resolve(result); // Resolve the Promise on success
            } else {
              console.error(
                "Speech synthesis canceled: " + result.errorDetails
              );
              reject(new Error(result.errorDetails)); // Reject the Promise on error
            }
            synthesizer.close();
          },
          (err) => {
            console.trace("Error: " + err);
            synthesizer.close();
            reject(err); // Reject the Promise on failure
          }
        );
      });
    };

    // Await the synthesis process
    await synthesizeSpeech(text);

    // Return success
    return 1;
  } catch (error) {
    console.error("Error during speech synthesis:", error);
    return -1;
  }
};
