export const getUserLoraPrompt = (fineTune: API.FineTune) => {
  return (fineTune.typeParams as API.FineTunePersonTypeParams).gender === 'MALE'
    ? `an extremely delicate and beautiful female, masterpiece, best quality, ultra high res, (photorealistic:1.4), real, <lora:${fineTune.uniqueToken}:1>`
    : `a handsome male, masterpiece, best quality, ultra high res, (photorealistic:1.4), real, <lora:${fineTune.uniqueToken}:1>`;
};
