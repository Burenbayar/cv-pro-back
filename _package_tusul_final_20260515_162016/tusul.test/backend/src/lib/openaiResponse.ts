type OpenAiResponsePayload = {
  output_text?: string;
  status?: string;
  error?: {message?: string};
  output?: Array<{
    type?: string;
    content?: Array<{type?: string; text?: string}>;
    text?: string;
  }>;
};

export function extractOpenAiResponseText(data: OpenAiResponsePayload): string {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks: string[] = [];
  for (const item of data.output || []) {
    if (item.type === 'message' && Array.isArray(item.content)) {
      for (const part of item.content) {
        if ((part.type === 'output_text' || part.type === 'text') && part.text) {
          chunks.push(part.text);
        }
      }
    }
    if (item.type === 'output_text' && item.text) {
      chunks.push(item.text);
    }
  }

  return chunks.join('\n').trim();
}

export function formatOpenAiHttpError(status: number, data: OpenAiResponsePayload) {
  const apiMessage = data.error?.message;
  return apiMessage ? `HTTP_${status}: ${apiMessage}` : `HTTP_${status}`;
}
