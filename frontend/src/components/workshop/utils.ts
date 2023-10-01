export const matchLora = (prompt: string) => {
  if (!prompt) return [];
  const regex = /<lora:([0-9a-z]+):[0-1]+(\.[0-9]+)?>/g;
  const matchRes = [...prompt.matchAll(regex)];
  return matchRes.map((e) => e[1]);
};

export const matchStyle = (prompt: string) => {
  if (!prompt) return [];
  const regex = /<([0-9a-z]+)>/g;
  const matchRes = [...prompt.matchAll(regex)];
  return matchRes.map((e) => e[1]);
};

export const removeModelFromPrompt = (
  uniqueToken: string,
  originPrompt: string,
  type: API.FineTuneType,
) => {
  const pattern =
    type === 'PERSON'
      ? new RegExp(`<lora:${uniqueToken}:[0-1]+(\\.[0-9]+)?>`, 'g')
      : new RegExp(`<${uniqueToken}>`, 'g');
  return originPrompt.replace(pattern, '');
};

export const removeModelsFromPrompt = (
  uniqueTokens: string[],
  originPrompt: string,
  type: API.FineTuneType,
) => {
  let prompt = originPrompt;
  for (const token of uniqueTokens) {
    prompt = removeModelFromPrompt(token, prompt, type);
  }
  return prompt;
};

export const getMarketResourcePrice = (marketResource?: API.MarketResource) => {
  if (!marketResource) return 0;
  if (
    marketResource.free ||
    new Date(marketResource.freeEnd).getTime() >= Date.now()
  ) {
    return 0;
  } else {
    return marketResource.price;
  }
};
